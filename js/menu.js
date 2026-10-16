// Protect the menu and handle sign-out.
(function () {
  "use strict";

  var main = document.getElementById("menu-main");
  var button = document.getElementById("menu-sign-out");
  var errorLine = document.getElementById("menu-error");

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
