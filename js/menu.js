// Protect the menu, copy an export, and handle sign-out or exiting demo mode.
(function () {
  "use strict";

  var main = document.getElementById("menu-main");
  var button = document.getElementById("menu-sign-out");
  var errorLine = document.getElementById("menu-error");
  var exportButton = document.getElementById("export-data");
  var exportStatus = document.getElementById("export-status");

  function start(session) {
    if (session) {
      window.MYCSD_DATA.leaveGuest();
    } else if (!window.MYCSD_DATA.isGuest()) {
      window.location.replace("index.html");
      return;
    } else {
      window.MYCSD_DATA.mountDemoBanner();
    }
    button.textContent = window.MYCSD_DATA.isGuest() ? "Exit demo" : "Sign out";
    document.body.classList.remove("auth-pending");
    main.hidden = false;
  }

  window.MYCSD_AUTH.getSession().then(start).catch(function () {
    start(null);
  });

  exportButton.addEventListener("click", async function () {
    exportButton.disabled = true;
    exportStatus.textContent = "";
    exportStatus.hidden = true;
    try {
      await window.MYCSD_EXPORT_DATA.copyAll();
      exportStatus.textContent = "Copied.";
    } catch (error) {
      exportStatus.textContent = "Couldn't copy.";
    }
    exportStatus.hidden = false;
    exportButton.disabled = false;
  });

  button.addEventListener("click", async function () {
    button.disabled = true;
    errorLine.textContent = "";
    if (window.MYCSD_DATA.isGuest()) {
      window.MYCSD_DATA.leaveGuest();
      window.location.replace("index.html");
      return;
    }
    try {
      await window.MYCSD_AUTH.signOut();
      window.MYCSD_DATA.leaveGuest();
      window.location.replace("index.html");
    } catch (error) {
      errorLine.textContent = "Couldn't sign out. Try again.";
      button.disabled = false;
    }
  });
}());
