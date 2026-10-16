// Load and delete activities for the sidang selected in the user's settings row.
(function () {
  "use strict";

  var main = document.getElementById("list-main");
  var list = document.getElementById("activity-list");
  var emptyLine = document.getElementById("empty-line");
  var errorLine = document.getElementById("list-error");
  var pageError = document.getElementById("page-load-error");
  var retryButton = document.getElementById("page-load-retry");

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

  retryButton.addEventListener("click", loadList);
  window.MYCSD_AUTH.getSession().then(function (session) {
    if (!session) {
      window.location.replace("index.html");
      return;
    }
    document.body.classList.remove("auth-pending");
    window.MYCSD_REFRESH_ON_RETURN(loadList);
    loadList();
  }).catch(function () {
    window.location.replace("index.html");
  });
}());
