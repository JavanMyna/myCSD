// Validate and save one activity without sending user_id; RLS assigns ownership.
(function () {
  "use strict";

  var main = document.getElementById("form-main");
  var form = document.getElementById("activity-form");
  var nameInput = document.getElementById("activity-name");
  var pointsInput = document.getElementById("activity-points");
  var levelInput = document.getElementById("activity-level");
  var dateInput = document.getElementById("activity-date");
  var errorLine = document.getElementById("form-error");
  var saveButton = document.getElementById("save-activity");
  var levels = ["college", "club", "university", "national"];

  function localToday() {
    var now = new Date();
    return now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
  }

  dateInput.value = localToday();
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

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    errorLine.textContent = "";
    var name = nameInput.value.trim();
    var pointsText = pointsInput.value.trim();
    var points = Number(pointsText);
    var date = dateInput.value;

    if (name.length < 1 || name.length > 100) {
      errorLine.textContent = "Name must be 1 to 100 characters.";
      return;
    }
    if (pointsText === "" || !Number.isInteger(points) || points < 0 || points > 1000) {
      errorLine.textContent = "Points must be a whole number from 0 to 1000.";
      return;
    }
    if (levels.indexOf(levelInput.value) < 0) {
      errorLine.textContent = "Choose a valid level.";
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date + "T00:00:00"))) {
      errorLine.textContent = "Choose a valid date.";
      return;
    }

    saveButton.disabled = true;
    try {
      var settings = window.MYCSD_SETTINGS_STORE.load(window.MYCSD_CONFIG);
      await window.MYCSD_ACTIVITY_DATA.add({
        sidang: settings.sidang,
        name: name,
        points: points,
        level: levelInput.value,
        date: date
      });
      window.location.replace("index.html");
    } catch (error) {
      errorLine.textContent = "Couldn't save. Try again.";
      saveButton.disabled = false;
    }
  });
}());
