// Per-account event registrations. The browser never sends user_id; the table
// defaults it to auth.uid() and row-level security keeps accounts apart.
(function () {
  "use strict";

  var TABLE = "event_registrations";
  var PAGE_SIZE = 1000;

  function client() {
    var instance = window.MYCSD_AUTH && window.MYCSD_AUTH.getClient();
    if (!instance) throw new Error("Supabase is not configured.");
    return instance;
  }

  function eventId(value) {
    var id = String(value === null || value === undefined ? "" : value).trim();
    if (id.length < 1 || id.length > 100) {
      throw new Error("Event id must be 1 to 100 characters.");
    }
    return id;
  }

  // Returns a Set of the signed-in user's event ids.
  async function loadRegistered() {
    var rows = [];
    var from = 0;
    while (true) {
      var result = await client().from(TABLE)
        .select("event_id")
        .order("event_id", { ascending: true })
        .range(from, from + PAGE_SIZE - 1);
      if (result.error) throw result.error;
      var page = result.data || [];
      rows = rows.concat(page);
      if (page.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }
    return new Set(rows.map(function (row) { return row.event_id; }));
  }

  // Ticking is idempotent: a repeated insert keeps the existing row.
  async function setRegistered(value, registered) {
    var id = eventId(value);

    if (registered) {
      var result = await client().from(TABLE).upsert(
        { event_id: id },
        { onConflict: "user_id,event_id", ignoreDuplicates: true }
      );
      if (result.error) throw result.error;
      return;
    }

    var removed = await client().from(TABLE).delete().eq("event_id", id);
    if (removed.error) throw removed.error;
  }

  window.MYCSD_EVENT_REGISTRATIONS = {
    loadRegistered: loadRegistered,
    setRegistered: setRegistered
  };
}());
