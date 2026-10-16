(function () {
  "use strict";

  var config = window.MYCSD_CONFIG;
  var store = window.MYCSD_SETTINGS_STORE;
  var settings = store.load(config);
  var targetInput = document.getElementById("target");
  var sidangInput = document.getElementById("sidang");
  var presetInput = document.getElementById("dday-preset");
  var customDateInput = document.getElementById("dday-custom");
  var saveState = document.getElementById("save-state");
  var presets = {
    semester1: "2027-02-07",
    semester2: "2027-07-18"
  };

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

  function selectedDate() {
    if (presetInput.value === "semester1") return presets.semester1;
    if (presetInput.value === "semester2") return presets.semester2;
    return customDateInput.value;
  }

  function saveSettings() {
    var target = Number(targetInput.value);
    var date = selectedDate();
    var mode = document.querySelector('input[name="message-style"]:checked');
    if (!Number.isFinite(target) || target < 1 || !Number.isInteger(target)) {
      saveState.textContent = "Target must be a whole number of at least 1.";
      return;
    }
    if (!date) {
      saveState.textContent = "Choose a D-Day.";
      return;
    }

    var saved = store.save({
      target: target,
      dday: date,
      sidang: sidangInput.value,
      messageStyle: mode ? mode.value : "motivational"
    });
    saveState.textContent = saved ? "Saved on this device." : "Could not save in this browser.";
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
}());
