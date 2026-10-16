(function () {
  "use strict";

  var config = window.MYCSD_CONFIG;
  var settings = window.MYCSD_SETTINGS_STORE.load(config);
  var params = new URLSearchParams(window.location.search);
  var total = Number(config.fakeTotal);
  var override = params.get("total");

  // TEMPORARY: lets Fred preview message ranges before activities come from Supabase.
  if (override !== null && Number.isFinite(Number(override)) && Number(override) >= 0) {
    total = Number(override);
  }
  if (!Number.isFinite(total) || total < 0) total = 0;

  function localDate(dateString) {
    var parts = dateString.split("-").map(Number);
    if (parts.length !== 3 || parts.some(function (part) { return !Number.isFinite(part); })) return null;
    var date = new Date(parts[0], parts[1] - 1, parts[2]);
    if (date.getFullYear() !== parts[0] || date.getMonth() !== parts[1] - 1 || date.getDate() !== parts[2]) return null;
    return date;
  }

  function daysFromToday(date) {
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((date.getTime() - today.getTime()) / 86400000);
  }

  function formatPoints(value) {
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);
  }

  function pickSentence(percent, remaining, perWeek) {
    var pool = [];
    if (settings.messageStyle === "motivational") {
      if (percent < 25) pool = ["Work on it bro!", "Pick one event this week. Just one."];
      else if (percent < 75) pool = ["Keep up the momentum.", "Good progress. Don't slow down now."];
      else if (percent < 100) pool = ["So close. One or two more activities.", "Finish strong."];
      else pool = ["Target reached. Anything extra is a bonus."];
    } else if (settings.messageStyle === "harsh") {
      if (percent < 25) pool = [
        "Nobody is going to collect these points for you.",
        "Every week you wait, you need more points per week."
      ];
      else if (percent < 75) pool = [
        "You need " + perWeek + " a week. Is this week one of them?",
        "Being busy isn't the same as being on track."
      ];
      else if (percent < 100) pool = ["Almost is still not there.", formatPoints(remaining) + " left. No excuses now."];
      else pool = ["Target reached. Don't coast."];
    }
    return pool.length ? pool[Math.floor(Math.random() * pool.length)] : "";
  }

  var remaining = Math.max(0, settings.target - total);
  var percent = (total / settings.target) * 100;
  var dday = localDate(settings.dday);
  var daysLeft = dday ? daysFromToday(dday) : 0;
  var weeksLeft = Math.ceil(Math.max(0, daysLeft) / 7);
  var perWeek = Math.ceil(remaining / Math.max(1, weeksLeft));
  var sentence = "";

  if (settings.messageStyle !== "off") {
    if (dday && daysLeft < 0) sentence = "This sidang has ended.";
    else sentence = pickSentence(percent, remaining, perWeek);
  }

  document.getElementById("total-points").textContent = formatPoints(total);
  document.getElementById("message-line").textContent = sentence;
  document.getElementById("message-line").hidden = !sentence;
  document.getElementById("dday-label").textContent = dday
    ? (daysLeft < 0 ? "D+" + Math.abs(daysLeft) : "D-" + daysLeft)
    : "D-Day";
}());
