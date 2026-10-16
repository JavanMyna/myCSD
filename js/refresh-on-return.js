// Refresh visible data after a tab returns from the background or browser back/forward cache.
(function () {
  "use strict";

  var minimumInterval = 3000;

  window.MYCSD_REFRESH_ON_RETURN = function (callback) {
    var lastRefresh = Date.now();
    var running = false;

    async function refresh() {
      var now = Date.now();
      if (running || now - lastRefresh < minimumInterval) return;
      lastRefresh = now;
      running = true;
      try {
        await callback();
      } finally {
        running = false;
      }
    }

    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible") refresh();
    });
    window.addEventListener("pageshow", function (event) {
      if (event.persisted) refresh();
    });
  };
}());
