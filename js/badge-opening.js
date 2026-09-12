/* Getty-inspired title → compact sine ribbon → badge scene handoff. */
(function () {
  "use strict";
  var html = document.documentElement;
  var body = document.body;
  var reduced = matchMedia("(prefers-reduced-motion: reduce)");
  if (!html.classList.contains("opening-pending") || reduced.matches || !window.BADGE_SCENE || !window.gsap) {
    html.classList.remove("opening-pending");
    window.BADGE_SCENE && window.BADGE_SCENE.finishOpening();
    return;
  }

  var opening = document.createElement("div");
  opening.className = "portfolio-opening";
  opening.innerHTML = '<p class="opening-name">Xinyi Han</p><p class="opening-role opening-role-left">AI</p><p class="opening-role opening-role-right">Engineer</p><button class="opening-skip" type="button">Skip intro ↗</button>';
  body.append(opening);
  body.classList.add("opening-active");
  var blocked = Array.from(document.querySelectorAll('.mast,main,.site-footer,#agent-fab')).map(function (el) { var original = el.inert; el.inert = true; return { el: el, inert: original }; });
  var name = opening.querySelector(".opening-name");
  var roles = opening.querySelectorAll(".opening-role");
  var skip = opening.querySelector(".opening-skip");
  var oldOverflow = body.style.overflow;
  if (window.BadgeScene && BadgeScene.scroll) BadgeScene.scroll.lock(true);
  else body.style.overflow = "hidden";
  var done = false;
  var timeline;
  /* HAND-TUNABLE TIMING (seconds). Override with window.BADGE_OPENING_TIMING
     before this script if a visual pass needs different pacing. */
  var timing = Object.assign({ stackReveal: .24, waveStart: .4, waveDuration: 1.3, settleDuration: .28, roleStart: .82, holdDuration: 1.35, gatherDuration: .55, gatherHold: .08, landDuration: 1.55 }, window.BADGE_OPENING_TIMING || {});
  var watchdog = window.BADGE_OPENING_GATE || setTimeout(function () { finish(true); }, 9000);
  function failOpen() { finish(true); }
  addEventListener('badge-opening-timeout', failOpen);
  addEventListener('badge-scene-fallback', failOpen);

  function layoutComposition() {
    var width = innerWidth, height = innerHeight;
    var budget = Math.min(width * .9, 1280), gap = Math.min(28, width * .022);
    var style = getComputedStyle(body);
    var token = function (name, fallback) { var value = parseFloat(style.getPropertyValue(name)); return Number.isFinite(value) ? value : fallback; };
    // Measure max-content words, not the remaining width of an absolutely positioned p.
    roles.forEach(function (role) { role.style.fontSize = ''; });
    var leftWidth = roles[0].getBoundingClientRect().width;
    var rightWidth = roles[1].getBoundingClientRect().width;
    var wordBudget = budget * .43;
    if (leftWidth + rightWidth > wordBudget) {
      var scale = wordBudget / (leftWidth + rightWidth);
      roles.forEach(function (role) { role.style.fontSize = parseFloat(getComputedStyle(role).fontSize) * scale + 'px'; });
      leftWidth = roles[0].getBoundingClientRect().width;
      rightWidth = roles[1].getBoundingClientRect().width;
    }
    var available = budget - leftWidth - rightWidth - gap * 2;
    var thumbWidth = Math.min(token('--opening-thumb-width', 140), width * .16, available / 3.8);
    var span = Math.min(available - thumbWidth, thumbWidth * 3.8);
    var amplitude = Math.min(height * token('--opening-wave-amplitude', .11), span * .20);
    var ribbonWidth = span + thumbWidth;
    var total = leftWidth + rightWidth + gap * 2 + ribbonWidth;
    var start = (width - total) / 2;
    roles[0].style.left = start + 'px';
    roles[1].style.left = start + leftWidth + gap * 2 + ribbonWidth + 'px';
    roles[1].style.right = 'auto';
    var offset = token('--opening-wave-offset', .04);
    roles.forEach(function (role) { role.style.top = (height * (.5 - offset)) + 'px'; });
    // Equal arc-length sampling avoids a pile-up at the crest and gaps on the slopes.
    var samples = [{ t: 0, length: 0 }], length = 0, previousY = 0;
    for (var i = 1; i <= 400; i++) {
      var t = i / 400, y = Math.sin(t * Math.PI * 2) * amplitude;
      length += Math.hypot(span / 400, y - previousY);
      samples.push({ t: t, length: length }); previousY = y;
    }
    var points = [], cursor = 1, count = window.BadgeScene.featured.length;
    for (var n = 0; n < count; n++) {
      var at = length * n / (count - 1);
      while (cursor < samples.length - 1 && samples[cursor].length < at) cursor++;
      var a = samples[cursor - 1], b = samples[cursor];
      points.push(a.t + (b.t - a.t) * (at - a.length) / (b.length - a.length));
    }
    if (window.BADGE_SCENE.setOpeningLayout) window.BADGE_SCENE.setOpeningLayout({ span: span / width, center: (leftWidth - rightWidth) / 2 / width, thumb: thumbWidth, points: points, stackSpan: token('--opening-stack-span', .09), stackAmplitude: token('--opening-stack-amplitude', .035), amplitude: amplitude / height, offset: offset });
  }
  function onResize() { if (!done) finish(true); }
  addEventListener("resize", onResize);

  function finish(immediate) {
    if (done) return;
    done = true;
    clearTimeout(watchdog);
    removeEventListener("resize", onResize);
    removeEventListener('badge-opening-timeout', failOpen);
    removeEventListener('badge-scene-fallback', failOpen);
    if (timeline) timeline.kill();
    window.BADGE_SCENE.finishOpening();
    html.classList.remove("opening-pending");
    body.classList.remove("opening-active");
    blocked.forEach(function (entry) { entry.el.inert = entry.inert; });
    body.classList.add("opening-reveal");
    body.style.overflow = oldOverflow;
    if (immediate) opening.remove();
    else gsap.to(opening, { opacity: 0, duration: .35, onComplete: function () { opening.remove(); } });
    dispatchEvent(new CustomEvent("badge-opening-complete"));
  }
  function skipIntro() { finish(true); document.getElementById("portrait")?.focus({ preventScroll: true }); }
  skip.addEventListener("click", skipIntro);
  addEventListener("keydown", function onKey(event) { if (event.key === "Escape" && !done) skipIntro(); });
  reduced.addEventListener("change", function () { if (reduced.matches) finish(true); }, { once: true });

  // Browser scroll restoration happens after parsing. Wait through pageshow and
  // two paints so a restored non-top position can cancel the intro cleanly.
  var restorationReady = new Promise(function (resolve) {
    function settle() { requestAnimationFrame(function () { requestAnimationFrame(resolve); }); }
    if (document.readyState === 'complete') settle();
    else addEventListener('pageshow', settle, { once: true });
  });
  Promise.all([restorationReady, Promise.race([Promise.all([window.BADGE_SCENE.texturesReady, document.fonts.ready]), new Promise(function (resolve) { setTimeout(resolve, 1100); })])]).then(function () {
    if (done) return;
    if (scrollY > 2) { finish(true); return; }
    layoutComposition();
    document.fonts.ready.then(function () { if (!done) layoutComposition(); });
    var target = document.querySelector(".mast > a").getBoundingClientRect();
    var state = { wave: 0, gather: 0, land: 0, size: 0, alpha: 0 };
    var waveEnd = timing.waveStart + timing.waveDuration;
    var settleEnd = waveEnd + timing.settleDuration;
    var gatherStart = settleEnd + timing.holdDuration;
    var gatherEnd = gatherStart + timing.gatherDuration;
    var landStart = gatherEnd + timing.gatherHold;
    var landEnd = landStart + timing.landDuration;
    timeline = gsap.timeline({ onComplete: function () { finish(false); } });
    timeline.to(state, { alpha: 1, duration: timing.stackReveal, ease: "power2.out", onUpdate: function () { window.BADGE_SCENE.setOpeningProgress({ alpha: state.alpha }); } }, .1);
    timeline.to(state, { wave: 1.025, duration: timing.waveDuration, ease: "power3.inOut", onUpdate: function () { window.BADGE_SCENE.setOpeningProgress({ wave: state.wave }); } }, timing.waveStart);
    timeline.to(state, { wave: 1, duration: timing.settleDuration, ease: "power2.out", onUpdate: function () { window.BADGE_SCENE.setOpeningProgress({ wave: state.wave }); } }, waveEnd);
    timeline.fromTo(roles, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .5, stagger: .05, ease: "power2.out" }, timing.roleStart);
    timeline.to(state, { gather: 1, duration: timing.gatherDuration, ease: "power3.inOut", onUpdate: function () { window.BADGE_SCENE.setOpeningProgress({ gather: state.gather }); } }, gatherStart);
    timeline.to(roles, { opacity: 0, y: -12, duration: .34, ease: "power2.in" }, gatherStart + .12);
    timeline.to(name, { left: target.left + target.width / 2, top: target.top + target.height / 2, fontSize: getComputedStyle(document.querySelector(".mast > a")).fontSize, duration: .9, ease: "power2.inOut" }, timing.waveStart);
    timeline.to(state, { land: 1, duration: timing.landDuration, ease: "power3.inOut", onUpdate: function () { window.BADGE_SCENE.setOpeningProgress({ land: state.land, size: state.land }); } }, landStart);
    timeline.to(opening, { opacity: 0, duration: .3 }, landEnd - .12);
  }).catch(function () { finish(true); });
})();
