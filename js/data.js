// Unified data layer: Supabase for signed-in users, localStorage for demo mode.
// Demo mode never creates a Supabase client and never touches the database.
(function () {
  "use strict";

  var GUEST_FLAG = "myCSDDemoMode";
  var LEGACY_SETTINGS_KEY = "myCSDSettings";
  var LOCAL_ACTIVITIES_KEY = "myCSD.demo.activities.v1";
  var LOCAL_SETTINGS_KEY = "myCSD.demo.settings.v1";
  var ACTIVITY_COLUMNS = "id, sidang, name, points, level, date, confirmed, created_at";
  var SETTINGS_COLUMNS = "target, dday, sidang, message_style, updated_at";
  var EXPORT_VERSION = 3;
  var PAGE_SIZE = 1000;
  var IMPORT_BATCH_SIZE = 500;
  var MESSAGE_STYLES = ["motivational", "harsh", "off"];

  function readJson(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (error) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function isGuest() {
    try {
      return localStorage.getItem(GUEST_FLAG) === "true";
    } catch (error) {
      return false;
    }
  }

  function enterGuest() {
    try {
      localStorage.setItem(GUEST_FLAG, "true");
    } catch (error) {
      throw new Error("This browser cannot save demo data.");
    }
  }

  function leaveGuest() {
    try {
      localStorage.removeItem(GUEST_FLAG);
    } catch (error) {
      // The flag may already be unavailable; access checks still require a session.
    }
  }

  function authClient() {
    var client = window.MYCSD_AUTH && window.MYCSD_AUTH.getClient();
    if (!client) throw new Error("Supabase is not configured.");
    return client;
  }

  function configValue() {
    return window.MYCSD_CONFIG || {};
  }

  function settingsDefaults(config) {
    return {
      target: config.target,
      dday: config.dday,
      sidang: config.sidang,
      message_style: config.messageStyle || "motivational"
    };
  }

  function mapSettings(row) {
    return {
      target: Number(row.target),
      dday: row.dday,
      sidang: row.sidang,
      messageStyle: row.message_style
    };
  }

  function readLegacy() {
    try {
      var raw = localStorage.getItem(LEGACY_SETTINGS_KEY);
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
    try { localStorage.removeItem(LEGACY_SETTINGS_KEY); } catch (error) { /* Storage may be disabled. */ }
  }

  function localSettings() {
    var saved = readJson(LOCAL_SETTINGS_KEY, null);
    if (saved && typeof saved === "object") {
      return {
        target: Number(saved.target) || 300,
        dday: String(saved.dday || "2027-07-18"),
        sidang: String(saved.sidang || "2026/2027").trim(),
        message_style: MESSAGE_STYLES.indexOf(saved.message_style) >= 0 ? saved.message_style : "motivational",
        updated_at: String(saved.updated_at || "")
      };
    }

    var initial = settingsDefaults(configValue());
    initial.target = Number(initial.target) || 300;
    initial.dday = String(initial.dday || "2027-07-18");
    initial.sidang = String(initial.sidang || "2026/2027").trim();
    initial.message_style = MESSAGE_STYLES.indexOf(initial.message_style) >= 0 ? initial.message_style : "motivational";
    initial.updated_at = new Date().toISOString();
    writeJson(LOCAL_SETTINGS_KEY, initial);
    return initial;
  }

  async function readRemoteSettings(client) {
    var result = await client.from("settings").select(SETTINGS_COLUMNS).maybeSingle();
    if (result.error) throw result.error;
    return result.data;
  }

  async function loadRemoteSettings(config) {
    var client = authClient();
    var row = await readRemoteSettings(client);
    if (row) {
      removeLegacy();
      return mapSettings(row);
    }

    var initial = readLegacy() || settingsDefaults(config);
    var result = await client.from("settings").upsert(initial, {
      onConflict: "user_id",
      ignoreDuplicates: true
    });
    if (result.error) throw result.error;

    // Read the stored winner after the conflict-safe insert, including a concurrent login.
    row = await readRemoteSettings(client);
    if (!row) throw new Error("Settings row was not created.");
    removeLegacy();
    return mapSettings(row);
  }

  async function saveRemoteSettings(settings) {
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
    var result = await authClient().from("settings")
      .update(values)
      .eq("user_id", userId)
      .select(SETTINGS_COLUMNS)
      .maybeSingle();
    if (result.error) throw result.error;
    if (!result.data) throw new Error("Settings row was not updated.");
    return mapSettings(result.data);
  }

  async function loadSettings(config) {
    if (isGuest()) return mapSettings(localSettings());
    return loadRemoteSettings(config);
  }

  async function saveSettings(settings) {
    if (isGuest()) {
      var values = {
        target: Number(settings.target),
        dday: String(settings.dday),
        sidang: String(settings.sidang).trim(),
        message_style: settings.messageStyle,
        updated_at: new Date().toISOString()
      };
      writeJson(LOCAL_SETTINGS_KEY, values);
      return mapSettings(values);
    }
    return saveRemoteSettings(settings);
  }

  function localRows() {
    var rows = readJson(LOCAL_ACTIVITIES_KEY, []);
    return Array.isArray(rows) ? rows : [];
  }

  function sortRows(rows) {
    return rows.slice().sort(function (a, b) {
      var dateOrder = String(b.date || "").localeCompare(String(a.date || ""));
      if (dateOrder !== 0) return dateOrder;
      return String(b.created_at || "").localeCompare(String(a.created_at || ""));
    });
  }

  function normaliseActivity(row) {
    return {
      id: row.id,
      sidang: row.sidang,
      name: row.name,
      points: row.points === null || row.points === undefined ? null : Number(row.points),
      level: row.level,
      date: row.date,
      confirmed: row.confirmed === true,
      created_at: row.created_at
    };
  }

  function newId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return "local-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  }

  async function listAllRemote() {
    var rows = [];
    var from = 0;
    while (true) {
      var result = await authClient().from("activities")
        .select(ACTIVITY_COLUMNS)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
        .order("id", { ascending: true })
        .range(from, from + PAGE_SIZE - 1);
      if (result.error) throw result.error;
      var page = result.data || [];
      rows = rows.concat(page);
      if (page.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }
    return rows;
  }

  async function listAll() {
    if (isGuest()) return sortRows(localRows()).map(normaliseActivity);
    return (await listAllRemote()).map(normaliseActivity);
  }

  async function listForSidang(sidang) {
    if (isGuest()) {
      return sortRows(localRows().filter(function (row) {
        return row.sidang === sidang;
      })).map(normaliseActivity);
    }

    var result = await authClient()
      .from("activities")
      .select(ACTIVITY_COLUMNS)
      .eq("sidang", sidang)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });
    if (result.error) throw result.error;
    return (result.data || []).map(normaliseActivity);
  }

  async function summaryForSidang(sidang) {
    if (isGuest()) {
      var rows = localRows().filter(function (row) {
        return row.sidang === sidang;
      });
      return {
        points: rows.reduce(function (sum, row) {
          return sum + Number(row.points || 0);
        }, 0),
        unconfirmed: rows.some(function (row) {
          return row.confirmed !== true;
        }),
        unknown: rows.filter(function (row) {
          return row.points === null || row.points === undefined;
        }).length
      };
    }

    var result = await authClient()
      .from("activities")
      .select("points, confirmed")
      .eq("sidang", sidang);
    if (result.error) throw result.error;
    var data = result.data || [];
    return {
      points: data.reduce(function (sum, row) {
        return sum + Number(row.points || 0);
      }, 0),
      unconfirmed: data.some(function (row) {
        return row.confirmed !== true;
      }),
      unknown: data.filter(function (row) {
        return row.points === null || row.points === undefined;
      }).length
    };
  }

  async function getById(id) {
    if (isGuest()) {
      var row = localRows().find(function (item) {
        return String(item.id) === String(id);
      });
      if (!row) throw new Error("Activity not found.");
      return normaliseActivity(row);
    }

    var result = await authClient()
      .from("activities")
      .select(ACTIVITY_COLUMNS)
      .eq("id", id)
      .maybeSingle();
    if (result.error) throw result.error;
    if (!result.data) throw new Error("Activity not found.");
    return normaliseActivity(result.data);
  }

  async function add(activity) {
    var values = {
      name: activity.name,
      points: activity.points,
      level: activity.level,
      date: activity.date,
      confirmed: activity.confirmed === true
    };

    if (isGuest()) {
      values.id = newId();
      values.sidang = activity.sidang;
      values.created_at = new Date().toISOString();
      var rows = localRows();
      rows.push(values);
      writeJson(LOCAL_ACTIVITIES_KEY, rows);
      return;
    }

    values.sidang = activity.sidang;
    var result = await authClient().from("activities").insert(values);
    if (result.error) throw result.error;
  }

  async function addMany(activities) {
    var rows = Array.isArray(activities) ? activities : [];
    if (rows.length === 0) return { saved: 0, failed: 0, error: "" };

    var values = rows.map(function (activity) {
      return {
        sidang: activity.sidang,
        name: activity.name,
        points: activity.points === null ? null : Number(activity.points),
        level: activity.level,
        date: activity.date,
        confirmed: activity.confirmed === true
      };
    });

    if (isGuest()) {
      var stored = localRows();
      var now = new Date().toISOString();
      var added = values.map(function (activity) {
        return Object.assign({ id: newId(), created_at: now }, activity);
      });
      try {
        writeJson(LOCAL_ACTIVITIES_KEY, stored.concat(added));
      } catch (error) {
        return { saved: 0, failed: added.length, error: "Browser storage is full." };
      }
      return { saved: added.length, failed: 0, error: "" };
    }

    var saved = 0;
    for (var i = 0; i < values.length; i += IMPORT_BATCH_SIZE) {
      var chunk = values.slice(i, i + IMPORT_BATCH_SIZE);
      var result;
      try {
        result = await authClient().from("activities").insert(chunk);
      } catch (error) {
        return {
          saved: saved,
          failed: values.length - saved,
          error: error && error.message ? error.message : "The network request failed."
        };
      }
      if (result.error) {
        return {
          saved: saved,
          failed: values.length - saved,
          error: result.error.message || "The database rejected the batch."
        };
      }
      saved += chunk.length;
    }
    return { saved: saved, failed: 0, error: "" };
  }

  async function update(id, activity) {
    var values = {
      name: activity.name,
      points: activity.points,
      level: activity.level,
      date: activity.date,
      confirmed: activity.confirmed === true
    };

    if (isGuest()) {
      var rows = localRows();
      var index = rows.findIndex(function (row) {
        return String(row.id) === String(id);
      });
      if (index < 0) throw new Error("Activity not found.");
      rows[index] = Object.assign({}, rows[index], values);
      writeJson(LOCAL_ACTIVITIES_KEY, rows);
      return;
    }

    var result = await authClient().from("activities")
      .update(values)
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (result.error) throw result.error;
    if (!result.data) throw new Error("Activity not found.");
  }

  async function remove(id) {
    if (isGuest()) {
      var rows = localRows();
      var next = rows.filter(function (row) {
        return String(row.id) !== String(id);
      });
      if (next.length === rows.length) throw new Error("Activity not found.");
      writeJson(LOCAL_ACTIVITIES_KEY, next);
      return;
    }

    var result = await authClient().from("activities").delete().eq("id", id);
    if (result.error) throw result.error;
  }

  function exportSettings(row) {
    return {
      target: Number(row.target),
      dday: row.dday,
      sidang: row.sidang,
      message_style: row.message_style,
      updated_at: String(row.updated_at || "")
    };
  }

  async function exportAll() {
    if (isGuest()) {
      return {
        version: EXPORT_VERSION,
        exported_at: new Date().toISOString(),
        activities: await listAll(),
        settings: exportSettings(localSettings())
      };
    }

    var settingsResult = await authClient().from("settings").select(SETTINGS_COLUMNS).maybeSingle();
    if (settingsResult.error) throw settingsResult.error;
    if (!settingsResult.data) throw new Error("Settings row is missing.");

    return {
      version: EXPORT_VERSION,
      exported_at: new Date().toISOString(),
      activities: await listAll(),
      settings: exportSettings(settingsResult.data)
    };
  }

  async function signInFromGuest() {
    var wasGuest = isGuest();
    leaveGuest();
    try {
      await window.MYCSD_AUTH.signInWithGoogle();
    } catch (error) {
      if (wasGuest) enterGuest();
      throw error;
    }
  }

  function mountDemoBanner() {
    if (!isGuest() || document.getElementById("demo-banner")) return;

    document.body.classList.add("demo-mode");

    var banner = document.createElement("aside");
    banner.className = "demo-banner";
    banner.id = "demo-banner";
    banner.setAttribute("aria-label", "Demo mode");

    var note = document.createElement("p");
    note.textContent = "Demo mode: saved on this device only.";

    var signIn = document.createElement("button");
    signIn.className = "demo-sign-in";
    signIn.type = "button";
    signIn.textContent = "Sign in with Google";

    var status = document.createElement("p");
    status.className = "demo-status";
    status.setAttribute("aria-live", "polite");

    signIn.addEventListener("click", async function () {
      signIn.disabled = true;
      status.textContent = "";
      try {
        await signInFromGuest();
      } catch (error) {
        signIn.disabled = false;
        status.textContent = "Couldn't start sign-in. Try again.";
      }
    });

    banner.appendChild(note);
    banner.appendChild(signIn);
    banner.appendChild(status);
    document.body.appendChild(banner);
  }

  window.MYCSD_DATA = {
    isGuest: isGuest,
    enterGuest: enterGuest,
    leaveGuest: leaveGuest,
    mountDemoBanner: mountDemoBanner,
    signInFromGuest: signInFromGuest,
    settings: { load: loadSettings, save: saveSettings },
    activities: {
      listForSidang: listForSidang,
      listAll: listAll,
      summaryForSidang: summaryForSidang,
      getById: getById,
      add: add,
      addMany: addMany,
      update: update,
      remove: remove
    },
    exportAll: exportAll
  };
}());
