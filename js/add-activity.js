// Validate and save a new activity, or edit an existing one from ?edit=<id>.
(function () {
  "use strict";

  var main = document.getElementById("form-main");
  var form = document.getElementById("activity-form");
  var title = document.getElementById("form-title");
  var closeLink = document.getElementById("close-link");
  var nameInput = document.getElementById("activity-name");
  var pointsInput = document.getElementById("activity-points");
  var unknownInput = document.getElementById("activity-points-unknown");
  var levelInput = document.getElementById("activity-level");
  var dateInput = document.getElementById("activity-date");
  var confirmedInput = document.getElementById("activity-confirmed");
  var errorLine = document.getElementById("form-error");
  var saveButton = document.getElementById("save-activity");
  var pageError = document.getElementById("page-load-error");
  var retryButton = document.getElementById("page-load-retry");
  var validation = window.MYCSD_VALIDATE;
  var levels = validation.levels;
  var editId = new URLSearchParams(window.location.search).get("edit") || "";
  var currentSettings = null;

  function localToday() {
    var now = new Date();
    return now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
  }

  function setPointsUnknown(unknown) {
    unknownInput.checked = unknown;
    pointsInput.disabled = unknown;
    pointsInput.required = !unknown;
    if (unknown) pointsInput.value = "";
  }

  function fillForm(activity) {
    nameInput.value = activity.name;
    setPointsUnknown(activity.points === null);
    if (activity.points !== null) pointsInput.value = String(activity.points);
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

  unknownInput.addEventListener("change", function () {
    setPointsUnknown(unknownInput.checked);
    if (!unknownInput.checked) pointsInput.focus();
  });

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

    var points = unknownInput.checked
      ? null
      : (pointsInput.value.trim() === "" ? undefined : Number(pointsInput.value));
    var checked = validation.activity({
      name: nameInput.value,
      points: points,
      level: levelInput.value,
      date: dateInput.value,
      confirmed: confirmedInput.checked
    });
    if (!checked.ok) {
      errorLine.textContent = checked.message;
      return;
    }

    var values = checked.value;

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
