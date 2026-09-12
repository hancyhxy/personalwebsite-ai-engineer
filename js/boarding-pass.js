/* Original résumé rendered onto one A4 sheet, with a smooth front cut and curved SVG back.
   The opaque machine never moves; the un-torn top-right edge stays at the slot. */
(function () {
  'use strict';
  var stage = document.getElementById('printer-stage');
  var printer = document.getElementById('printer-button');
  var paper = document.getElementById('paper');
  var front = document.getElementById('ticket-front');
  var layer = document.getElementById('curl-layer');
  var back = document.getElementById('curl-back');
  var creaseShadow = document.getElementById('curl-crease-shadow');
  var highlight = document.getElementById('curl-highlight');
  var gradient = document.getElementById('paper-back');
  var remnant = document.getElementById('remnant-path');
  var remnantSvg = document.getElementById('tear-remnant');
  var handle = document.getElementById('corner-handle');
  var status = document.getElementById('printer-status');
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var state = 'idle';
  var w = 0;
  var h = 630;
  var peel = 0;
  var pointer = null;
  var frame = 0;
  var renderFrame = 0;
  var epoch = 0;
  var beganX = 0;
  var beganY = 0;
  var pendingPeel = 0;
  var keyboardClick = false;
  var copyDownloaded = false;
  var embedded = document.body.classList.contains('resume-embedded');
  var autoPrintPending = !embedded;
  var saveAfterPrint = false;

  function setState(next) {
    state = next;
    stage.dataset.state = next;
    printer.disabled = next !== 'idle';
    var primary = document.getElementById('print-copy');
    primary.disabled = next !== 'idle' && next !== 'ready';
    primary.textContent = next === 'ready' ? 'Save my résumé ↓'
      : next === 'idle' ? 'Print another copy ↘'
      : next === 'printing' ? 'Printing your copy…'
      : next === 'tearing' || next === 'falling' ? 'Saving your résumé…'
      : 'Release to save or return';
    front.disabled = next !== 'ready';
    handle.disabled = next !== 'ready' && next !== 'dragging';
    if (embedded) window.dispatchEvent(new CustomEvent('resume-save-state', {detail: {state: next, queued: saveAfterPrint}}));
  }
  function measure() {
    w = document.getElementById('paper-viewport').clientWidth;
    h = w * 297 / 210;
    stage.style.setProperty('--ticket-height', h + 'px');
    layer.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    remnantSvg.setAttribute('viewBox', '0 0 ' + w + ' 11');
  }
  function number(n) { return Number(n.toFixed(2)); }
  function jitter(i) { return ((i * 17 + 13) % 11) / 11; }

  // A4 sheet: no boarding-pass notches or barcode, just a subtle cut edge.
  function outline(a, b, cx, cy) {
    var d = 'M' + number(a) + ' 0H' + w + 'V' + (h - 2);
    for (var x = w; x > 0; x -= 4) {
      d += 'L' + number(Math.max(0, x - 2)) + ' ' + h + 'L' + number(Math.max(0, x - 4)) + ' ' + (h - 2);
    }
    d += 'V' + number(b);
    if (a > 0) d += 'Q' + number(cx) + ' ' + number(cy) + ' ' + number(a) + ' 0';
    return d + 'Z';
  }
  function tornRemnant(a) {
    if (a < 1) { remnant.setAttribute('d', ''); return; }
    var d = 'M0 0H' + number(a) + 'V4';
    // Absolute x positions keep existing teeth stable as the front advances.
    for (var x = Math.floor(a / 4) * 4; x >= 0; x -= 4) {
      d += 'L' + x + ' ' + number(3.5 + jitter(x / 4) * 3.5);
      if (x > 1) d += 'L' + (x - 1.4) + ' ' + number(2 + jitter(x / 4 + 2) * 1.3);
    }
    remnant.setAttribute('d', d + 'Z');
  }
  function draw(p) {
    peel = Math.max(0, Math.min(1, p));
    var a = w * peel;
    var b = Math.min(h * .51, a * .82);
    // A slightly bowed diagonal, NOT a jagged crease.
    var cx = a * .43;
    var cy = b * .39;
    front.style.clipPath = 'path("' + outline(a, b, cx, cy) + '")';
    tornRemnant(a);
    if (a < .5) {
      back.setAttribute('d', '');
      creaseShadow.setAttribute('d', '');
      highlight.setAttribute('d', '');
      return;
    }
    // Reflect the freed corner across the fold, then soften its silhouette.
    var denominator = a * a + b * b;
    var tipX = 2 * a * b * b / denominator;
    var tipY = 2 * a * a * b / denominator;
    var crease = 'M0 ' + number(b) + 'Q' + number(cx) + ' ' + number(cy) + ' ' + number(a) + ' 0';
    var d = crease;
    var length = Math.hypot(tipX - a, tipY);
    var steps = Math.max(2, Math.floor(length / 4));
    // Only the free, torn top edge gets teeth; the fold remains a clean curve.
    for (var i = 1; i <= steps; i++) {
      var t = i / steps;
      var jag = i === steps ? 0 : (i % 2 ? 1.6 : -.55) * Math.min(1, a / 28) * (.6 + jitter(i));
      var x = a + (tipX - a) * t + tipY / length * jag;
      var y = tipY * t - (tipX - a) / length * jag;
      d += 'L' + number(x) + ' ' + number(y);
    }
    // The un-torn left paper edge curls inward instead of forming a hard triangle.
    d += 'Q' + number(tipX * .28) + ' ' + number(tipY * .97 + b * .13) + ' 0 ' + number(b) + 'Z';
    back.setAttribute('d', d);
    creaseShadow.setAttribute('d', crease);
    highlight.setAttribute('d', 'M1 ' + number(b - 1) + 'Q' + number(cx) + ' ' + number(cy + 1) + ' ' + number(a - 1) + ' 1');
    gradient.setAttribute('x1', number(a * .44));
    gradient.setAttribute('y1', number(b * .4));
    gradient.setAttribute('x2', number(tipX));
    gradient.setAttribute('y2', number(tipY));
  }

  function cancelAnimation() {
    epoch++;
    cancelAnimationFrame(frame);
    cancelAnimationFrame(renderFrame);
    renderFrame = 0;
  }
  function animate(duration, update, done) {
    cancelAnimation();
    var id = epoch;
    var start = performance.now();
    function tick(now) {
      if (id !== epoch) return;
      var t = Math.min(1, (now - start) / duration);
      update(t);
      if (t < 1) frame = requestAnimationFrame(tick);
      else if (done) done();
    }
    frame = requestAnimationFrame(tick);
  }
  function releaseCapture() {
    var id = pointer;
    pointer = null;
    if (id !== null && handle.hasPointerCapture(id)) handle.releasePointerCapture(id);
  }
  function idle() {
    autoPrintPending = false;
    cancelAnimation();
    releaseCapture();
    paper.hidden = true;
    paper.style.opacity = '';
    remnantSvg.style.opacity = '';
    paper.style.transform = 'translate3d(0,-100%,0)';
    draw(0);
    setState('idle');
    status.textContent = copyDownloaded
      ? 'PDF download started · Print another copy, or use Download PDF.'
      : 'Ready for another copy. Click to print.';
  }
  // Quick 2.4s feed, gently rounded at the two endpoints.
  function feed(t) {
    var ramp = .09;
    if (t < ramp) return t * t / (2 * ramp * (1 - ramp));
    if (t > 1 - ramp) return 1 - (1 - t) * (1 - t) / (2 * ramp * (1 - ramp));
    return (t - ramp / 2) / (1 - ramp);
  }
  function printed() {
    paper.style.transform = 'translate3d(0,0,0)';
    setState('ready');
    status.textContent = 'Ready. Click “Save my résumé” to download — dragging is optional.';
    if (embedded && saveAfterPrint) { saveAfterPrint = false; detach(); }
  }
  function print() {
    if (state !== 'idle') return;
    autoPrintPending = false;
    copyDownloaded = false;
    stage.classList.remove('has-interacted');
    paper.hidden = false;
    measure();
    draw(0);
    setState('printing');
    status.textContent = 'Printing your résumé · A4 / 210 × 297 mm…';
    if (motion.matches) { printed(); return; }
    animate(2400, function (t) {
      paper.style.transform = 'translate3d(0,' + number((feed(t) - 1) * h) + 'px,0)';
    }, printed);
  }
  function springBack() {
    var start = peel;
    setState('returning');
    function done() { draw(0); setState('ready'); status.textContent = 'Still attached. Pull farther to tear off.'; }
    if (motion.matches || start < .002) { done(); return; }
    animate(380, function (t) { draw(start * Math.pow(1 - t, 3)); }, done);
  }
  function downloadCopy() {
    if (copyDownloaded) return;
    copyDownloaded = true;
    // The embedded version calls this after tear + fall. The browser controls
    // whether this opens a save dialog or downloads to its configured folder.
    var link = document.createElement('a');
    link.href = 'assets/docs/CV_XinyiHan_A4.pdf';
    link.download = 'Xinyi-Han-Resume-A4.pdf';
    link.hidden = true;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
  function detach() {
    if (state !== 'ready' && state !== 'dragging') return;
    stage.classList.add('has-interacted');
    if (!embedded) downloadCopy();
    setState('tearing');
    status.textContent = embedded ? 'Tearing off your copy…' : 'Tearing off your copy · PDF download started.';
    var start = peel;
    function fall() {
      setState('falling');
      status.textContent = embedded ? 'Saving your copy…' : 'PDF download started. Check your browser downloads.';
      if (motion.matches) { finishSave(); return; }
      animate(embedded ? 440 : 620, function (t) {
        paper.style.transform = 'translate3d(0,' + number((h + 140) * t * t) + 'px,0)';
        paper.style.opacity = String(1 - Math.pow(t, 1.5));
        // The discarded stub leaves with the ticket, clearing the slot for next use.
        remnantSvg.style.opacity = String(1 - t);
      }, function () { remnantSvg.style.opacity = ''; finishSave(); });
    }
    if (motion.matches) { draw(1); fall(); return; }
    animate(embedded ? (start < .5 ? 360 : 160) : (start < .5 ? 650 : 150), function (t) { draw(start + (1 - start) * (1 - Math.pow(1 - t, 2))); }, fall);
  }
  function finishSave() {
    if (embedded) downloadCopy();
    saveAfterPrint = false;
    idle();
  }
  if (embedded) {
    window.resumePressPrimary = function () {
      if (state === 'idle') { print(); return true; }
      if (state === 'ready') { detach(); return true; }
      return state === 'printing' || state === 'tearing' || state === 'falling' || state === 'returning' || state === 'dragging';
    };
    // Retained for older callers and direct save actions.
    window.resumePressSave = function () {
      if (state === 'tearing' || state === 'falling' || saveAfterPrint) return true;
      if (state === 'dragging') { releaseCapture(); detach(); return true; }
      if (state === 'ready') { detach(); return true; }
      if (state === 'returning') { cancelAnimation(); draw(0); setState('ready'); detach(); return true; }
      if (state === 'idle' || state === 'printing') {
        saveAfterPrint = true;
        if (state === 'idle') print();
        else setState('printing');
        return true;
      }
      return false;
    };
  }
  function queueDraw(p) {
    pendingPeel = p;
    if (renderFrame) return;
    renderFrame = requestAnimationFrame(function () { renderFrame = 0; draw(pendingPeel); });
  }
  function dragProgress(event) {
    var dx = Math.max(0, event.clientX - beganX);
    var dy = Math.max(0, event.clientY - beganY);
    var distance = Math.max(dx, dy * 1.18, Math.hypot(dx, dy) * .87);
    return Math.max(0, Math.min(1, (distance - 5) / (embedded ? Math.min(72, Math.max(48, w * .13)) : w * .94)));
  }
  handle.addEventListener('pointerdown', function (event) {
    if (state !== 'ready' || pointer !== null || !event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
    stage.classList.add('has-interacted');
    pointer = event.pointerId;
    beganX = event.clientX;
    beganY = event.clientY;
    keyboardClick = false;
    handle.setPointerCapture(pointer);
    setState('dragging');
    status.textContent = 'Keep pulling — release near the end to save your PDF.';
  });
  handle.addEventListener('pointermove', function (event) {
    if (event.pointerId !== pointer || state !== 'dragging') return;
    queueDraw(dragProgress(event));
  });
  handle.addEventListener('pointerup', function (event) {
    if (event.pointerId !== pointer || state !== 'dragging') return;
    cancelAnimationFrame(renderFrame);
    renderFrame = 0;
    draw(dragProgress(event));
    releaseCapture();
    if (peel >= (embedded ? .5 : .9)) detach();
    else springBack();
  });
  function abort(event) {
    if (event.pointerId !== pointer || state !== 'dragging') return;
    cancelAnimationFrame(renderFrame);
    renderFrame = 0;
    releaseCapture();
    springBack();
  }
  handle.addEventListener('pointercancel', abort);
  handle.addEventListener('lostpointercapture', abort);
  handle.addEventListener('keydown', function (event) {
    if ((event.key === 'Enter' || event.key === ' ') && state === 'ready') {
      event.preventDefault();
      keyboardClick = true;
      detach();
    }
  });
  handle.addEventListener('click', function (event) {
    // A physical tap never tears. detail=0 supports assistive-tech activation.
    if (event.detail === 0 && !keyboardClick && state === 'ready' && event.pointerType !== 'touch') detach();
    keyboardClick = false;
  });
  printer.addEventListener('click', print);
  document.getElementById('print-copy').addEventListener('click', function () {
    if (state === 'ready') detach();
    else if (state === 'idle') print();
  });
  document.getElementById('reset-button').addEventListener('click', idle);
  var reader = document.getElementById('resume-reader');
  var readerTrigger = null;
  var savedOverflow = '';
  function openReader(event) {
    stage.classList.add('has-interacted');
    readerTrigger = event.currentTarget;
    savedOverflow = document.body.style.overflow;
    reader.showModal();
    document.body.style.overflow = 'hidden';
    reader.querySelector('.reader-pages').scrollTop = 0;
  }
  document.getElementById('read-resume').addEventListener('click', openReader);
  front.addEventListener('click', function (event) { if (state === 'ready') openReader(event); });
  document.getElementById('reader-close').addEventListener('click', function () { reader.close(); });
  reader.addEventListener('close', function () {
    document.body.style.overflow = savedOverflow;
    if (readerTrigger && !readerTrigger.disabled) readerTrigger.focus();
  });
  window.addEventListener('resize', function () {
    if (state === 'dragging') { releaseCapture(); cancelAnimation(); setState('ready'); peel = 0; }
    measure();
    draw(peel);
  });
  motion.addEventListener('change', function () {
    if (!motion.matches) return;
    if (state === 'printing') { cancelAnimation(); printed(); }
    else if (state === 'returning') { cancelAnimation(); draw(0); setState('ready'); }
    else if (state === 'tearing' || state === 'falling') { if (embedded) finishSave(); else idle(); }
  });
  measure();
  draw(0);
  setState('idle');
  // Wait for the actual résumé image so the first automatic print is not blank.
  var preview = front.querySelector('img');
  preview.decode().then(function () {
    if (autoPrintPending && state === 'idle') print();
  }).catch(function () {
    autoPrintPending = false;
    status.textContent = 'Preview could not load. You can still read or download the PDF.';
  });
})();
