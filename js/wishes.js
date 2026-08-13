/**
 * Wishes section — shell form + createWishPearl animation
 */
(function createWishes() {
  "use strict";

  var root = window.WeddingInvitation || {};
  window.WeddingInvitation = root;

  var WishesState = Object.freeze({
    CLOSED: "CLOSED",
    OPENING: "OPENING",
    OPEN: "OPEN",
    FORM: "FORM",
    FADING: "FADING",
    PARTICLE: "PARTICLE",
    PEARL: "PEARL",
    SENT: "SENT",
  });

  function prefersReducedMotion() {
    if (typeof root.prefersReducedMotion === "function") {
      return root.prefersReducedMotion();
    }

    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function wait(ms) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, prefersReducedMotion() ? Math.min(ms, 120) : ms);
    });
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /**
   * Turns a submitted wish into a pearl inside the wishes shell.
   * @param {string} name
   * @param {string} message Reserved for a future backend; unused visually for now.
   * @param {object} [options]
   * @param {HTMLElement} [options.root]
   * @returns {Promise<{name: string, message: string}>}
   */
  function createWishPearl(name, message, options) {
    options = options || {};

    var section =
      options.root ||
      document.getElementById("wishes");

    if (!section) {
      return Promise.reject(new Error("Wishes section not found"));
    }

    var thanks = section.querySelector("#wish-thanks");
    var pearlStage = section.querySelector(".wish-pearl-stage");
    var form = section.querySelector(".wish-form");
    var safeName = String(name || "").trim() || "гость";
    var safeMessage = String(message || "").trim();

    section.dataset.wishName = safeName;
    section.dataset.wishMessage = safeMessage;

    function setPhase(phase) {
      section.dataset.state = phase;
    }

    function finishThanks() {
      if (thanks) {
        thanks.hidden = false;
        thanks.innerHTML =
          "Спасибо, " + escapeHtml(safeName) + " <span aria-hidden=\"true\">🤍</span>";
      }

      if (pearlStage) {
        pearlStage.setAttribute("aria-hidden", "false");
      }

      if (form) {
        form.setAttribute("aria-hidden", "true");
      }

      setPhase(WishesState.SENT);

      return {
        name: safeName,
        message: safeMessage,
      };
    }

    if (prefersReducedMotion()) {
      setPhase(WishesState.PEARL);
      return wait(160).then(finishThanks);
    }

    setPhase(WishesState.FADING);

    return wait(480)
      .then(function () {
        setPhase(WishesState.PARTICLE);
        return wait(720);
      })
      .then(function () {
        setPhase(WishesState.PEARL);
        return wait(1100);
      })
      .then(finishThanks);
  }

  function initWishes() {
    var section = document.getElementById("wishes");
    var cta = section && section.querySelector(".wishes__cta");
    var form = section && section.querySelector(".wish-form");
    var nameInput = section && section.querySelector("#wish-name");
    var messageInput = section && section.querySelector("#wish-message");
    var submitBtn = section && section.querySelector(".wish-form__submit");

    if (!section || !cta || !form || typeof root.createShell !== "function") {
      return;
    }

    var shell = root.createShell(section);
    var shellOpen = section.querySelector(".shell-open");
    var submitting = false;

    if (!shell) {
      return;
    }

    function showForm() {
      shell.setState(WishesState.FORM);
      section.setAttribute("aria-expanded", "true");

      if (shellOpen) {
        shellOpen.setAttribute("aria-hidden", "false");
      }

      window.setTimeout(function () {
        if (nameInput) {
          nameInput.focus();
        }
      }, 80);
    }

    function openWishes() {
      if (shell.getState() !== WishesState.CLOSED) {
        return;
      }

      cta.disabled = true;
      cta.setAttribute("aria-expanded", "true");
      shell.open(showForm);
    }

    function simulateSubmit(event) {
      event.preventDefault();

      if (submitting || shell.getState() !== WishesState.FORM) {
        return;
      }

      var name = nameInput ? nameInput.value.trim() : "";
      var message = messageInput ? messageInput.value.trim() : "";

      if (!name || !message) {
        if (!name && nameInput) {
          nameInput.focus();
        } else if (messageInput) {
          messageInput.focus();
        }
        return;
      }

      submitting = true;

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Отправляем…";
      }

      wait(450)
        .then(function () {
          return createWishPearl(name, message, { root: section });
        })
        .catch(function () {
          submitting = false;

          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Отправить";
          }

          shell.setState(WishesState.FORM);
        });
    }

    cta.addEventListener("click", openWishes);
    form.addEventListener("submit", simulateSubmit);
  }

  root.WishesState = WishesState;
  root.createWishPearl = createWishPearl;
  root.initWishes = initWishes;
})();
