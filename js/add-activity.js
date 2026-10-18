// Validate and save a new activity, or edit an existing one from ?edit=<id>.
(function () {
  "use strict";

  var main = document.getElementById("form-main");
  var form = document.getElementById("activity-form");
  var title = document.getElementById("form-title");
  var closeLink = document.getElementById("close-link");
  var nameInput = document.getElementById("activity-name");
  var pointsInput = document.getElementById("activity-points");
  var levelInput = document.getElementById("activity-level");
  var dateInput = document.getElementById("activity-date");
  var confirmedInput = document.getElementById("activity-confirmed");
  var errorLine = document.getElementById("form-error");
  var saveButton = document.getElementById("save-activity");
  var pageError = document.getElementById("page-load-error");
  var retryButton = document.getElementById("page-load-retry");
  var levels = ["club", "university", "national", "webinars", "misc", "unsure"];
  var editId = new URLSearchParams(window.location.search).get("edit") || "";
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

  function fillForm(activity) {
    nameInput.value = activity.name;
    pointsInput.value = String(activity.points);
    levelInput.value = levels.indexOf(activity.level) >= 0 ? activity.level : "unsure";
    dateInput.value = activity.date || localToday();
    confirmedInput.checked = activity.confirmed === true;
  }

  if (editId) {
    document.title = "Edit activity · myCSD tracker";
    title.textContent = "Edit activity";
    saveButton.textContent = "Save changes";
    closeLink.href = "activities.html";
    closeLink.setAttribute("aria-label", "Close edit form");
  }

  dateInput.value = localToday();

  async function loadForm() {
    main.hidden = true;
    pageError.hidden = true;
    retryButton.hidden = true;
    retryButton.disabled = true;
    try {
      if (editId) {
        fillForm(await window.MYCSD_ACTIVITY_DATA.getById(editId));
      } else {
        currentSettings = await window.MYCSD_SETTINGS_STORE.load(window.MYCSD_CONFIG);
      }
      main.hidden = false;
    } catch (error) {
      pageError.textContent = editId
        ? "Couldn't load that activity. It may have been deleted."
        : "Couldn't load settings.";
      pageError.hidden = false;
      retryButton.hidden = false;
      retryButton.disabled = false;
    }
  }

  function start(session) {
    if (session) {
      window.MYCSD_DATA.leaveGuest();
    } else if (!window.MYCSD_DATA.isGuest()) {
      window.location.replace("index.html");
      return;
    } else {
      window.MYCSD_DATA.mountDemoBanner();
    }
    document.body.classList.remove("auth-pending");
    if (!editId) window.MYCSD_REFRESH_ON_RETURN(loadForm);
    loadForm();
  }

  retryButton.addEventListener("click", loadForm);
  window.MYCSD_AUTH.getSession().then(start).catch(function () {
    start(null);
  });

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    errorLine.textContent = "";
    if (!editId && !currentSettings) return;

    var name = nameInput.value.trim();
    var pointsText = pointsInput.value.trim();
    var points = Number(pointsText);
    var date = dateInput.value;
    var values = {
      name: name,
      points: points,
      level: levelInput.value,
      date: date,
      confirmed: confirmedInput.checked
    };

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
      if (editId) {
        await window.MYCSD_ACTIVITY_DATA.update(editId, values);
        window.location.replace("activities.html");
      } else {
        values.sidang = currentSettings.sidang;
        await window.MYCSD_ACTIVITY_DATA.add(values);
        window.location.replace("index.html");
      }
    } catch (error) {
      errorLine.textContent = "Couldn't save. Try again.";
      saveButton.disabled = false;
    }
  });
}());
