/* Opt-in, local-only device orientation. No motion permission request until a click. */
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
      if (controls.dataset.state === 'reduced' || controls.dataset.state === 'unavailable' && supported()) state('off', 'Hold your phone comfortably, then tap to enable.');
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
  button.addEventListener('click', async function () {
    if (pending) return;
    if (enabled) { stop(); return; }
    if (!mobile.matches || reduced.matches || !supported()) { sync(); return; }
    var request = ++generation;
    pending = true; button.disabled = true; button.setAttribute('aria-busy', 'true');
    state('permission', 'Allow motion access to enable tilt.');
    try {
      // Safari requires this direct invocation inside the trusted click handler.
      var permission = typeof DeviceOrientationEvent.requestPermission === 'function' ? await DeviceOrientationEvent.requestPermission() : 'granted';
      if (request !== generation) return;
      pending = false; button.removeAttribute('aria-busy'); button.disabled = false;
      if (permission !== 'granted') { stop('denied', 'Motion access was not allowed. The card remains static; browsing still works.'); return; }
      enabled = true; button.textContent = 'Turn off tilt'; button.setAttribute('aria-pressed', 'true'); recenter.hidden = false;
      sync();
    } catch (_) {
      if (request === generation) stop('denied', 'Motion access is unavailable. You can retry or keep browsing.');
    }
  });
  recenter.addEventListener('click', function () {
    if (!enabled) return;
    detach(); sync();
  });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (entries) {
    visible = entries.some(function (entry) { return entry.isIntersecting && entry.intersectionRatio >= .25; }); sync();
  }, { threshold: [0, .25] }).observe(document.getElementById('badge'));
  else { visible = input.visible(); addEventListener('scroll', function () { visible = input.visible(); sync(); }, { passive: true }); }
  mobile.addEventListener('change', sync); reduced.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  addEventListener('blur', function () { focused = false; sync(); });
  addEventListener('focus', function () { focused = true; sync(); });
  addEventListener('orientationchange', function () { neutral(); });
  addEventListener('badge-opening-complete', sync);
  addEventListener('pagehide', detach); addEventListener('pageshow', sync);
  sync();
})();
