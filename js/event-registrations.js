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

  function uniqueIds(values) {
    var seen = Object.create(null);
    return (values || []).map(eventId).filter(function (id) {
      if (seen[id]) return false;
      seen[id] = true;
      return true;
    });
  }

  // Adds many registrations in one statement; existing rows are left alone.
  async function addRegistered(values) {
    var ids = uniqueIds(values);
    if (ids.length === 0) return;
    var result = await client().from(TABLE).upsert(
      ids.map(function (id) { return { event_id: id }; }),
      { onConflict: "user_id,event_id", ignoreDuplicates: true }
    );
    if (result.error) throw result.error;
  }

  // Removes many registrations in one statement.
  async function removeRegistered(values) {
    var ids = uniqueIds(values);
    if (ids.length === 0) return;
    var result = await client().from(TABLE).delete().in("event_id", ids);
    if (result.error) throw result.error;
  }

  // Ticking is idempotent: a repeated insert keeps the existing row.
  async function setRegistered(value, registered) {
    var id = eventId(value);

    if (registered) {
      await addRegistered([id]);
      return;
    }

    var removed = await client().from(TABLE).delete().eq("event_id", id);
    if (removed.error) throw removed.error;
  }

  window.MYCSD_EVENT_REGISTRATIONS = {
    loadRegistered: loadRegistered,
    addRegistered: addRegistered,
    removeRegistered: removeRegistered,
    setRegistered: setRegistered
  };
}());
