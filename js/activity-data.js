// Supabase activity requests live here. Row ownership is enforced by database RLS.
(function () {
  "use strict";

  function client() {
    var value = window.MYCSD_AUTH && window.MYCSD_AUTH.getClient();
    if (!value) throw new Error("Supabase is not configured.");
    return value;
  }

  async function listForSidang(sidang) {
    var result = await client()
      .from("activities")
      .select("id, name, points, level, date, created_at")
      .eq("sidang", sidang)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });
    if (result.error) throw result.error;
    return result.data || [];
  }

  async function pointsForSidang(sidang) {
    var result = await client()
      .from("activities")
      .select("points")
      .eq("sidang", sidang);
    if (result.error) throw result.error;
    return (result.data || []).reduce(function (sum, activity) {
      return sum + Number(activity.points || 0);
    }, 0);
  }

  async function add(activity) {
    var result = await client().from("activities").insert({
      sidang: activity.sidang,
      name: activity.name,
      points: activity.points,
      level: activity.level,
      date: activity.date
    });
    if (result.error) throw result.error;
  }

  async function remove(id) {
    var result = await client().from("activities").delete().eq("id", id);
    if (result.error) throw result.error;
  }

  window.MYCSD_ACTIVITY_DATA = {
    listForSidang: listForSidang,
    pointsForSidang: pointsForSidang,
    add: add,
    remove: remove
  };
}());
