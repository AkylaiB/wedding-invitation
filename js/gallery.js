/**
 * Gallery lightbox — vanilla dialog, no library
 */
(function createGallery() {
  "use strict";

  var root = window.WeddingInvitation || {};
  window.WeddingInvitation = root;

  function initGallery() {
    var gallery = document.getElementById("gallery");
    var dialog = document.getElementById("lightbox");

    if (!gallery || !dialog || typeof dialog.showModal !== "function") {
      return;
    }

    var triggers = gallery.querySelectorAll("[data-gallery-index]");
    var image = dialog.querySelector(".lightbox__image");
    var status = dialog.querySelector(".lightbox__status");
    var closeBtn = dialog.querySelector(".lightbox__close");
    var prevBtn = dialog.querySelector(".lightbox__prev");
    var nextBtn = dialog.querySelector(".lightbox__next");
    var items = [];
    var index = 0;
    var lastTrigger = null;

    Array.prototype.forEach.call(triggers, function (trigger) {
      var img = trigger.querySelector("img");

      items.push({
        src: trigger.getAttribute("data-full") || (img && img.currentSrc) || (img && img.src),
        alt: trigger.getAttribute("data-alt") || (img && img.getAttribute("alt")) || "",
        trigger: trigger,
      });
    });

    function update() {
      var item = items[index];

      if (!item) {
        return;
      }

      image.src = item.src;
      image.alt = item.alt;
      status.textContent = index + 1 + " / " + items.length;
      prevBtn.disabled = items.length < 2;
      nextBtn.disabled = items.length < 2;
    }

    function open(nextIndex, trigger) {
      if (!items.length) {
        return;
      }

      index = nextIndex;
      lastTrigger = trigger || items[index].trigger;
      update();
      document.body.classList.add("is-lightbox-open");
      dialog.showModal();
      closeBtn.focus();
    }

    function close() {
      if (!dialog.open) {
        return;
      }

      dialog.close();
    }

    function show(step) {
      if (!items.length) {
        return;
      }

      index = (index + step + items.length) % items.length;
      update();
    }

    gallery.addEventListener("click", function (event) {
      var trigger = event.target.closest("[data-gallery-index]");

      if (!trigger || !gallery.contains(trigger)) {
        return;
      }

      event.preventDefault();
      open(Number(trigger.getAttribute("data-gallery-index")), trigger);
    });

    closeBtn.addEventListener("click", close);
    prevBtn.addEventListener("click", function () {
      show(-1);
    });
    nextBtn.addEventListener("click", function () {
      show(1);
    });

    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) {
        close();
      }
    });

    dialog.addEventListener("close", function () {
      document.body.classList.remove("is-lightbox-open");
      image.removeAttribute("src");
      image.alt = "";

      if (lastTrigger) {
        lastTrigger.focus();
      }
    });

    dialog.addEventListener("keydown", function (event) {
      if (!dialog.open) {
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        show(-1);
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        show(1);
      }
    });
  }

  root.initGallery = initGallery;
})();
