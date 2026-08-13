/**
 * Intro shell scene — createShell → pearl reveal → pearl zoom → invitation
 */
(function createIntroScene() {
  "use strict";

  var IntroState = Object.freeze({
    CLOSED: "CLOSED",
    OPENING: "OPENING",
    OPEN: "OPEN",
    PEARL_REVEAL: "PEARL_REVEAL",
    PEARL_ZOOM: "PEARL_ZOOM",
    INVITATION: "INVITATION",
  });

  var root = window.WeddingInvitation || {};
  window.WeddingInvitation = root;

  function initIntro() {
    var intro = document.getElementById("intro");
    var trigger = intro && intro.querySelector(".intro__trigger");
    var pearlWrap = intro && intro.querySelector(".pearl-wrap");
    var invitation = document.getElementById("invitation");
    var skipLink = document.querySelector(".skip-link");

    if (!intro || !trigger || !pearlWrap || !invitation) {
      return;
    }

    if (typeof root.createShell !== "function") {
      return;
    }

    var shell = root.createShell(intro);
    var afterTransition = root.afterTransition;
    var cssDurationMs = root.cssDurationMs;
    var prefersReducedMotion = root.prefersReducedMotion;

    if (!shell) {
      return;
    }

    function showInvitation() {
      if (shell.getState() === IntroState.INVITATION) {
        return;
      }

      shell.setState(IntroState.INVITATION);
      document.body.dataset.scene = "invitation";
      intro.setAttribute("aria-hidden", "true");
      invitation.setAttribute("aria-hidden", "false");
      trigger.disabled = true;

      afterTransition(
        intro,
        "opacity",
        cssDurationMs(document.body, "--intro-exit-duration"),
        function () {
          invitation.focus({ preventScroll: true });
        }
      );
    }

    function startPearlZoom() {
      if (shell.getState() !== IntroState.PEARL_REVEAL) {
        return;
      }

      shell.setState(IntroState.PEARL_ZOOM);

      var zoomMs = cssDurationMs(document.body, "--intro-zoom-duration");

      /* Crossfade onto the invitation pearl before the zoom fully settles */
      window.setTimeout(function () {
        if (shell.getState() !== IntroState.PEARL_ZOOM) {
          return;
        }

        showInvitation();
      }, Math.round(zoomMs * 0.58));
    }

    function revealPearl() {
      shell.setState(IntroState.PEARL_REVEAL);

      afterTransition(
        pearlWrap,
        "opacity",
        cssDurationMs(document.body, "--intro-pearl-duration"),
        startPearlZoom
      );
    }

    function openShell() {
      if (shell.getState() !== IntroState.CLOSED) {
        return;
      }

      trigger.disabled = true;
      trigger.setAttribute("aria-disabled", "true");

      if (prefersReducedMotion()) {
        shell.setState(IntroState.OPENING);
        shell.setState(IntroState.PEARL_REVEAL);
        afterTransition(
          pearlWrap,
          "opacity",
          cssDurationMs(document.body, "--intro-pearl-duration"),
          showInvitation
        );
        return;
      }

      shell.open(revealPearl);
    }

    trigger.addEventListener("click", openShell);

    if (skipLink) {
      skipLink.addEventListener("click", function (event) {
        event.preventDefault();
        showInvitation();
        invitation.focus();
      });
    }
  }

  root.IntroState = IntroState;
  root.initIntro = initIntro;
})();
