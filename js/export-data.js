// Export current-user data through RLS and copy it as plain JSON.
(function () {
  "use strict";

  async function copyAll() {
    var client = window.MYCSD_AUTH.getClient();
    if (!client || !navigator.clipboard || !navigator.clipboard.writeText) {
      throw new Error("Clipboard is unavailable.");
    }

    var activityResult = await client.from("activities")
      .select("*")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });
    if (activityResult.error) throw activityResult.error;

    var settingsResult = await client.from("settings").select("*").maybeSingle();
    if (settingsResult.error) throw settingsResult.error;
    if (!settingsResult.data) throw new Error("Settings row is missing.");

    var exportData = {
      version: 1,
      exported_at: new Date().toISOString(),
      activities: activityResult.data || [],
      settings: settingsResult.data
    };
    await navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
  }

  window.MYCSD_EXPORT_DATA = { copyAll: copyAll };
}());
