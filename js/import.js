// Preview and import an export through the unified data layer.
(function () {
  "use strict";

  var main = document.getElementById("import-main");
  var textArea = document.getElementById("import-text");
  var fileInput = document.getElementById("import-file");
  var errorLine = document.getElementById("import-error");
  var previewButton = document.getElementById("import-preview");
  var planSection = document.getElementById("import-plan");
  var countsLine = document.getElementById("import-counts");
  var legacyLine = document.getElementById("import-legacy");
  var invalidList = document.getElementById("import-invalid");
  var settingsInput = document.getElementById("import-settings");
  var settingsNote = document.getElementById("import-settings-note");
  var confirmButton = document.getElementById("import-confirm");
  var resultLine = document.getElementById("import-result");
  var plan = null;
  var previewing = false;
  var importing = false;

  function resetPreview() {
    plan = null;
    planSection.hidden = true;
    countsLine.textContent = "";
    legacyLine.hidden = true;
    legacyLine.textContent = "";
    invalidList.replaceChildren();
    settingsInput.checked = false;
    settingsInput.disabled = true;
    settingsNote.hidden = true;
    settingsNote.textContent = "";
    confirmButton.hidden = true;
    confirmButton.disabled = false;
    confirmButton.textContent = "Import";
  }

  function setBusy(isBusy) {
    previewButton.disabled = isBusy;
    previewButton.textContent = isBusy ? "Checking…" : "Preview";
  }

  function readFile(file) {
    if (typeof file.text === "function") return file.text();
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(String(reader.result || "")); };
      reader.onerror = function () { reject(reader.error || new Error("Couldn't read the file.")); };
      reader.readAsText(file);
    });
  }

  function countsText(next) {
    return next.rows.length + " new, " + next.duplicateCount + " duplicates skipped, " +
      next.invalid.length + " invalid.";
  }

  function updateConfirm() {
    if (!plan) {
      confirmButton.hidden = true;
      return;
    }
    var settingsReady = settingsInput.checked && plan.settings.status === "valid";
    if (plan.rows.length === 0 && !settingsReady) {
      confirmButton.hidden = true;
      return;
    }
    confirmButton.hidden = false;
    confirmButton.disabled = false;
    if (plan.rows.length > 0) {
      confirmButton.textContent = "Import " + plan.rows.length +
        (plan.rows.length === 1 ? " activity" : " activities");
    } else {
      confirmButton.textContent = "Import settings";
    }
  }

  function renderPlan() {
    planSection.hidden = false;
    countsLine.textContent = countsText(plan);

    if (plan.legacyCollegeCount > 0) {
      legacyLine.hidden = false;
      legacyLine.textContent = plan.legacyCollegeCount +
        (plan.legacyCollegeCount === 1
          ? " legacy College row will import as Unsure."
          : " legacy College rows will import as Unsure.");
    }

    plan.invalid.slice(0, 5).forEach(function (entry) {
      var item = document.createElement("li");
      item.textContent = "Row " + entry.row + ": " + entry.message;
      invalidList.appendChild(item);
    });

    settingsNote.hidden = false;
    if (plan.settings.status === "valid") {
      settingsInput.disabled = false;
      settingsNote.textContent = "Off by default. Tick this to apply the file's target, D-Day, sidang, and message style.";
    } else if (plan.settings.status === "invalid") {
      settingsNote.textContent = "Settings won't be imported: " + plan.settings.message;
    } else {
      settingsNote.textContent = "This export contains no settings.";
    }

    updateConfirm();
  }

  fileInput.addEventListener("change", async function () {
    var file = fileInput.files && fileInput.files[0];
    if (!file) return;
    errorLine.textContent = "";
    resultLine.textContent = "";
    resetPreview();
    if (file.size > window.MYCSD_IMPORT.MAX_BYTES) {
      errorLine.textContent = "That file is larger than 1 MB.";
      fileInput.value = "";
      return;
    }
    try {
      textArea.value = await readFile(file);
    } catch (error) {
      errorLine.textContent = "Couldn't read that file.";
      fileInput.value = "";
    }
  });

  settingsInput.addEventListener("change", updateConfirm);

  async function preview() {
    if (previewing || importing) return;
    errorLine.textContent = "";
    resultLine.textContent = "";

    if (textArea.value.trim() === "") {
      resetPreview();
      errorLine.textContent = "Paste an export first, or choose a .json file.";
      return;
    }

    previewing = true;
    setBusy(true);
    try {
      var parsed = window.MYCSD_IMPORT.parse(textArea.value);
      var existing = await window.MYCSD_ACTIVITY_DATA.listAll();
      var next = window.MYCSD_IMPORT.buildPlan(parsed, existing);
      resetPreview();
      plan = next;
      renderPlan();
    } catch (error) {
      resetPreview();
      errorLine.textContent = error && error.message ? error.message : "Couldn't read that export.";
    } finally {
      previewing = false;
      setBusy(false);
    }
  }

  async function runImport() {
    if (!plan || importing) return;
    importing = true;
    confirmButton.disabled = true;
    previewButton.disabled = true;
    textArea.disabled = true;
    fileInput.disabled = true;
    settingsInput.disabled = true;
    errorLine.textContent = "";
    resultLine.textContent = "";

    var rowsSaved = 0;
    var rowsFailed = 0;
    var failure = "";
    var settingsResult = null;

    if (plan.rows.length > 0) {
      try {
        var outcome = await window.MYCSD_ACTIVITY_DATA.addMany(plan.rows);
        rowsSaved = outcome.saved;
        rowsFailed = outcome.failed;
        failure = outcome.error || "";
      } catch (error) {
        rowsFailed = plan.rows.length;
        failure = error && error.message ? error.message : "";
      }
    }

    if (plan.settings.status === "valid" && settingsInput.checked) {
      try {
        await window.MYCSD_SETTINGS_STORE.save(plan.settings.value);
        settingsResult = true;
      } catch (error) {
        settingsResult = false;
      }
    }

    var parts = [];
    if (plan.rows.length > 0) {
      if (rowsFailed === 0) {
        parts.push("Saved " + rowsSaved + (rowsSaved === 1 ? " activity." : " activities."));
      } else {
        parts.push("Saved " + rowsSaved + " and couldn't save " + rowsFailed + ".");
        if (failure) parts.push(failure);
        parts.push(window.MYCSD_DATA.isGuest()
          ? "Delete some activities and try again."
          : "Check the database upgrade and try the unsaved rows again.");
      }
    }
    if (settingsResult === true) parts.push("Settings imported.");
    if (settingsResult === false) parts.push("Settings weren't saved. Try again.");
    if (plan.duplicateCount > 0) {
      parts.push(plan.duplicateCount + (plan.duplicateCount === 1 ? " duplicate skipped." : " duplicates skipped."));
    }
    if (plan.invalid.length > 0) {
      parts.push(plan.invalid.length + (plan.invalid.length === 1 ? " invalid row skipped." : " invalid rows skipped."));
    }
    if (parts.length === 0) parts.push("Nothing to import.");

    resultLine.textContent = parts.join(" ");
    confirmButton.textContent = "Imported";
    importing = false;
  }

  previewButton.addEventListener("click", preview);
  confirmButton.addEventListener("click", runImport);

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
    main.hidden = false;
  }

  window.MYCSD_AUTH.getSession().then(start).catch(function () {
    start(null);
  });
}());
