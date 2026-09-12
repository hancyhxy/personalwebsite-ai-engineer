/* Identity-card portrait interaction + locked Learn about me printer handoff. */
(function () {
  "use strict";
  var card = document.getElementById("scc-id-card");
  var portrait = document.getElementById("scc-card-portrait");
  var face = document.getElementById("scc-card-face");
  var link = document.getElementById("scc-resume-link");
  var section = document.getElementById("scc-resume-section");
  var frame = document.getElementById("scc-resume-frame");
  var motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!card || !portrait || !face || !link || !section || !frame) return;

  var names = ["up-left", "up", "up-right", "left", "center", "right", "down-left", "down", "down-right"];
  var images = names.map(function (name) {
    var image = new Image();
    image.src = "assets/hero-portrait/" + name + ".webp";
    return image;
  });
  var targetX = 0;
  var targetY = 0;
  var x = 0;
  var y = 0;
  var row = 1;
  var column = 1;
  var current = 4;
  var frameId = 0;
  var printerLoaded = false;
  var printerSizeObserver = null;

  function bin(value, old) {
    if (old === 0 && value < -0.23) return 0;
    if (old === 2 && value > 0.23) return 2;
    return value < -0.34 ? 0 : value > 0.34 ? 2 : 1;
  }

  function tick() {
    frameId = 0;
    var easing = motion.matches ? 1 : 0.18;
    x += (targetX - x) * easing;
    y += (targetY - y) * easing;
    row = bin(y, row);
    column = bin(x, column);
    var next = row * 3 + column;
    if (next !== current && images[next].complete && images[next].naturalWidth) {
      current = next;
      face.src = images[next].src;
      face.alt = "Xinyi Han portrait, " + names[next];
    }
    card.style.setProperty("--card-rx", (-y * 3).toFixed(2) + "deg");
    card.style.setProperty("--card-ry", (x * 5).toFixed(2) + "deg");
    if (Math.abs(x - targetX) > 0.002 || Math.abs(y - targetY) > 0.002) frameId = requestAnimationFrame(tick);
  }

  function point(event) {
    var rect = portrait.getBoundingClientRect();
    targetX = Math.max(-1, Math.min(1, (event.clientX - rect.left - rect.width / 2) / 180));
    targetY = Math.max(-1, Math.min(1, (event.clientY - rect.top - rect.height / 2) / 170));
    if (!frameId) frameId = requestAnimationFrame(tick);
  }

  function reset() {
    targetX = 0;
    targetY = 0;
    if (!frameId) frameId = requestAnimationFrame(tick);
  }

  portrait.addEventListener("pointermove", point, { passive: true });
  portrait.addEventListener("pointerleave", reset, { passive: true });
  portrait.addEventListener("keydown", function (event) {
    var directions = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1], Home: [0, 0], Escape: [0, 0] };
    if (!directions[event.key]) return;
    event.preventDefault();
    targetX = directions[event.key][0];
    targetY = directions[event.key][1];
    if (!frameId) frameId = requestAnimationFrame(tick);
  });

  frame.addEventListener("load", function () {
    try {
      var app = frame.contentDocument && frame.contentDocument.querySelector(".resume-app");
      if (!app) return;
      if (printerSizeObserver) printerSizeObserver.disconnect();
      var fit = function () {
        var fittedHeight = Math.ceil(app.getBoundingClientRect().height + 12);
        if (fittedHeight > 0) frame.style.height = fittedHeight + "px";
      };
      fit();
      if ("ResizeObserver" in window) {
        printerSizeObserver = new ResizeObserver(fit);
        printerSizeObserver.observe(app);
      }
    } catch (error) {}
  });

  function loadPrinter() {
    if (printerLoaded) return;
    printerLoaded = true;
    frame.src = frame.dataset.src;
  }

  link.addEventListener("click", function () {
    section.scrollIntoView({ behavior: motion.matches ? "auto" : "smooth", block: "start" });
    loadPrinter();
  });

  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(function (entries) {
      if (entries.some(function (entry) { return entry.isIntersecting; })) {
        loadPrinter();
        observer.disconnect();
      }
    }, { threshold: 0.12 });
    observer.observe(section);
  } else {
    loadPrinter();
  }
})();
