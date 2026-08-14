/**
 * Intro — play shell-open video, freeze the last pearl frame, show invitation copy
 */
(function createIntroScene() {
  "use strict";

  var IntroState = Object.freeze({
    CLOSED: "CLOSED",
    PLAYING: "PLAYING",
    ENDED: "ENDED",
  });

  var root = window.WeddingInvitation || {};
  window.WeddingInvitation = root;

  function prefersReducedMotion() {
    if (typeof root.prefersReducedMotion === "function") {
      return root.prefersReducedMotion();
    }

    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function initIntro() {
    var intro = document.getElementById("intro");
    var trigger = intro && intro.querySelector(".intro__trigger");
    var video = intro && intro.querySelector(".intro__video");
    var text = intro && intro.querySelector(".intro__text");
    var invitation = document.getElementById("invitation");
    var skipLink = document.querySelector(".skip-link");

    if (!intro || !trigger || !video || !text || !invitation) {
      return;
    }

    var finished = false;

    function showFirstFrame() {
      if (intro.dataset.state !== IntroState.CLOSED) {
        return;
      }

      if (!isFinite(video.duration) || video.readyState < 1) {
        return;
      }

      try {
        if (video.currentTime < 0.01) {
          video.currentTime = 0.001;
        }
      } catch (error) {
        /* Seeking can fail before metadata is ready. */
      }
    }

    video.addEventListener("loadeddata", showFirstFrame);
    video.addEventListener("loadedmetadata", showFirstFrame);

    if (video.readyState >= 1) {
      showFirstFrame();
    }

    function freezeLastFrame() {
      if (!isFinite(video.duration) || video.duration <= 0) {
        return;
      }

      try {
        video.pause();
        video.currentTime = Math.max(0, video.duration - 0.04);
      } catch (error) {
        /* Seeking can fail before metadata is ready. */
      }
    }

    function showInvitation() {
      if (finished) {
        return;
      }

      finished = true;
      intro.dataset.state = IntroState.ENDED;
      document.body.dataset.scene = "invitation";
      text.setAttribute("aria-hidden", "false");
      invitation.setAttribute("aria-hidden", "false");
      trigger.disabled = true;
      trigger.setAttribute("aria-disabled", "true");
      freezeLastFrame();
    }

    function jumpToEnd(thenShow) {
      function finishJump() {
        video.removeEventListener("seeked", finishJump);
        freezeLastFrame();
        if (thenShow) {
          showInvitation();
        }
      }

      if (!isFinite(video.duration) || video.duration <= 0) {
        video.addEventListener(
          "loadedmetadata",
          function onMeta() {
            video.removeEventListener("loadedmetadata", onMeta);
            jumpToEnd(thenShow);
          },
          { once: true }
        );
        return;
      }

      video.addEventListener("seeked", finishJump);
      try {
        video.currentTime = Math.max(0, video.duration - 0.04);
      } catch (error) {
        finishJump();
      }
    }

    function playIntro() {
      if (intro.dataset.state !== IntroState.CLOSED) {
        return;
      }

      trigger.disabled = true;
      trigger.setAttribute("aria-disabled", "true");

      if (prefersReducedMotion()) {
        intro.dataset.state = IntroState.PLAYING;
        jumpToEnd(true);
        return;
      }

      intro.dataset.state = IntroState.PLAYING;
      var playAttempt = video.play();

      if (playAttempt && typeof playAttempt.catch === "function") {
        playAttempt.catch(function () {
          jumpToEnd(true);
        });
      }
    }

    video.addEventListener("timeupdate", function () {
      if (intro.dataset.state !== IntroState.PLAYING || finished) {
        return;
      }

      if (video.duration && video.currentTime >= video.duration - 0.28) {
        showInvitation();
      }
    });

    video.addEventListener("ended", showInvitation);

    trigger.addEventListener("click", playIntro);

    if (skipLink) {
      skipLink.addEventListener("click", function (event) {
        event.preventDefault();
        jumpToEnd(true);
        text.setAttribute("tabindex", "-1");
        window.requestAnimationFrame(function () {
          text.focus({ preventScroll: true });
        });
      });
    }
  }

  root.IntroState = IntroState;
  root.initIntro = initIntro;
})();
