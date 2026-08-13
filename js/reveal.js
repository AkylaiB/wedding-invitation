/**
 * Subtle scroll reveal via IntersectionObserver
 */
(function createReveal() {
  "use strict";

  var root = window.WeddingInvitation || {};
  window.WeddingInvitation = root;
  var started = false;

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function revealAll(nodes) {
    Array.prototype.forEach.call(nodes, function (node) {
      node.classList.add("is-visible");
    });
  }

  function startReveal() {
    if (started) {
      return;
    }

    started = true;

    var nodes = document.querySelectorAll(".reveal");

    if (!nodes.length) {
      return;
    }

    if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
      revealAll(nodes);
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        root: null,
        rootMargin: "0px 0px -8% 0px",
        threshold: 0.18,
      }
    );

    Array.prototype.forEach.call(nodes, function (node, index) {
      node.style.setProperty("--reveal-delay", index * 0.06 + "s");
      observer.observe(node);
    });
  }

  function initReveal() {
    if (document.body.dataset.scene === "invitation") {
      startReveal();
      return;
    }

    var sceneWatcher = new MutationObserver(function () {
      if (document.body.dataset.scene === "invitation") {
        sceneWatcher.disconnect();
        startReveal();
      }
    });

    sceneWatcher.observe(document.body, {
      attributes: true,
      attributeFilter: ["data-scene"],
    });
  }

  root.initReveal = initReveal;
})();
