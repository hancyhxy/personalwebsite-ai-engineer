/* Local-only tilt: auto-resume permitted sensors; first-time permission prompts need a click. */
(function () {
  'use strict';
  var input = window.BadgePortrait, stage = document.querySelector('.badge-stage');
  if (!input || !stage) return;
  var mobile = matchMedia('(max-width:700px) and (pointer:coarse)');
  var reduced = matchMedia('(prefers-reduced-motion: reduce)');
  var controls = document.createElement('div'); controls.className = 'badge-tilt-controls'; controls.hidden = true;
  controls.innerHTML = '<div class="badge-tilt-actions"><button type="button" class="badge-tilt-toggle" aria-pressed="false" aria-describedby="badge-tilt-status">Enable tilt interaction</button><button type="button" class="badge-tilt-recenter" hidden>Recenter</button></div><p id="badge-tilt-status" role="status" aria-live="polite">Hold your phone comfortably, then tap to enable.</p>';
  stage.append(controls);
  var button = controls.querySelector('.badge-tilt-toggle'), recenter = controls.querySelector('.badge-tilt-recenter'), status = controls.querySelector('p');
  var enabled = false, pending = false, listening = false, visible = false, focused = true;
  var autoAttempted = false, manuallyOff = false;
  try { manuallyOff = sessionStorage.getItem('badge-tilt-off') === '1'; } catch (_) {}
  function rememberOff(off) { manuallyOff = off; try { if (off) sessionStorage.setItem('badge-tilt-off', '1'); else sessionStorage.removeItem('badge-tilt-off'); } catch (_) {} }
  var baseline = null, sample = null, frame = 0, timeout = 0, generation = 0;
  function supported() { return window.isSecureContext && typeof window.DeviceOrientationEvent !== 'undefined'; }
  function state(name, text) { controls.dataset.state = name; status.textContent = text; }
  function neutral() { baseline = sample = null; if (frame) cancelAnimationFrame(frame); frame = 0; input.reset(); }
  function detach() {
    if (listening) removeEventListener('deviceorientation', orientation);
    listening = false; clearTimeout(timeout); timeout = 0; neutral();
  }
  function stop(name, text) {
    generation++; enabled = pending = false; detach();
    button.disabled = false; button.removeAttribute('aria-busy'); button.setAttribute('aria-pressed', 'false');
    button.textContent = 'Enable tilt interaction'; recenter.hidden = true;
    state(name || 'off', text || 'Hold your phone comfortably, then tap to enable.');
  }
  function angle() { return Number(screen.orientation && screen.orientation.angle || window.orientation || 0); }
  function delta(value, origin) { return ((value - origin + 540) % 360) - 180; }
  function axis(value) { return Math.sign(value) * Math.min(.75, Math.max(0, Math.abs(value) - 3) / 20); }
  function apply() {
    frame = 0;
    if (!sample || !listening) return;
    var next = sample, rotation = angle(); sample = null;
    if (!baseline || baseline.angle !== rotation) {
      baseline = { beta: next.beta, gamma: next.gamma, angle: rotation };
      input.reset(); return;
    }
    var pitch = delta(next.beta, baseline.beta), roll = delta(next.gamma, baseline.gamma), radians = rotation * Math.PI / 180;
    input.setTilt(axis(roll * Math.cos(radians) + pitch * Math.sin(radians)), axis(pitch * Math.cos(radians) - roll * Math.sin(radians)));
  }
  function orientation(event) {
    if (!listening || !Number.isFinite(event.beta) || !Number.isFinite(event.gamma)) return;
    clearTimeout(timeout); timeout = 0;
    if (controls.dataset.state !== 'active') state('active', 'Tilt gently to look around. Motion stays on this device.');
    sample = { beta: event.beta, gamma: event.gamma };
    if (!frame) frame = requestAnimationFrame(apply);
  }
  function sync() {
    var eligible = mobile.matches;
    controls.hidden = !eligible;
    if (!eligible || reduced.matches || !supported()) {
      if (enabled || pending || listening) stop();
      button.disabled = true;
      if (reduced.matches) state('reduced', 'Tilt is off while Reduce Motion is enabled.');
      else if (!supported()) state('unavailable', window.isSecureContext ? 'Tilt is unavailable on this device. You can still browse normally.' : 'Tilt needs a secure HTTPS connection. You can still browse normally.');
      return;
    }
    button.disabled = pending;
    if (!enabled) {
      if (controls.dataset.state === 'reduced') state('off', 'Tilt your phone to look around.');
      if (!pending && !autoAttempted && !manuallyOff && visible && focused && !document.hidden && input.visible()) enable(false);
      return;
    }
    if (!visible || !focused || document.hidden || !input.visible()) {
      detach(); state('paused', 'Tilt is paused while the card is away.'); return;
    }
    if (listening) return;
    baseline = null; listening = true;
    addEventListener('deviceorientation', orientation, { passive: true });
    state('waiting', 'Hold comfortably for a moment to set your neutral position.');
    timeout = setTimeout(function () { stop('unavailable', 'No orientation data received. You can retry or keep browsing.'); }, 4000);
  }
  async function enable(fromClick) {
    if (pending || !mobile.matches || reduced.matches || !supported()) return;
    autoAttempted = true;
    if (fromClick) rememberOff(false);
    var request = ++generation;
    pending = true; button.disabled = true; button.setAttribute('aria-busy', 'true');
    state('permission', fromClick ? 'Allow motion access to enable tilt.' : 'Checking whether tilt can start automatically.');
    try {
      // Already-granted permission may resolve without activation. If prompting is
      // needed, the automatic call rejects; only the explicit button may prompt.
      var permission = typeof DeviceOrientationEvent.requestPermission === 'function' ? await DeviceOrientationEvent.requestPermission() : 'granted';
      if (request !== generation) return;
      pending = false; button.removeAttribute('aria-busy'); button.disabled = false;
      if (permission !== 'granted') { stop('denied', 'Motion access was not allowed. The card remains static; browsing still works.'); return; }
      enabled = true; button.textContent = 'Turn off tilt'; button.setAttribute('aria-pressed', 'true'); recenter.hidden = false;
      sync();
    } catch (_) {
      if (request === generation) {
        if (fromClick) stop('denied', 'Motion access is unavailable. You can retry or keep browsing.');
        else stop('permission-needed', 'Your browser needs one tap: Enable tilt interaction, then allow motion access.');
      }
    }
  }
  button.addEventListener('click', function () {
    if (pending) return;
    if (enabled) { rememberOff(true); stop('off', 'Tilt is turned off. Tap to enable it again.'); return; }
    enable(true);
  });
  recenter.addEventListener('click', function () {
    if (!enabled) return;
    detach(); sync();
  });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (entries) {
    visible = entries.some(function (entry) { return entry.isIntersecting && entry.intersectionRatio >= .25; }); sync();
  }, { threshold: [0, .25] }).observe(document.getElementById('badge'));
  else { visible = input.visible(); addEventListener('scroll', function () { visible = input.visible(); sync(); }, { passive: true }); }
  function eligibilityChanged() {
    if (mobile.matches && !reduced.matches && !enabled && !pending && !manuallyOff) autoAttempted = false;
    sync();
  }
  mobile.addEventListener('change', eligibilityChanged); reduced.addEventListener('change', eligibilityChanged);
  document.addEventListener('visibilitychange', sync);
  addEventListener('blur', function () { focused = false; sync(); });
  addEventListener('focus', function () { focused = true; sync(); });
  addEventListener('orientationchange', function () { neutral(); });
  addEventListener('badge-opening-complete', sync);
  addEventListener('pagehide', detach); addEventListener('pageshow', sync);
  sync();
})();
