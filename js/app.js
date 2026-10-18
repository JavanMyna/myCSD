// Home display loads settings and the current-sidang total from the active data backend.
(function () {
  "use strict";

  var signInView = document.getElementById("sign-in-view");
  var signInButton = document.getElementById("google-sign-in");
  var demoButton = document.getElementById("demo-start");
  var signInError = document.getElementById("sign-in-error");
  var homeView = document.getElementById("home-view");
  var totalNode = document.getElementById("total-points");
  var messageNode = document.getElementById("message-line");
  var goalNode = document.getElementById("goal-line");
  var approximateNode = document.getElementById("approximate-note");
  var ddayNode = document.getElementById("dday-label");
  var retryButton = document.getElementById("home-retry");
  var refreshButton = document.getElementById("home-refresh");
  var loadingHome = false;

  function dayNumber(value) {
    var parts = String(value).split("-").map(Number);
    return Math.floor(Date.UTC(parts[0], parts[1] - 1, parts[2]) / 86400000);
  }

  function ddayInfo(dday) {
    var today = new Date();
    var todayKey = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    var days = Math.round((dayNumber(dday) * 86400000 - todayKey) / 86400000);
    return { days: days, label: days < 0 ? "D+" + Math.abs(days) : "D-" + days };
  }

  function choose(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function sentenceFor(total, settings, daysRemaining) {
    if (daysRemaining < 0) return "This sidang has ended.";
    if (settings.messageStyle === "off") return "";

    var target = Number(settings.target) || 300;
    var remaining = Math.max(0, target - total);
    var percent = total / target * 100;
    var weeks = Math.ceil(Math.max(0, daysRemaining) / 7);
    var perWeek = weeks > 0 ? Math.ceil(remaining / weeks) : remaining;
    var pools;

    if (settings.messageStyle === "harsh") {
      if (percent < 25) pools = [
        "Nobody is going to collect these points for you.",
        "Every week you wait, you need more points per week."
      ];
      else if (percent < 75) pools = [
        "You need " + perWeek + " a week. Is this week one of them?",
        "Being busy isn't the same as being on track."
      ];
      else if (percent < 100) pools = [
        "Almost is still not there.",
        remaining + " left. No excuses now."
      ];
      else pools = ["Target reached. Don't coast."];
    } else {
      if (percent < 25) pools = [
        "Work on it bro!",
        "Pick one event this week. Just one."
      ];
      else if (percent < 75) pools = [
        "Keep up the momentum.",
        "Good progress. Don't slow down now."
      ];
      else if (percent < 100) pools = [
        "So close. One or two more activities.",
        "Finish strong."
      ];
      else pools = ["Target reached. Anything extra is a bonus."];
    }
    return choose(pools);
  }

  function goalSentence(total, settings) {
    var target = Number(settings.target);
    if (!settings.target || !Number.isFinite(target) || target <= 0) return "";

    var ratio = total / target;
    var percent = Math.round(ratio * 100);
    if (ratio >= 1) {
      if (settings.messageStyle === "off") return percent + "% of target.";
      return "You're at " + percent + "% of your target.";
    }

    var shown = total > 0 && percent === 0 ? "under 1" : String(percent);
    if (settings.messageStyle === "harsh") return "You're " + shown + "% of the way there.";
    if (settings.messageStyle === "off") return shown + "% of target.";
    return "You're " + shown + "% near your goal.";
  }

  function setRefreshing(isRefreshing) {
    refreshButton.disabled = isRefreshing;
    refreshButton.textContent = isRefreshing ? "Refreshing…" : "Refresh";
    refreshButton.setAttribute("aria-busy", isRefreshing ? "true" : "false");
    if (isRefreshing) homeView.setAttribute("aria-busy", "true");
    else homeView.removeAttribute("aria-busy");
  }

  function showSignedOut() {
    signInView.hidden = false;
    homeView.hidden = true;
  }

  function showHome() {
    signInView.hidden = true;
    homeView.hidden = false;
  }

  function resetHome() {
    retryButton.hidden = true;
    retryButton.disabled = true;
    totalNode.textContent = "—";
    totalNode.classList.add("total-loading");
    totalNode.setAttribute("aria-label", "Loading total myCSD points");
    ddayNode.textContent = "";
    messageNode.textContent = "";
    goalNode.textContent = "";
    approximateNode.hidden = true;
    showHome();
  }

  async function loadHome() {
    if (loadingHome) return;
    loadingHome = true;
    setRefreshing(true);
    resetHome();

    var settings;
    try {
      settings = await window.MYCSD_SETTINGS_STORE.load(window.MYCSD_CONFIG);
    } catch (error) {
      messageNode.textContent = "Couldn't load settings.";
      retryButton.hidden = false;
      retryButton.disabled = false;
      setRefreshing(false);
      loadingHome = false;
      return;
    }

    var countdown = ddayInfo(settings.dday);
    ddayNode.textContent = countdown.label;

    try {
      var summary = await window.MYCSD_ACTIVITY_DATA.summaryForSidang(settings.sidang);
      var total = summary.points;
      totalNode.textContent = String(total);
      totalNode.classList.remove("total-loading");
      totalNode.setAttribute(
        "aria-label",
        settings.target ? total + " of " + settings.target + " myCSD points" : total + " myCSD points"
      );
      messageNode.textContent = sentenceFor(total, settings, countdown.days);
      goalNode.textContent = goalSentence(total, settings);
      approximateNode.hidden = !summary.unconfirmed;
    } catch (error) {
      messageNode.textContent = "Couldn't load your total. Try again.";
      retryButton.hidden = false;
      retryButton.disabled = false;
    }

    setRefreshing(false);
    loadingHome = false;
  }

  function startForGuest() {
    window.MYCSD_DATA.mountDemoBanner();
    window.MYCSD_REFRESH_ON_RETURN(loadHome);
    loadHome();
  }

  signInButton.addEventListener("click", async function () {
    signInButton.disabled = true;
    signInError.hidden = true;
    try {
      await window.MYCSD_AUTH.signInWithGoogle();
    } catch (error) {
      signInError.textContent = "Couldn't sign in. Check your connection and try again.";
      signInError.hidden = false;
      signInButton.disabled = false;
    }
  });

  demoButton.addEventListener("click", function () {
    try {
      window.MYCSD_DATA.enterGuest();
      window.location.reload();
    } catch (error) {
      signInError.textContent = "Demo mode needs browser storage. Check your browser settings.";
      signInError.hidden = false;
    }
  });

  retryButton.addEventListener("click", loadHome);
  refreshButton.addEventListener("click", loadHome);

  window.MYCSD_AUTH.getSession().then(function (session) {
    if (session) {
      window.MYCSD_DATA.leaveGuest();
      window.MYCSD_REFRESH_ON_RETURN(loadHome);
      loadHome();
      return;
    }
    if (window.MYCSD_DATA.isGuest()) {
      startForGuest();
      return;
    }
    showSignedOut();
  }).catch(function () {
    if (window.MYCSD_DATA.isGuest()) {
      startForGuest();
      return;
    }
    showSignedOut();
  });
}());
