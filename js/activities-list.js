// Load, edit, and delete activities for the sidang selected in the user's settings.
(function () {
  "use strict";

  var main = document.getElementById("list-main");
  var list = document.getElementById("activity-list");
  var emptyLine = document.getElementById("empty-line");
  var errorLine = document.getElementById("list-error");
  var pageError = document.getElementById("page-load-error");
  var retryButton = document.getElementById("page-load-retry");
  var LEVEL_LABELS = {
    club: "Club",
    university: "University",
    national: "National",
    webinars: "Webinars",
    misc: "Misc",
    unsure: "Unsure",
    college: "College (legacy)"
  };

  function addText(parent, className, value) {
    var node = document.createElement("span");
    node.className = className;
    node.textContent = String(value);
    parent.appendChild(node);
  }

  function levelLabel(value) {
    return LEVEL_LABELS[value] || String(value);
  }

  function updateEmpty() {
    emptyLine.hidden = list.children.length !== 0;
  }

  function makeRow(activity) {
    var row = document.createElement("li");
    row.className = "activity-row";
    var details = document.createElement("div");
    details.className = "activity-details";
    addText(details, "activity-name", activity.name);
    addText(
      details,
      "activity-meta",
      activity.points + " points · " + levelLabel(activity.level) + " · " + (activity.date || "No date")
    );

    var badge = document.createElement("span");
    badge.className = "confirm-badge " + (activity.confirmed ? "is-confirmed" : "is-unconfirmed");
    badge.textContent = activity.confirmed ? "Confirmed" : "Unconfirmed";
    details.appendChild(badge);
    row.appendChild(details);

    var actions = document.createElement("div");
    actions.className = "activity-actions";

    var editLink = document.createElement("a");
    editLink.className = "plain-action edit-action";
    editLink.href = "add-activity.html?edit=" + encodeURIComponent(activity.id);
    editLink.textContent = "Edit";
    editLink.setAttribute("aria-label", "Edit " + activity.name);
    actions.appendChild(editLink);

    var removeButton = document.createElement("button");
    removeButton.className = "plain-action delete-action";
    removeButton.type = "button";
    removeButton.textContent = "Delete";
    removeButton.setAttribute("aria-label", "Delete " + activity.name);
    removeButton.addEventListener("click", async function () {
      if (!window.confirm("Delete this activity?")) return;
      removeButton.disabled = true;
      errorLine.textContent = "";
      try {
        await window.MYCSD_ACTIVITY_DATA.remove(activity.id);
        row.remove();
        updateEmpty();
      } catch (error) {
        errorLine.textContent = "Couldn't delete. Try again.";
        removeButton.disabled = false;
      }
    });
    actions.appendChild(removeButton);
    row.appendChild(actions);
    return row;
  }

  async function loadList() {
    main.hidden = true;
    pageError.hidden = true;
    retryButton.hidden = true;
    retryButton.disabled = true;
    errorLine.textContent = "";
    list.replaceChildren();
    emptyLine.hidden = true;
    var settings;
    try {
      settings = await window.MYCSD_SETTINGS_STORE.load(window.MYCSD_CONFIG);
    } catch (error) {
      pageError.textContent = "Couldn't load settings.";
      pageError.hidden = false;
      retryButton.hidden = false;
      retryButton.disabled = false;
      return;
    }

    main.hidden = false;
    try {
      var activities = await window.MYCSD_ACTIVITY_DATA.listForSidang(settings.sidang);
      activities.forEach(function (activity) {
        list.appendChild(makeRow(activity));
      });
      updateEmpty();
    } catch (error) {
      pageError.textContent = "Couldn't load activities.";
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
    window.MYCSD_REFRESH_ON_RETURN(loadList);
    loadList();
  }

  retryButton.addEventListener("click", loadList);
  window.MYCSD_AUTH.getSession().then(start).catch(function () {
    start(null);
  });
}());
