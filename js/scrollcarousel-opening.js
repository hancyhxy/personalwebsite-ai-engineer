/* Loading → stacked sine ribbon → expanded wave → landed hero field. */
(function () {
  "use strict";

  var html = document.documentElement;
  var body = document.body;
  var overlay = document.getElementById("scc-opening");
  var bar = document.getElementById("scc-opening-progress");
  var count = document.getElementById("scc-opening-count");
  var skip = document.getElementById("scc-opening-skip");
  var card = document.getElementById("scc-id-card");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var done = false;
  var shownProgress = 0;
  var targetProgress = 0;
  var progressFrame = 0;
  var oldOverflow = body.style.overflow;

  if (!html.classList.contains("scc-opening-pending") || reduced.matches || !window.SCCScene) {
    finish(true);
    return;
  }

  body.classList.add("scc-opening-active");
  body.style.overflow = "hidden";

  function drawProgress() {
    shownProgress += (targetProgress - shownProgress) * 0.12;
    var percent = Math.round(shownProgress * 100);
    bar.style.transform = "scaleX(" + shownProgress.toFixed(3) + ")";
    count.textContent = "Loading · " + percent + "%";
    if (Math.abs(targetProgress - shownProgress) > 0.002) progressFrame = requestAnimationFrame(drawProgress);
    else progressFrame = 0;
  }

  function setProgress(value) {
    targetProgress = Math.max(targetProgress, Math.min(1, value));
    if (!progressFrame) progressFrame = requestAnimationFrame(drawProgress);
  }

  function finish(immediate) {
    if (done) return;
    done = true;
    cancelAnimationFrame(progressFrame);
    window.SCCScene && window.SCCScene.finishOpening();
    html.classList.remove("scc-opening-pending");
    body.classList.remove("scc-opening-active");
    body.classList.add("scc-opening-complete");
    body.style.overflow = oldOverflow;
    card && card.classList.add("is-revealed");
    if (overlay) {
      if (immediate) overlay.remove();
      else gsap.to(overlay, { opacity: 0, duration: 0.4, onComplete: function () { overlay.remove(); } });
    }
    window.dispatchEvent(new CustomEvent("scc-opening-complete"));
  }

  function skipIntro() {
    gsap.killTweensOf(window.SCCScene);
    finish(true);
  }

  skip.addEventListener("click", skipIntro);
  window.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !done) skipIntro();
  });
  window.addEventListener("scc-texture-progress", function (event) {
    setProgress(0.12 + event.detail * 0.78);
  });

  var minimum = new Promise(function (resolve) { setTimeout(resolve, 650); });
  var fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  var textures = Promise.race([
    window.SCCScene.texturesReady,
    new Promise(function (resolve) { setTimeout(resolve, 4500); })
  ]);

  setProgress(0.08);
  Promise.all([minimum, fonts, textures]).then(function () {
    if (done) return;
    setProgress(1);
    count.textContent = "Ready · 100%";
    bar.style.transform = "scaleX(1)";

    window.SCCScene.setOpeningProgress({ alpha: 1, wave: 0, land: 0 });
    var state = { wave: 0, land: 0 };
    var timeline = gsap.timeline({ delay: 0.28, onComplete: function () { finish(false); } });
    timeline.to(overlay, { opacity: 0, duration: 0.48, pointerEvents: "none" }, 0);
    timeline.to(state, {
      wave: 1,
      duration: 1.35,
      ease: "power2.inOut",
      onUpdate: function () { window.SCCScene.setOpeningProgress({ wave: state.wave }); }
    }, 0.18);
    timeline.to(state, {
      land: 1,
      duration: 1.8,
      ease: "power2.inOut",
      onUpdate: function () { window.SCCScene.setOpeningProgress({ land: state.land }); }
    }, 1.28);
    timeline.call(function () { card.classList.add("is-revealed"); }, null, 2.0);
  }).catch(function () { finish(true); });
})();
