// Home display loads the signed-in user's settings and current-sidang total.
(function () {
  "use strict";

  var signInView = document.getElementById("sign-in-view");
  var signInButton = document.getElementById("google-sign-in");
  var signInError = document.getElementById("sign-in-error");
  var homeView = document.getElementById("home-view");
  var totalNode = document.getElementById("total-points");
  var messageNode = document.getElementById("message-line");
  var ddayNode = document.getElementById("dday-label");
  var retryButton = document.getElementById("home-retry");

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

  function showSignedOut() {
    signInView.hidden = false;
    homeView.hidden = true;
  }

  function showHome() {
    signInView.hidden = true;
    homeView.hidden = false;
  }

  async function loadHome() {
    retryButton.hidden = true;
    retryButton.disabled = true;
    totalNode.textContent = "—";
    totalNode.classList.add("total-loading");
    ddayNode.textContent = "";
    messageNode.textContent = "";
    showHome();

    var settings;
    try {
      settings = await window.MYCSD_SETTINGS_STORE.load(window.MYCSD_CONFIG);
    } catch (error) {
      messageNode.textContent = "Couldn't load settings.";
      retryButton.hidden = false;
      retryButton.disabled = false;
      return;
    }

    var countdown = ddayInfo(settings.dday);
    ddayNode.textContent = countdown.label;
    try {
      var total = await window.MYCSD_ACTIVITY_DATA.pointsForSidang(settings.sidang);
      totalNode.textContent = String(total);
      totalNode.classList.remove("total-loading");
      messageNode.textContent = sentenceFor(total, settings, countdown.days);
    } catch (error) {
      messageNode.textContent = "Couldn't load your total. Try again.";
    }
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

  retryButton.addEventListener("click", loadHome);

  window.MYCSD_AUTH.getSession().then(function (session) {
    if (!session) {
      showSignedOut();
      return;
    }
    loadHome();
  }).catch(function () {
    showSignedOut();
  });
}());
