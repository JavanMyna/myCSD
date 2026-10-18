// Export current-user or demo data as plain JSON on the clipboard.
(function () {
  "use strict";

  async function copyAll() {
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      throw new Error("Clipboard is unavailable.");
    }
    if (!window.MYCSD_DATA) throw new Error("Data layer is not loaded.");

    var exportData = await window.MYCSD_DATA.exportAll();
    await navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
  }

  window.MYCSD_EXPORT_DATA = { copyAll: copyAll };
}());
