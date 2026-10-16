// Settings screen: wait for Supabase, validate changes, then save through the settings store.
(function () {
  "use strict";

  var config = window.MYCSD_CONFIG;
  var store = window.MYCSD_SETTINGS_STORE;
  var presets = { semester1: "2027-02-07", semester2: "2027-07-18" };
  var main = document.getElementById("settings-main");
  var loadError = document.getElementById("settings-load-error");
  var retryButton = document.getElementById("settings-load-retry");
  var targetInput = document.getElementById("target");
  var sidangInput = document.getElementById("sidang");
  var presetInput = document.getElementById("dday-preset");
  var customDateInput = document.getElementById("dday-custom");
  var saveState = document.getElementById("save-state");
  var signOutButton = document.getElementById("sign-out");
  var signOutError = document.getElementById("sign-out-error");
  var savePending = null;
  var saving = false;

  function validDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    var date = new Date(value + "T00:00:00Z");
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }

  function fillSettings(settings) {
    targetInput.value = String(settings.target);
    sidangInput.value = settings.sidang;
    customDateInput.value = settings.dday;
    if (settings.dday === presets.semester1) presetInput.value = "semester1";
    else if (settings.dday === presets.semester2) presetInput.value = "semester2";
    else presetInput.value = "custom";
    customDateInput.hidden = presetInput.value !== "custom";
    document.querySelectorAll('input[name="message-style"]').forEach(function (radio) {
      radio.checked = radio.value === settings.messageStyle;
    });
    main.hidden = false;
    loadError.hidden = true;
    retryButton.hidden = true;
  }

  async function loadSettings() {
    main.hidden = true;
    loadError.hidden = true;
    retryButton.hidden = true;
    retryButton.disabled = true;
    try {
      fillSettings(await store.load(config));
    } catch (error) {
      loadError.hidden = false;
      retryButton.hidden = false;
      retryButton.disabled = false;
    }
  }

  function selectedDate() {
    if (presetInput.value === "semester1") return presets.semester1;
    if (presetInput.value === "semester2") return presets.semester2;
    return customDateInput.value;
  }

  function collectSettings() {
    var target = Number(targetInput.value);
    var date = selectedDate();
    var sidang = sidangInput.value.trim();
    var mode = document.querySelector('input[name="message-style"]:checked');
    if (!Number.isInteger(target) || target < 1 || target > 5000) {
      saveState.textContent = "Target must be a whole number from 1 to 5000.";
      return null;
    }
    if (!validDate(date)) {
      saveState.textContent = "Choose a valid D-Day.";
      return null;
    }
    if (sidang.length < 1 || sidang.length > 20) {
      saveState.textContent = "Sidang name must be 1 to 20 characters.";
      return null;
    }
    if (!mode || ["motivational", "harsh", "off"].indexOf(mode.value) < 0) {
      saveState.textContent = "Choose a message style.";
      return null;
    }
    return { target: target, dday: date, sidang: sidang, messageStyle: mode.value };
  }

  async function saveNext() {
    if (saving || !savePending) return;
    saving = true;
    while (savePending) {
      var values = savePending;
      savePending = null;
      try {
        await store.save(values);
        saveState.textContent = "Saved.";
      } catch (error) {
        saveState.textContent = "Couldn't save. Try again.";
        savePending = null;
      }
    }
    saving = false;
  }

  function saveSettings() {
    var values = collectSettings();
    if (!values) return;
    saveState.textContent = "Saving…";
    savePending = values;
    saveNext();
  }

  presetInput.addEventListener("change", function () {
    customDateInput.hidden = presetInput.value !== "custom";
    if (presetInput.value === "semester1") customDateInput.value = presets.semester1;
    if (presetInput.value === "semester2") customDateInput.value = presets.semester2;
    saveSettings();
  });
  customDateInput.addEventListener("change", saveSettings);
  targetInput.addEventListener("change", saveSettings);
  sidangInput.addEventListener("change", saveSettings);
  document.querySelectorAll('input[name="message-style"]').forEach(function (radio) {
    radio.addEventListener("change", saveSettings);
  });
  retryButton.addEventListener("click", loadSettings);

  signOutButton.addEventListener("click", async function () {
    signOutButton.disabled = true;
    signOutError.hidden = true;
    try {
      await window.MYCSD_AUTH.signOut();
      window.location.replace("index.html");
    } catch (error) {
      signOutButton.disabled = false;
      signOutError.textContent = "Could not sign out. Please try again.";
      signOutError.hidden = false;
    }
  });

  window.MYCSD_AUTH.getSession().then(function (session) {
    if (!session) {
      window.location.replace("index.html");
      return;
    }
    document.body.classList.remove("auth-pending");
    loadSettings();
  }).catch(function () {
    window.location.replace("index.html");
  });
}());
