// Settings API for pages. js/data.js selects Supabase or demo localStorage.
(function () {
  "use strict";

  function data() {
    if (!window.MYCSD_DATA) throw new Error("Data layer is not loaded.");
    return window.MYCSD_DATA.settings;
  }

  window.MYCSD_SETTINGS_STORE = {
    load: function (config) { return data().load(config); },
    save: function (settings) { return data().save(settings); }
  };
}());
