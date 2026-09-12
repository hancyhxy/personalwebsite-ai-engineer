/* SVG mechanics + local A4 résumé. No network AI, audio or content rewriting. */
(function () {
  'use strict';
  var launch = document.getElementById('scc-print-launch');
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var keys = '';
  [0, 1, 2].forEach(function (row) {
    for (var col = 0; col < 10; col++) {
      var x = 94 + col * 31 + row * 6;
      var y = 112 + row * 25;
      keys += '<g class="tw-key" style="--delay:' + ((col * 3 + row * 7) % 11) * -0.075 + 's"><circle cx="' + x + '" cy="' + y + '" r="10" fill="#61655d"/><circle cx="' + x + '" cy="' + (y - 3) + '" r="9" fill="#f5f1e5" stroke="#bebcac"/><path d="M' + (x - 2) + ' ' + (y - 3) + 'h4" stroke="#7a7d70" stroke-width="1.2"/></g>';
    }
  });
  var machine = '<svg viewBox="0 0 500 215" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><ellipse cx="250" cy="199" rx="215" ry="12" fill="#242b2420"/><g class="tw-carriage"><rect x="48" y="31" width="404" height="18" rx="8" fill="#363e35"/><rect x="70" y="28" width="360" height="6" rx="3" fill="#828779"/><path d="M52 26H25V14" fill="none" stroke="#8a8c7d" stroke-width="5" stroke-linecap="round"/><circle cx="40" cy="40" r="14" fill="#555f4f"/><circle cx="460" cy="40" r="14" fill="#555f4f"/></g><path d="M85 55Q90 44 108 44H392Q410 44 415 55L467 172Q473 191 451 193H49Q27 191 33 172Z" fill="#a6b19a" stroke="#7e8a73" stroke-width="2"/><path d="M100 61H400L416 88H84Z" fill="#6e7d63"/><rect x="185" y="62" width="130" height="15" rx="3" fill="#e3e6d6"/><text x="250" y="72.5" text-anchor="middle" font-family="monospace" font-size="8" letter-spacing="3" fill="#55614b">XINYI / 01</text><path d="M89 96H411L445 175H55Z" fill="#818f75"/>' + keys + '<rect class="tw-space" x="147" y="178" width="210" height="8" rx="4" fill="#e7e5d7"/><path d="M45 191H455" stroke="#64705c" stroke-width="4" stroke-linecap="round"/></svg>';
  launch.querySelector('.scc-mini-machine').innerHTML = machine;

  var dialog = document.createElement('dialog');
  dialog.className = 'scc-print-dialog';
  dialog.setAttribute('aria-labelledby', 'scc-print-title');
  dialog.innerHTML = '<header class="scc-print-header"><div><p>THE RÉSUMÉ PRESS / NO. 01</p><h2 id="scc-print-title">Ideas, on paper.</h2></div><button class="scc-print-close" type="button" aria-label="Close résumé printer">×</button></header>' +
    '<div class="scc-print-theatre"><div class="scc-paper-slot"><button class="scc-printed-paper" type="button" aria-label="Enlarge printed résumé" disabled><img src="assets/docs/resume-page-1.png" alt="A4 résumé preview, page one"/><span class="scc-paper-zoom">↗ Click to read</span></button></div><div class="scc-print-mechanism">' + machine + '</div></div>' +
    '<div class="scc-print-progress" aria-hidden="true"><span></span></div><p class="scc-print-message" role="status">Preparing the paper…</p>' +
    '<div class="scc-print-controls"><button type="button" class="scc-print-skip">Skip animation</button><button type="button" class="scc-print-read" hidden>Enlarge résumé ↗</button><button type="button" class="scc-print-replay" hidden>Print again ↻</button><a href="assets/docs/CV_XinyiHan_A4.pdf" download="Xinyi-Han-Resume-A4.pdf">Download A4 PDF ↓</a></div>' +
    '<div class="scc-print-reader" hidden><div class="scc-reader-toolbar"><span>RÉSUMÉ / A4 · 2 PAGES</span><button type="button" class="scc-reader-back">← Back to printer</button></div><img src="assets/docs/resume-page-1.png" alt="Résumé page 1: education, skills and professional experience"/><img src="assets/docs/resume-page-2.png" alt="Résumé page 2: selected projects"/><a href="assets/docs/CV_XinyiHan_A4.pdf" target="_blank" rel="noopener noreferrer">Open accessible, selectable PDF ↗</a></div>';
  document.body.appendChild(dialog);
  var paper = dialog.querySelector('.scc-printed-paper');
  var progress = dialog.querySelector('.scc-print-progress span');
  var message = dialog.querySelector('.scc-print-message');
  var skip = dialog.querySelector('.scc-print-skip');
  var read = dialog.querySelector('.scc-print-read');
  var replay = dialog.querySelector('.scc-print-replay');
  var reader = dialog.querySelector('.scc-print-reader');
  var frame = 0;
  var generation = 0;
  var overflow = '';
  var ready = false;
  function setProgress(p) {
    // Discrete line feeds, with a short carriage return at each line ending.
    var line = Math.min(48, Math.floor(p * 49));
    var within = (p * 49) % 1;
    dialog.style.setProperty('--feed', String(p === 1 ? 1 : line / 49));
    dialog.style.setProperty('--carriage', ((within < .82 ? within / .82 : (1 - within) / .18) * -12).toFixed(2) + 'px');
    progress.style.width = (p * 100) + '%';
  }
  function stop() { generation++; cancelAnimationFrame(frame); }
  function finish() {
    stop();
    setProgress(1);
    dialog.classList.remove('is-printing');
    dialog.classList.add('is-printed');
    paper.disabled = false;
    ready = true;
    skip.hidden = true;
    read.hidden = false;
    replay.hidden = false;
    message.textContent = 'Fresh off the press. Click the paper to read · 2 pages, A4.';
  }
  function start() {
    stop();
    ready = false;
    reader.hidden = true;
    dialog.classList.remove('is-reading', 'is-printed');
    dialog.classList.add('is-printing');
    paper.disabled = true;
    skip.hidden = false;
    read.hidden = true;
    replay.hidden = true;
    setProgress(0);
    message.textContent = 'Typing your copy — one line at a time…';
    if (motion.matches) { finish(); return; }
    var began = performance.now();
    var run = generation;
    function tick(now) {
      if (run !== generation || !dialog.open) return;
      var p = Math.max(0, Math.min(1, (now - began - 550) / 10500));
      setProgress(p);
      if (p === 1) finish();
      else frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
  }
  function showReader() {
    if (!ready) return;
    reader.hidden = false;
    dialog.classList.add('is-reading');
    dialog.querySelector('.scc-reader-back').focus();
  }
  launch.addEventListener('click', function () {
    overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    start();
  });
  paper.addEventListener('click', showReader);
  read.addEventListener('click', showReader);
  skip.addEventListener('click', finish);
  replay.addEventListener('click', start);
  dialog.querySelector('.scc-reader-back').addEventListener('click', function () {
    dialog.classList.remove('is-reading');
    reader.hidden = true;
    paper.focus();
  });
  dialog.querySelector('.scc-print-close').addEventListener('click', function () { dialog.close(); });
  dialog.addEventListener('cancel', function (event) {
    if (!reader.hidden) {
      event.preventDefault();
      dialog.querySelector('.scc-reader-back').click();
    }
  });
  dialog.addEventListener('close', function () {
    stop();
    document.body.style.overflow = overflow;
    launch.focus();
  });
  motion.addEventListener('change', function () { if (motion.matches && dialog.open) finish(); });
})();
