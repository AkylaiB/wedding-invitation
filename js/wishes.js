/**
 * Wishes — Google Form storage, necklace of pearls, hover to read
 */
(function createWishes() {
  "use strict";

  var root = window.WeddingInvitation || {};
  window.WeddingInvitation = root;

  var WishesState = Object.freeze({
    FORM: "FORM",
    FADING: "FADING",
    PEARL: "PEARL",
    SENT: "SENT",
  });

  var PEARL_SRC = "assets/images/pearl.webp";
  var BEAD_SCALES = [0.86, 0.94, 1, 0.9, 1.06, 0.88, 0.97];
  var SPACING = 72;
  var PAD = 56;

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

  function config() {
    return root.wishesConfig || {};
  }

  function isConfigured() {
    var cfg = config();
    var formReady =
      cfg.formAction &&
      cfg.formAction.indexOf("/forms/") !== -1 &&
      cfg.formAction.indexOf("formResponse") !== -1 &&
      cfg.formAction.indexOf("REPLACE_") === -1 &&
      cfg.nameEntry &&
      cfg.nameEntry.indexOf("000000") === -1 &&
      cfg.messageEntry &&
      cfg.messageEntry.indexOf("000000") === -1;
    var sheetReady = cfg.sheetId && cfg.sheetId.indexOf("REPLACE_") === -1;

    return {
      form: Boolean(formReady),
      sheet: Boolean(sheetReady),
    };
  }

  function normalizeWish(name, message) {
    return {
      name: String(name || "").trim() || "Гость",
      message: String(message || "").trim(),
    };
  }

  function isFilledWish(wish) {
    return Boolean(wish && wish.message);
  }

  function wishKey(wish) {
    return (wish.name + "\n" + wish.message).toLowerCase();
  }

  function pickColumn(headers, patterns) {
    var i;
    var p;

    for (i = 0; i < headers.length; i += 1) {
      for (p = 0; p < patterns.length; p += 1) {
        if (patterns[p].test(headers[i])) {
          return i;
        }
      }
    }

    return -1;
  }

  function headersFromKeys(keys) {
    return keys.map(function (key) {
      return String(key || "").toLowerCase();
    });
  }

  function mapRow(values, nameIndex, messageIndex) {
    return normalizeWish(values[nameIndex], values[messageIndex]);
  }

  function parseTable(headers, rows) {
    var nameIndex = pickColumn(headers, [/имя/, /name/, /от кого/, /гость/]);
    var messageIndex = pickColumn(headers, [
      /пож[еа]лан/,
      /сообщ/,
      /message/,
      /wish/,
      /текст/,
    ]);

    if (nameIndex < 0) {
      nameIndex = headers.length > 1 ? 1 : 0;
    }

    if (messageIndex < 0) {
      messageIndex = Math.min(nameIndex + 1, headers.length - 1);
    }

    return rows
      .map(function (row) {
        return mapRow(row, nameIndex, messageIndex);
      })
      .filter(isFilledWish);
  }

  function parseGviz(text) {
    var start = text.indexOf("{");
    var end = text.lastIndexOf("}");

    if (start < 0 || end < start) {
      return [];
    }

    var payload = JSON.parse(text.slice(start, end + 1));
    var table = payload.table || {};
    var cols = table.cols || [];
    var rows = table.rows || [];
    var headers = cols.map(function (col) {
      return String((col && (col.label || col.id)) || "").toLowerCase();
    });
    var values = rows.map(function (row) {
      return (row.c || []).map(function (cell) {
        if (!cell) {
          return "";
        }

        return cell.v == null ? "" : cell.v;
      });
    });

    return parseTable(headers, values);
  }

  function parseOpenSheet(rows) {
    if (!Array.isArray(rows) || !rows.length) {
      return [];
    }

    if (Array.isArray(rows[0])) {
      var headers = headersFromKeys(rows[0]);
      return parseTable(headers, rows.slice(1));
    }

    var keys = Object.keys(rows[0] || {});
    var headers = headersFromKeys(keys);

    return parseTable(
      headers,
      rows.map(function (row) {
        return keys.map(function (key) {
          return row[key];
        });
      })
    );
  }

  function fetchText(url) {
    return fetch(url, { cache: "no-store" }).then(function (response) {
      if (!response.ok) {
        throw new Error("Wish feed failed");
      }

      return response.text();
    });
  }

  function loadWishesFromGoogle() {
    var cfg = config();
    var ready = isConfigured();

    if (!ready.sheet) {
      return Promise.resolve([]);
    }

    var gviz =
      "https://docs.google.com/spreadsheets/d/" +
      encodeURIComponent(cfg.sheetId) +
      "/gviz/tq?tqx=out:json&headers=1";
    var openSheet =
      "https://opensheet.elk.sh/" + encodeURIComponent(cfg.sheetId) + "/1";

    return fetchText(gviz)
      .then(parseGviz)
      .catch(function () {
        return fetch(openSheet, { cache: "no-store" }).then(function (response) {
          if (!response.ok) {
            throw new Error("OpenSheet failed");
          }

          return response.json();
        }).then(parseOpenSheet);
      })
      .catch(function () {
        return [];
      });
  }

  function submitWishToGoogle(name, message) {
    var cfg = config();
    var ready = isConfigured();

    if (!ready.form) {
      return Promise.reject(new Error("Google Form is not configured"));
    }

    var body = new FormData();
    body.append(cfg.nameEntry, name);
    body.append(cfg.messageEntry, message);
    body.append("fvv", "1");

    return fetch(cfg.formAction, {
      method: "POST",
      mode: "no-cors",
      body: body,
    });
  }

  function waveY(x, width, height) {
    var mid = height * 0.52;
    var amp = Math.min(22, height * 0.22);
    return mid + Math.sin((x / Math.max(width, 1)) * Math.PI * 2.15) * amp;
  }

  function threadPath(width, height) {
    var step = 18;
    var x;
    var d = "M 0 " + waveY(0, width, height).toFixed(1);

    for (x = step; x <= width; x += step) {
      d += " L " + x + " " + waveY(x, width, height).toFixed(1);
    }

    return d;
  }

  function createStrand(wishes, height, highlightKey, minWidth) {
    var count = wishes.length;
    var contentWidth = PAD * 2 + Math.max(count, 1) * SPACING;
    var width =
      count === 0
        ? Math.max(minWidth || 320, 320)
        : Math.max(contentWidth, 320);
    var strand = document.createElement("div");
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    var glow = document.createElementNS("http://www.w3.org/2000/svg", "path");
    var line = document.createElementNS("http://www.w3.org/2000/svg", "path");
    var beads = document.createElement("div");
    var path = threadPath(width, height);
    var i;
    var wish;
    var x;
    var button;
    var img;

    strand.className = "wish-necklace__strand";
    strand.style.width = width + "px";

    svg.setAttribute("class", "wish-necklace__thread");
    svg.setAttribute("viewBox", "0 0 " + width + " " + height);
    svg.setAttribute("preserveAspectRatio", "none");
    svg.setAttribute("aria-hidden", "true");

    glow.setAttribute("class", "wish-necklace__thread-glow");
    glow.setAttribute("d", path);
    line.setAttribute("class", "wish-necklace__thread-line");
    line.setAttribute("d", path);
    svg.appendChild(glow);
    svg.appendChild(line);

    beads.className = "wish-necklace__beads";

    for (i = 0; i < count; i += 1) {
      wish = wishes[i];
      x = PAD + i * SPACING;
      button = document.createElement("button");
      button.type = "button";
      button.className = "wish-bead";

      if (highlightKey && wishKey(wish) === highlightKey) {
        button.className += " wish-bead--new";
      }

      button.style.setProperty("--x", x + "px");
      button.style.setProperty("--y", waveY(x, width, height) + "px");
      button.style.setProperty("--s", String(BEAD_SCALES[i % BEAD_SCALES.length]));
      button.dataset.name = wish.name;
      button.dataset.message = wish.message;
      button.setAttribute(
        "aria-label",
        "Пожелание от " + wish.name + ": " + wish.message
      );

      img = document.createElement("img");
      img.className = "wish-bead__image";
      img.src = PEARL_SRC;
      img.alt = "";
      img.draggable = false;
      img.decoding = "async";
      button.appendChild(img);
      beads.appendChild(button);
    }

    strand.appendChild(svg);
    strand.appendChild(beads);

    return { element: strand, width: width };
  }

  function initWishes() {
    var section = document.getElementById("wishes");
    var form = section && section.querySelector(".wish-form");
    var nameInput = section && section.querySelector("#wish-name");
    var messageInput = section && section.querySelector("#wish-message");
    var submitBtn = section && section.querySelector(".wish-form__submit");
    var thanks = section && section.querySelector("#wish-thanks");
    var necklace = section && section.querySelector(".wish-necklace");
    var viewport = necklace && necklace.querySelector(".wish-necklace__viewport");
    var track = necklace && necklace.querySelector(".wish-necklace__track");
    var tooltip = necklace && necklace.querySelector(".wish-tooltip");
    var hint = section && section.querySelector(".wish-necklace__hint");

    if (!section || !form || !necklace || !viewport || !track || !tooltip) {
      return;
    }

    var wishes = [];
    var submitting = false;
    var highlightKey = "";
    var activeBead = null;

    function setPhase(phase) {
      section.dataset.state = phase;
    }

    function hideTooltip() {
      activeBead = null;
      tooltip.hidden = true;
      tooltip.classList.remove("is-visible");
      necklace.classList.remove("is-paused");
    }

    function showTooltip(bead) {
      var beadRect;
      var neckRect;
      var tipRect;
      var left;
      var top;

      if (!bead) {
        return;
      }

      activeBead = bead;
      tooltip.querySelector(".wish-tooltip__name").textContent =
        bead.dataset.name || "";
      tooltip.querySelector(".wish-tooltip__text").textContent =
        bead.dataset.message || "";
      tooltip.hidden = false;
      tooltip.classList.add("is-visible");
      necklace.classList.add("is-paused");

      beadRect = bead.getBoundingClientRect();
      neckRect = necklace.getBoundingClientRect();
      tipRect = tooltip.getBoundingClientRect();
      left =
        beadRect.left +
        beadRect.width / 2 -
        neckRect.left -
        tipRect.width / 2;
      top = beadRect.top - neckRect.top - tipRect.height - 10;
      left = Math.max(12, Math.min(left, neckRect.width - tipRect.width - 12));
      top = Math.max(0, top);
      tooltip.style.left = left + "px";
      tooltip.style.top = top + "px";
    }

    function renderNecklace() {
      var height = viewport.clientHeight || 120;
      var viewportWidth = viewport.clientWidth || section.clientWidth;
      var first = createStrand(wishes, height, highlightKey, viewportWidth);
      var shouldLoop =
        wishes.length > 0 &&
        first.width > viewportWidth * 0.72 &&
        !prefersReducedMotion();

      track.innerHTML = "";
      track.appendChild(first.element);
      track.style.animationDuration = "";
      track.classList.toggle("is-static", !shouldLoop);
      necklace.classList.toggle("is-empty", wishes.length === 0);

      if (shouldLoop) {
        track.appendChild(createStrand(wishes, height, highlightKey, viewportWidth).element);
        track.style.animationDuration =
          Math.max(16, Math.round(first.width / 26)) + "s";
      }

      if (hint) {
        hint.hidden = wishes.length === 0;
      }

      necklace.setAttribute(
        "aria-label",
        wishes.length
          ? "Пожелания гостей, " + wishes.length + " жемчужин"
          : "Пожелания гостей"
      );
    }

    function mergeWishes(list) {
      var seen = {};
      var next = [];

      list.forEach(function (wish) {
        var key;

        if (!isFilledWish(wish)) {
          return;
        }

        key = wishKey(wish);

        if (seen[key]) {
          return;
        }

        seen[key] = true;
        next.push(wish);
      });

      wishes = next;
      renderNecklace();
    }

    function refreshWishes() {
      return loadWishesFromGoogle().then(function (list) {
        var local = wishes.slice();
        mergeWishes(list.concat(local));
      });
    }

    necklace.addEventListener("pointerover", function (event) {
      var bead = event.target.closest(".wish-bead");

      if (!bead || !track.contains(bead)) {
        return;
      }

      showTooltip(bead);
    });

    necklace.addEventListener("pointerleave", hideTooltip);

    necklace.addEventListener("focusin", function (event) {
      var bead = event.target.closest(".wish-bead");

      if (bead) {
        showTooltip(bead);
      }
    });

    necklace.addEventListener("focusout", function (event) {
      if (!necklace.contains(event.relatedTarget)) {
        hideTooltip();
      }
    });

    window.addEventListener("resize", function () {
      renderNecklace();

      if (activeBead && necklace.contains(activeBead)) {
        showTooltip(activeBead);
      }
    });

    form.addEventListener("submit", function (event) {
      var name;
      var message;
      var wish;

      event.preventDefault();

      if (submitting || section.dataset.state !== WishesState.FORM) {
        return;
      }

      name = nameInput ? nameInput.value.trim() : "";
      message = messageInput ? messageInput.value.trim() : "";

      if (!name || !message) {
        if (!name && nameInput) {
          nameInput.focus();
        } else if (messageInput) {
          messageInput.focus();
        }
        return;
      }

      submitting = true;
      wish = normalizeWish(name, message);

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Отправляем…";
      }

      submitWishToGoogle(wish.name, wish.message)
        .catch(function (error) {
          if (!isConfigured().form) {
            return;
          }

          throw error;
        })
        .then(function () {
          highlightKey = wishKey(wish);
          mergeWishes(wishes.concat([wish]));
          setPhase(WishesState.FADING);

          return wait(prefersReducedMotion() ? 120 : 380);
        })
        .then(function () {
          setPhase(WishesState.PEARL);
          return wait(prefersReducedMotion() ? 160 : 1100);
        })
        .then(function () {
          if (thanks) {
            thanks.classList.remove("is-error");
            thanks.hidden = false;
            thanks.innerHTML =
              "Спасибо, " +
              escapeHtml(wish.name) +
              ' <span aria-hidden="true">🤍</span>';
          }

          form.setAttribute("aria-hidden", "true");
          setPhase(WishesState.SENT);

          wait(2200).then(refreshWishes);
        })
        .catch(function () {
          submitting = false;

          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Отправить";
          }

          setPhase(WishesState.FORM);

          if (thanks) {
            thanks.hidden = false;
            thanks.textContent =
              "Не удалось отправить. Проверьте соединение и попробуйте ещё раз.";
            thanks.classList.add("is-error");
          }
        });
    });

    refreshWishes();
  }

  root.WishesState = WishesState;
  root.initWishes = initWishes;
})();
