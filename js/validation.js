// One set of rules shared by the add form, settings page, and data import.
(function () {
  "use strict";

  var LEVELS = ["club", "university", "national", "webinars", "misc", "unsure"];
  var MESSAGE_STYLES = ["motivational", "harsh", "off"];
  var NAME_MAX = 100;
  var POINTS_MAX = 1000;
  var SIDANG_MAX = 20;
  var TARGET_MIN = 1;
  var TARGET_MAX = 5000;

  function fail(field, message) {
    return { ok: false, field: field, message: message };
  }

  function isDate(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    var date = new Date(value + "T00:00:00Z");
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }

  function isPoints(value) {
    return value === null ||
      (typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= POINTS_MAX);
  }

  function checkActivity(raw, options) {
    var settings = options || {};
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return fail("activity", "That activity is not a valid object.");
    }

    var name = typeof raw.name === "string" ? raw.name.trim() : "";
    if (name.length < 1 || name.length > NAME_MAX) {
      return fail("name", "Name must be 1 to 100 characters.");
    }

    if (!isPoints(raw.points)) {
      return fail("points", "Points must be a whole number from 0 to 1000.");
    }

    if (LEVELS.indexOf(raw.level) < 0) {
      return fail("level", "Choose a valid level.");
    }

    if (!isDate(raw.date)) {
      return fail("date", "Choose a valid date.");
    }

    if (raw.confirmed !== undefined && typeof raw.confirmed !== "boolean") {
      return fail("confirmed", "Confirmed must be true or false.");
    }

    var sidang = typeof raw.sidang === "string" ? raw.sidang.trim() : "";
    if (settings.sidangRequired || raw.sidang !== undefined) {
      if (sidang.length < 1 || sidang.length > SIDANG_MAX) {
        return fail("sidang", "Sidang name must be 1 to 20 characters.");
      }
    }

    var value = {
      name: name,
      points: raw.points,
      level: raw.level,
      date: raw.date,
      confirmed: raw.confirmed === true
    };
    if (sidang) value.sidang = sidang;
    return { ok: true, value: value };
  }

  function checkSettings(raw) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return fail("settings", "Settings must be an object.");
    }

    var target = raw.target;
    if (typeof target !== "number" || !Number.isInteger(target) || target < TARGET_MIN || target > TARGET_MAX) {
      return fail("target", "Target must be a whole number from 1 to 5000.");
    }

    if (!isDate(raw.dday)) {
      return fail("dday", "Choose a valid D-Day.");
    }

    var sidang = typeof raw.sidang === "string" ? raw.sidang.trim() : "";
    if (sidang.length < 1 || sidang.length > SIDANG_MAX) {
      return fail("sidang", "Sidang name must be 1 to 20 characters.");
    }

    var style = raw.message_style !== undefined ? raw.message_style : raw.messageStyle;
    if (style === undefined) style = "motivational";
    if (MESSAGE_STYLES.indexOf(style) < 0) {
      return fail("message_style", "Choose a message style.");
    }

    return {
      ok: true,
      value: { target: target, dday: raw.dday, sidang: sidang, messageStyle: style }
    };
  }

  window.MYCSD_VALIDATE = {
    levels: LEVELS.slice(),
    messageStyles: MESSAGE_STYLES.slice(),
    isDate: isDate,
    activity: checkActivity,
    settings: checkSettings
  };
}());
