// Protect the menu, copy an export, and handle sign-out.
(function () {
  "use strict";

  var main = document.getElementById("menu-main");
  var button = document.getElementById("menu-sign-out");
  var errorLine = document.getElementById("menu-error");
  var exportButton = document.getElementById("export-data");
  var exportStatus = document.getElementById("export-status");

  window.MYCSD_AUTH.getSession().then(function (session) {
    if (!session) {
      window.location.replace("index.html");
      return;
    }
    document.body.classList.remove("auth-pending");
    main.hidden = false;
  }).catch(function () {
    window.location.replace("index.html");
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
    try {
      await window.MYCSD_AUTH.signOut();
      window.location.replace("index.html");
    } catch (error) {
      errorLine.textContent = "Couldn't sign out. Try again.";
      button.disabled = false;
    }
  });
}());
