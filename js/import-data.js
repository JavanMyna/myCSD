// Parse and plan an export without writing anything. Pure except for Blob sizing.
(function () {
  "use strict";

  var MAX_BYTES = 1024 * 1024;
  var MAX_ROWS = 2000;
  var SUPPORTED_VERSIONS = [1, 2, 3, 4];

  function importError(message) {
    var error = new Error(message);
    error.name = "ImportError";
    return error;
  }

  function byteLength(text) {
    return new Blob([text]).size;
  }

  function parseExport(text) {
    if (typeof text !== "string") throw importError("That export is not text.");
    if (byteLength(text) > MAX_BYTES) throw importError("That export is larger than 1 MB.");
    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
    if (text.trim() === "") throw importError("Paste an export first, or choose a .json file.");

    var data;
    try {
      data = JSON.parse(text);
    } catch (error) {
      throw importError("That isn't valid JSON.");
    }

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw importError("The export must be a JSON object.");
    }
    if (SUPPORTED_VERSIONS.indexOf(data.version) < 0) {
      var shown = typeof data.version === "number" || typeof data.version === "string"
        ? String(data.version).slice(0, 20)
        : "unknown";
      throw importError("Unsupported export version " + shown + ". This app imports versions 1, 2, 3, and 4.");
    }
    if (!Array.isArray(data.activities)) {
      throw importError("The export has no activities list.");
    }
    if (data.activities.length > MAX_ROWS) {
      throw importError("That export has " + data.activities.length + " activities; the limit is 2000.");
    }

    return { version: data.version, activities: data.activities, settings: data.settings };
  }

  function duplicateKey(activity) {
    var points = activity.points === null || activity.points === undefined ? "null" : String(activity.points);
    return [
      String(activity.sidang == null ? "" : activity.sidang).trim(),
      String(activity.name == null ? "" : activity.name).trim(),
      String(activity.date == null ? "" : activity.date).trim(),
      points,
      String(activity.level == null ? "" : activity.level).trim()
    ].join("\u0000");
  }

  function buildPlan(parsed, existing) {
    var validate = window.MYCSD_VALIDATE;
    if (!validate) throw importError("Validation is not loaded.");

    var seen = Object.create(null);
    (existing || []).forEach(function (activity) {
      if (activity && typeof activity === "object") seen[duplicateKey(activity)] = true;
    });

    var rows = [];
    var invalid = [];
    var duplicates = 0;
    var legacyCollege = 0;

    parsed.activities.forEach(function (raw, index) {
      var rowNumber = index + 1;
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
        invalid.push({ row: rowNumber, message: "That row is not an activity object." });
        return;
      }

      var level = raw.level === "college" ? "unsure" : raw.level;
      var checked = validate.activity({
        sidang: raw.sidang,
        name: raw.name,
        points: raw.points,
        level: level,
        date: raw.date,
        confirmed: raw.confirmed === undefined ? false : raw.confirmed
      }, { sidangRequired: true });

      if (!checked.ok) {
        invalid.push({ row: rowNumber, message: checked.message });
        return;
      }

      var key = duplicateKey(checked.value);
      if (seen[key]) {
        duplicates += 1;
        return;
      }
      seen[key] = true;
      if (raw.level === "college") legacyCollege += 1;
      rows.push(checked.value);
    });

    var settings = { status: "missing" };
    if (parsed.settings !== undefined && parsed.settings !== null) {
      var checkedSettings = validate.settings(parsed.settings);
      settings = checkedSettings.ok
        ? { status: "valid", value: checkedSettings.value }
        : { status: "invalid", message: checkedSettings.message };
    }

    return {
      version: parsed.version,
      rows: rows,
      invalid: invalid,
      duplicateCount: duplicates,
      legacyCollegeCount: legacyCollege,
      settings: settings
    };
  }

  window.MYCSD_IMPORT = {
    MAX_BYTES: MAX_BYTES,
    MAX_ROWS: MAX_ROWS,
    parse: parseExport,
    buildPlan: buildPlan,
    duplicateKey: duplicateKey
  };
}());
