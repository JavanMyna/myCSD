// Settings persistence is isolated here so localStorage can later be replaced with Supabase.
(function () {
  "use strict";

  var STORAGE_KEY = "myCSDSettings";

  function load(defaults) {
    var saved = {};
    try {
      saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch (error) {
      saved = {};
    }
    if (!saved || typeof saved !== "object") saved = {};

    var storedTarget = Number(saved.target);
    var validMessageStyles = ["motivational", "harsh", "off"];
    return {
      target: Number.isFinite(storedTarget) && storedTarget > 0 ? storedTarget : defaults.target,
      dday: typeof saved.dday === "string" && saved.dday ? saved.dday : defaults.dday,
      sidang: typeof saved.sidang === "string" ? saved.sidang : defaults.sidang,
      messageStyle: validMessageStyles.indexOf(saved.messageStyle) >= 0
        ? saved.messageStyle
        : (defaults.messageStyle || "motivational")
    };
  }

  function save(settings) {
    var values = {
      target: Number(settings.target),
      dday: String(settings.dday || ""),
      sidang: String(settings.sidang || ""),
      messageStyle: settings.messageStyle
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
      return true;
    } catch (error) {
      return false;
    }
  }

  window.MYCSD_SETTINGS_STORE = { load: load, save: save };
}());
