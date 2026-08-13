/**
 * Reusable pearl-shell hinge controller
 * States: CLOSED → OPENING → OPEN (callers may set further scene states)
 */
(function createShellModule() {
  "use strict";

  var root = window.WeddingInvitation || {};
  window.WeddingInvitation = root;

  var ShellState = Object.freeze({
    CLOSED: "CLOSED",
    OPENING: "OPENING",
    OPEN: "OPEN",
  });

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function cssDurationMs(node, name) {
    var raw = window.getComputedStyle(node).getPropertyValue(name).trim();
    var value = parseFloat(raw);

    if (!raw || Number.isNaN(value)) {
      return 0;
    }

    return raw.indexOf("ms") !== -1 ? value : value * 1000;
  }

  function afterTransition(node, propertyName, durationMs, callback) {
    var settled = false;

    function finish() {
      if (settled) {
        return;
      }

      settled = true;
      node.removeEventListener("transitionend", onEnd);
      window.clearTimeout(timer);
      callback();
    }

    function onEnd(event) {
      if (event.target !== node) {
        return;
      }

      if (propertyName && event.propertyName !== propertyName) {
        return;
      }

      finish();
    }

    node.addEventListener("transitionend", onEnd);
    var timer = window.setTimeout(finish, durationMs + 80);
  }

  /**
   * @param {HTMLElement} element Root with [data-shell] and .shell-lid inside
   * @param {object} [options]
   * @param {string} [options.openDurationVar]
   * @param {function} [options.onStateChange]
   */
  function createShell(element, options) {
    options = options || {};

    if (!element) {
      return null;
    }

    var lid = element.querySelector(".shell-lid");
    var openDurationVar = options.openDurationVar || "--intro-open-duration";
    var state = element.dataset.state || ShellState.CLOSED;
    var locked = false;

    function setState(next) {
      state = next;
      element.dataset.state = next;

      if (typeof options.onStateChange === "function") {
        options.onStateChange(next);
      }
    }

    function getState() {
      return state;
    }

    function isBusy() {
      return locked || state === ShellState.OPENING;
    }

    function isOpen() {
      return state !== ShellState.CLOSED && state !== ShellState.OPENING;
    }

    /**
     * Opens the hinged lid. Resolves when the shell reaches OPEN.
     * @param {function} [onOpened]
     */
    function open(onOpened) {
      if (state !== ShellState.CLOSED || locked) {
        return;
      }

      locked = true;
      setState(ShellState.OPENING);

      function finishOpen() {
        setState(ShellState.OPEN);
        locked = false;

        if (typeof onOpened === "function") {
          onOpened();
        }
      }

      if (!lid || prefersReducedMotion()) {
        finishOpen();
        return;
      }

      afterTransition(
        lid,
        "transform",
        cssDurationMs(document.body, openDurationVar),
        finishOpen
      );
    }

    setState(state);

    return {
      element: element,
      lid: lid,
      open: open,
      setState: setState,
      getState: getState,
      isBusy: isBusy,
      isOpen: isOpen,
      prefersReducedMotion: prefersReducedMotion,
      afterTransition: afterTransition,
      cssDurationMs: cssDurationMs,
    };
  }

  root.ShellState = ShellState;
  root.createShell = createShell;
  root.prefersReducedMotion = prefersReducedMotion;
  root.afterTransition = afterTransition;
  root.cssDurationMs = cssDurationMs;
})();
