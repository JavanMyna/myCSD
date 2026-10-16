// Validate and save an activity after loading its sidang from the settings row.
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
  var pageError = document.getElementById("page-load-error");
  var retryButton = document.getElementById("page-load-retry");
  var levels = ["college", "club", "university", "national"];
  var currentSettings = null;

  function localToday() {
    var now = new Date();
    return now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
  }

  function validDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    var date = new Date(value + "T00:00:00Z");
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }

  dateInput.value = localToday();

  async function loadSettings() {
    main.hidden = true;
    pageError.hidden = true;
    retryButton.hidden = true;
    retryButton.disabled = true;
    try {
      currentSettings = await window.MYCSD_SETTINGS_STORE.load(window.MYCSD_CONFIG);
      main.hidden = false;
    } catch (error) {
      pageError.textContent = "Couldn't load settings.";
      pageError.hidden = false;
      retryButton.hidden = false;
      retryButton.disabled = false;
    }
  }

  retryButton.addEventListener("click", loadSettings);
  window.MYCSD_AUTH.getSession().then(function (session) {
    if (!session) {
      window.location.replace("index.html");
      return;
    }
    document.body.classList.remove("auth-pending");
    window.MYCSD_REFRESH_ON_RETURN(loadSettings);
    loadSettings();
  }).catch(function () {
    window.location.replace("index.html");
  });

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    errorLine.textContent = "";
    if (!currentSettings) return;
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
    if (!validDate(date)) {
      errorLine.textContent = "Choose a valid date.";
      return;
    }

    saveButton.disabled = true;
    try {
      await window.MYCSD_ACTIVITY_DATA.add({
        sidang: currentSettings.sidang,
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
