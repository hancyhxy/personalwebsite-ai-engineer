/* DOM interface for the Three.js project field: keyword typewriter,
   accessible project index, reveal behavior and scroll controls. */
(function () {
  "use strict";

  var TYPE_MS = 66;
  var DELETE_MS = 36;
  var HOLD_FULL_MS = 1900;
  var HOLD_EMPTY_MS = 320;
  var INITIAL_HOLD_MS = 2700;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (typeof SCROLLCAROUSEL_PROJECTS === "undefined" || !Array.isArray(SCROLLCAROUSEL_PROJECTS)) {
    console.error("[scrollcarousel] Project data is missing.");
    return;
  }

  var categoryLabels = typeof SCROLLCAROUSEL_CATEGORY_LABELS !== "undefined"
    ? SCROLLCAROUSEL_CATEGORY_LABELS
    : {};

  /* ---------------- Keyword typewriter ---------------- */
  var keywords = Array.prototype.slice.call(document.querySelectorAll(".scc-kw"));
  var activeIndex = 0;
  var timer = 0;

  function highlight() {
    /* The compact identity line is independent from the WebGL artwork field. */
  }

  if (keywords.length) {
    var slot = document.querySelector(".scc-kw-slot");
    var writer = document.createElement("span");
    var typed = document.createElement("span");
    var caret = document.createElement("span");
    writer.className = "scc-typewriter";
    caret.className = "scc-caret";
    writer.appendChild(typed);
    writer.appendChild(caret);
    slot.appendChild(writer);
    slot.classList.add("has-typewriter");

    function showFullKeyword() {
      typed.textContent = keywords[activeIndex].textContent;
      caret.classList.remove("is-typing");
      highlight(keywords[activeIndex].dataset.kw);
    }

    function typePhase() {
      activeIndex = (activeIndex + 1) % keywords.length;
      var label = keywords[activeIndex].textContent;
      highlight(keywords[activeIndex].dataset.kw);
      caret.classList.add("is-typing");
      var index = 0;
      (function step() {
        if (index < label.length) {
          typed.textContent = label.slice(0, ++index);
          timer = window.setTimeout(step, TYPE_MS);
        } else {
          caret.classList.remove("is-typing");
          timer = window.setTimeout(deletePhase, HOLD_FULL_MS);
        }
      })();
    }

    function deletePhase() {
      caret.classList.add("is-typing");
      (function step() {
        if (typed.textContent.length) {
          typed.textContent = typed.textContent.slice(0, -1);
          timer = window.setTimeout(step, DELETE_MS);
        } else {
          caret.classList.remove("is-typing");
          timer = window.setTimeout(typePhase, HOLD_EMPTY_MS);
        }
      })();
    }

    function resetCycle() {
      window.clearTimeout(timer);
      showFullKeyword();
      if (!reduceMotion.matches && keywords.length > 1) {
        timer = window.setTimeout(deletePhase, INITIAL_HOLD_MS);
      }
    }

    resetCycle();
    reduceMotion.addEventListener("change", resetCycle);
  }

  /* ---------------- Accessible project index ---------------- */
  var grid = document.getElementById("scc-grid");
  var cards = [];

  if (grid) {
    SCROLLCAROUSEL_PROJECTS.forEach(function (project, index) {
      var card = document.createElement("article");
      card.className = "scc-card";
      card.dataset.number = String(index + 1).padStart(2, "0");
      card.style.setProperty("--reveal-delay", (index % 3) * 90 + "ms");
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", "Preview " + project.title);

      var image = document.createElement("img");
      image.src = project.thumb;
      image.alt = project.title;
      image.loading = "lazy";
      image.addEventListener("error", function () { card.classList.add("scc-card--noimg"); });

      var title = document.createElement("h3");
      title.className = "scc-card-title";
      title.textContent = project.title;

      var meta = document.createElement("p");
      meta.className = "scc-card-meta";
      meta.textContent = project.year + " · " + (categoryLabels[project.category] || project.category);

      function open() {
        if (window.SCCScene) window.SCCScene.openProject(index);
        else window.location.href = "./project-scrollcarousel.html?project=" + index;
      }
      card.addEventListener("click", open);
      card.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open();
        }
      });

      card.appendChild(image);
      card.appendChild(title);
      card.appendChild(meta);
      grid.appendChild(card);
      cards.push(card);
    });
  }

  var staticToggle = document.getElementById("scc-static-toggle");
  var staticContent = document.getElementById("scc-static-content");
  if (staticToggle && staticContent) {
    staticToggle.addEventListener("click", function () {
      var opening = staticToggle.getAttribute("aria-expanded") !== "true";
      staticToggle.setAttribute("aria-expanded", String(opening));
      staticToggle.lastElementChild.textContent = opening ? "−" : "＋";
      staticContent.hidden = !opening;
      if (opening) cards.forEach(function (card) { card.classList.add("is-inview"); });
    });
  }

  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-inview");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    cards.forEach(function (card) { observer.observe(card); });
  } else {
    cards.forEach(function (card) { card.classList.add("is-inview"); });
  }

  /* ---------------- Scroll-down control ---------------- */
  var scrollButton = document.getElementById("scc-scroll-btn");
  var journey = document.getElementById("scc-journey");
  if (scrollButton && journey) {
    scrollButton.addEventListener("click", function () {
      var destination = journey.offsetTop + window.innerHeight * 0.35;
      if (window.sccLenis && !reduceMotion.matches) {
        window.sccLenis.scrollTo(destination, { duration: 1.2 });
      } else {
        window.scrollTo({ top: destination, behavior: reduceMotion.matches ? "auto" : "smooth" });
      }
    });
  }
})();
