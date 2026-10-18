// One faint creator mark shared by every app page.
(function () {
  "use strict";

  function measureBanner(banner) {
    function update() {
      document.documentElement.style.setProperty("--demo-banner-h", banner.offsetHeight + "px");
    }
    update();
    if (typeof ResizeObserver === "function") {
      new ResizeObserver(update).observe(banner);
    } else {
      window.addEventListener("resize", update);
    }
  }

  function observeBanner() {
    var banner = document.getElementById("demo-banner");
    if (banner) {
      measureBanner(banner);
      return;
    }
    var observer = new MutationObserver(function () {
      var found = document.getElementById("demo-banner");
      if (!found) return;
      observer.disconnect();
      measureBanner(found);
    });
    observer.observe(document.body, { childList: true });
  }

  function mount() {
    if (document.querySelector(".creator-mark")) return;
    var mark = document.createElement("p");
    mark.className = "creator-mark";
    mark.setAttribute("aria-hidden", "true");
    mark.textContent = "<.";
    document.body.appendChild(mark);
    observeBanner();
  }

  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);
}());
