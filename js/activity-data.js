// Activity API for pages. js/data.js selects Supabase or demo localStorage.
(function () {
  "use strict";

  function data() {
    if (!window.MYCSD_DATA) throw new Error("Data layer is not loaded.");
    return window.MYCSD_DATA.activities;
  }

  window.MYCSD_ACTIVITY_DATA = {
    listForSidang: function (sidang) { return data().listForSidang(sidang); },
    listAll: function () { return data().listAll(); },
    summaryForSidang: function (sidang) { return data().summaryForSidang(sidang); },
    getById: function (id) { return data().getById(id); },
    add: function (activity) { return data().add(activity); },
    addMany: function (activities) { return data().addMany(activities); },
    update: function (id, activity) { return data().update(id, activity); },
    remove: function (id) { return data().remove(id); }
  };
}());
