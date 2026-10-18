// Settings-page creator lightbox: open, copy the domain, and close cleanly.
(function () {
  "use strict";

  var dialog = document.getElementById("creator-dialog");
  var openButton = document.getElementById("creator-link");
  var closeButton = document.getElementById("creator-close");
  var copyButton = document.getElementById("creator-copy");
  var urlNode = document.getElementById("creator-url");
  var status = document.getElementById("creator-status");
  var copyTimer = null;

  if (!dialog || !openButton || !closeButton || !copyButton || !urlNode || !status) return;

  function setStatus(message) {
    if (copyTimer) {
      clearTimeout(copyTimer);
      copyTimer = null;
    }
    status.textContent = message;
    if (message === "Copied") {
      copyTimer = setTimeout(function () {
        status.textContent = "";
        copyTimer = null;
      }, 1500);
    }
  }

  function openDialog() {
    if (typeof dialog.showModal === "function" && !dialog.open) {
      dialog.showModal();
    } else if (typeof dialog.showModal !== "function") {
      dialog.setAttribute("open", "");
    }
    document.body.classList.add("dialog-open");
    copyButton.focus();
  }

  function closeDialog() {
    if (typeof dialog.close === "function" && dialog.open) {
      dialog.close();
      return;
    }
    dialog.removeAttribute("open");
    document.body.classList.remove("dialog-open");
    openButton.focus();
  }

  function fallbackCopy() {
    try {
      var range = document.createRange();
      range.selectNodeContents(urlNode);
      var selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      var copied = document.execCommand("copy");
      selection.removeAllRanges();
      setStatus(copied ? "Copied" : "Couldn't copy — select the text and copy manually.");
    } catch (error) {
      setStatus("Couldn't copy — select the text and copy manually.");
    }
  }

  function copy() {
    var value = urlNode.textContent.trim();
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      try {
        navigator.clipboard.writeText(value).then(function () {
          setStatus("Copied");
        }, fallbackCopy);
        return;
      } catch (error) {
        fallbackCopy();
        return;
      }
    }
    fallbackCopy();
  }

  openButton.addEventListener("click", openDialog);
  closeButton.addEventListener("click", closeDialog);
  copyButton.addEventListener("click", copy);

  dialog.addEventListener("click", function (event) {
    if (event.target === dialog) closeDialog();
  });

  dialog.addEventListener("keydown", function (event) {
    if (event.key !== "Tab") return;
    var inside = dialog.contains(document.activeElement);
    if (event.shiftKey) {
      if (!inside || document.activeElement === copyButton) {
        event.preventDefault();
        closeButton.focus();
      }
      return;
    }
    if (!inside || document.activeElement === closeButton) {
      event.preventDefault();
      copyButton.focus();
    }
  });

  dialog.addEventListener("close", function () {
    document.body.classList.remove("dialog-open");
    if (copyTimer) {
      clearTimeout(copyTimer);
      copyTimer = null;
    }
    status.textContent = "";
    openButton.focus();
  });
}());
