/* Badge's only scene runtime: persistent perspective world + deterministic scroll/reading states. */
(function () {
  'use strict';
  var B = window.BadgeScene, section = document.getElementById('work-story');
  if (!B || !section) return;
  B.createFallback(section);
  var reduced = matchMedia('(prefers-reduced-motion: reduce)');
  var runtime = { opacity: 1, stopped: false, frame: 0, last: 0, failed: false };
  B.runtime = runtime;
  document.getElementById('hero-scroll').addEventListener('click', function () {
    if (runtime.failed || !B.scroll) section.scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth' });
    else B.scroll.go(B.groups[0].center);
  });
  function failOpen() {
    if (runtime.failed) return;
    runtime.failed = true; cancelAnimationFrame(runtime.frame);
    if (B.scroll) B.scroll.dispose();
    if (B.interaction) B.interaction.dispose();
    if (runtime.field) runtime.field.dispose();
    if (runtime.background) runtime.background.dispose();
    if (runtime.renderer) runtime.renderer.dispose();
    if (runtime.canvasRoot) runtime.canvasRoot.remove();
    if (runtime.overlay) runtime.overlay.remove();
    section.style.height = '';
    document.body.classList.remove('scene-ready', 'opening-active');
    document.body.classList.add('scene-fallback-mode');
    document.documentElement.classList.remove('opening-pending');
    clearTimeout(window.BADGE_OPENING_GATE);
    dispatchEvent(new CustomEvent('badge-scene-fallback'));
  }
  runtime.failOpen = failOpen;
  if (reduced.matches || !window.THREE || !window.gsap || !window.ScrollTrigger) { failOpen(); return; }
  try {
    runtime.canvasRoot = document.createElement('div'); runtime.canvasRoot.className = 'badge-scene-canvas'; runtime.canvasRoot.setAttribute('aria-hidden', 'true'); document.body.prepend(runtime.canvasRoot);
    runtime.overlay = document.createElement('div'); runtime.overlay.className = 'badge-scene-overlay'; document.body.append(runtime.overlay);
    runtime.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    runtime.renderer.setClearColor(0xfafaf8, 0); runtime.renderer.outputEncoding = THREE.sRGBEncoding;
    runtime.canvasRoot.append(runtime.renderer.domElement);
    runtime.scene = new THREE.Scene(); runtime.rig = new B.CameraRig();
    runtime.field = new B.Field(runtime.scene, runtime.rig);
    runtime.background = new B.Background(runtime.scene, runtime.rig);
    runtime.reading = new B.Reading(runtime.overlay);
    B.scroll = new B.ScrollDriver(section);
    B.interaction = runtime.interaction = new B.Interaction(runtime);
    runtime.renderer.domElement.addEventListener('webglcontextlost', function (e) { e.preventDefault(); failOpen(); });
  } catch (error) { console.warn('Badge scene fallback:', error); failOpen(); return; }
  runtime.field.texturesReady.then(function (loaded) { if (loaded.some(function (ok) { return !ok; })) failOpen(); });
  document.body.classList.add('scene-ready');
  function resize() {
    if (runtime.failed) return;
    runtime.rig.resize(); runtime.reading.resize();
    runtime.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 700 ? 1.4 : 1.75));
    runtime.renderer.setSize(innerWidth, innerHeight, false); B.scroll.resize();
  }
  function tick(now) {
    if (runtime.failed || document.hidden) return;
    // Render the source exclusion once, then keep a still backdrop under the DOM flip.
    // Avoid competing WebGL uploads/compositing during a short full-viewport transition.
    var flipPhase = window.ProjectFlip && ProjectFlip.phase;
    var flipHeld = flipPhase === 'opening' || flipPhase === 'closing' || flipPhase === 'navigating';
    if (flipHeld && runtime.flipHeld) { runtime.last = now; runtime.frame = requestAnimationFrame(tick); return; }
    runtime.flipHeld = flipHeld;
    var dt = Math.min(.05, Math.max(.001, (now - (runtime.last || now - 16)) / 1000)); runtime.last = now;
    var travel = B.scroll.tick(now), state = B.sample(travel), opening = runtime.field.opening;
    var work = opening.active ? 0 : B.scroll.work;
    runtime.state = state;
    runtime.opacity = 1 - state.exit;
    if (work === 0) runtime.opacity = 1;
    runtime.overlay.style.opacity = runtime.opacity;
    runtime.canvasRoot.style.opacity = runtime.opacity;
    runtime.overlay.style.visibility = runtime.opacity < .001 ? 'hidden' : '';
    if (runtime.opacity < .001 && !opening.active) {
      B.interaction.update(runtime.field.items, false);
      runtime.frame = requestAnimationFrame(tick); return;
    }
    var following = !opening.active && matchMedia('(pointer:fine)').matches ? B.mix(.08, .20, work) : 0;
    runtime.rig.update(dt, work, following);
    runtime.reading.update(state, runtime.field.items, opening.active ? 0 : work * (1 - state.exit));
    runtime.field.update(state, work, runtime.reading.target, dt, runtime.reading.safeTarget);
    runtime.background.update(state, opening.active ? 0 : work, runtime.reading.safeTarget);
    runtime.scene.updateMatrixWorld(true);
    B.interaction.update(runtime.field.items, !opening.active && runtime.opacity > .05);
    if (B.interaction.flight && B.interaction.selected >= 0) runtime.field.items[B.interaction.selected].mesh.visible = false;
    if (runtime.opacity > .001) runtime.renderer.render(runtime.scene, runtime.rig.camera);
    runtime.frame = requestAnimationFrame(tick);
  }
  window.BADGE_SCENE = {
    texturesReady: runtime.field.texturesReady,
    setOpeningProgress: function (values) { Object.assign(runtime.field.opening, values); },
    setOpeningLayout: function (layout) { Object.assign(runtime.field.openingLayout, layout); },
    finishOpening: function () { Object.assign(runtime.field.opening, { active: false, wave: 1, gather: 1, land: 1, size: 1, alpha: 1 }); B.scroll.lock(false); },
    openProject: function (index) { B.interaction.open(index); }
  };
  addEventListener('resize', resize, { passive: true });
  document.fonts.ready.then(resize);
  reduced.addEventListener('change', function () { if (reduced.matches) failOpen(); });
  document.addEventListener('visibilitychange', function () { cancelAnimationFrame(runtime.frame); runtime.last = 0; if (!document.hidden && !runtime.failed) runtime.frame = requestAnimationFrame(tick); });
  addEventListener('pageshow', function (e) {
    if (e.persisted && !runtime.failed) {
      B.interaction.entering = false; B.interaction.flight = false; B.scroll.lock(false);
      document.querySelectorAll('.scene-detail-flight').forEach(function (el) { el.remove(); });
      resize();
    }
  });
  resize(); runtime.frame = requestAnimationFrame(tick);
  if (location.hash.indexOf('#work-') === 0) {
    var group = B.groups.find(function (g) { return '#work-' + g.id === location.hash || g.legacyHash === location.hash; });
    if (group && !window.BADGE_RETURN_STATE) document.fonts.ready.then(function () { B.scroll.go(group.center, true); });
  }
})();
