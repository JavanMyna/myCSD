// Load and delete activities for the sidang selected in local settings.
(function () {
  "use strict";

  var main = document.getElementById("list-main");
  var list = document.getElementById("activity-list");
  var emptyLine = document.getElementById("empty-line");
  var errorLine = document.getElementById("list-error");

  function addText(parent, className, value) {
    var node = document.createElement("span");
    node.className = className;
    node.textContent = String(value);
    parent.appendChild(node);
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
    addText(details, "activity-meta", activity.points + " points · " + activity.level + " · " + activity.date);
    row.appendChild(details);

    var removeButton = document.createElement("button");
    removeButton.className = "plain-action delete-action";
    removeButton.type = "button";
    removeButton.textContent = "Delete";
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
    row.appendChild(removeButton);
    return row;
  }

  window.MYCSD_AUTH.getSession().then(async function (session) {
    if (!session) {
      window.location.replace("index.html");
      return;
    }
    document.body.classList.remove("auth-pending");
    main.hidden = false;
    try {
      var settings = window.MYCSD_SETTINGS_STORE.load(window.MYCSD_CONFIG);
      var activities = await window.MYCSD_ACTIVITY_DATA.listForSidang(settings.sidang);
      activities.forEach(function (activity) {
        list.appendChild(makeRow(activity));
      });
      updateEmpty();
    } catch (error) {
      errorLine.textContent = "Couldn't load activities. Try again.";
    }
  }).catch(function () {
    window.location.replace("index.html");
  });
}());
