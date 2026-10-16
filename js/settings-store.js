// Settings load and save through Supabase; this is the only settings persistence layer.
(function () {
  "use strict";

  var LEGACY_KEY = "myCSDSettings";
  var COLUMNS = "target, dday, sidang, message_style, updated_at";

  function getClient() {
    var client = window.MYCSD_AUTH && window.MYCSD_AUTH.getClient();
    if (!client) throw new Error("Supabase is not configured.");
    return client;
  }

  function defaults(config) {
    return {
      target: config.target,
      dday: config.dday,
      sidang: config.sidang,
      message_style: config.messageStyle || "motivational"
    };
  }

  function mapRow(row) {
    return {
      target: Number(row.target),
      dday: row.dday,
      sidang: row.sidang,
      messageStyle: row.message_style
    };
  }

  function readLegacy() {
    try {
      var raw = localStorage.getItem(LEGACY_KEY);
      if (raw === null) return null;
      var saved = JSON.parse(raw);
      if (!saved || typeof saved !== "object") return null;
      return {
        target: Number(saved.target),
        dday: String(saved.dday || ""),
        sidang: String(saved.sidang || "").trim(),
        message_style: saved.message_style || saved.messageStyle || "motivational"
      };
    } catch (error) {
      return null;
    }
  }

  function removeLegacy() {
    try { localStorage.removeItem(LEGACY_KEY); } catch (error) { /* Storage may be disabled. */ }
  }

  async function readRow(client) {
    var result = await client.from("settings").select(COLUMNS).maybeSingle();
    if (result.error) throw result.error;
    return result.data;
  }

  async function load(config) {
    var client = getClient();
    var row = await readRow(client);
    if (row) {
      removeLegacy();
      return mapRow(row);
    }

    var initial = readLegacy() || defaults(config);
    var result = await client.from("settings").upsert(initial, {
      onConflict: "user_id",
      ignoreDuplicates: true
    });
    if (result.error) throw result.error;

    // Read the stored winner after the conflict-safe insert, including a concurrent login.
    row = await readRow(client);
    if (!row) throw new Error("Settings row was not created.");
    removeLegacy();
    return mapRow(row);
  }

  async function save(settings) {
    var session = await window.MYCSD_AUTH.getSession();
    var userId = session && session.user && session.user.id;
    if (!userId) throw new Error("No signed-in user.");

    var values = {
      target: Number(settings.target),
      dday: String(settings.dday),
      sidang: String(settings.sidang).trim(),
      message_style: settings.messageStyle,
      updated_at: new Date().toISOString()
    };
    var result = await getClient().from("settings")
      .update(values)
      .eq("user_id", userId)
      .select(COLUMNS)
      .maybeSingle();
    if (result.error) {
      console.error("Supabase settings save failed", {
        message: result.error.message,
        code: result.error.code,
        details: result.error.details
      });
      throw result.error;
    }
    if (!result.data) throw new Error("Settings row was not updated.");
    return mapRow(result.data);
  }

  window.MYCSD_SETTINGS_STORE = { load: load, save: save };
}());
