/* Local résumé presentation only: no AI calls, no external data submission. */
(function () {
  'use strict';
  var grid = document.getElementById('scc-grid');
  var views = document.querySelectorAll('[data-view]');
  grid.querySelectorAll('.scc-card').forEach(function (card, i) {
    card.dataset.number = String(i + 1).padStart(2, '0');
  });
  views.forEach(function (button) {
    button.addEventListener('click', function () {
      grid.classList.toggle('is-index', button.dataset.view === 'index');
      views.forEach(function (b) { b.setAttribute('aria-pressed', String(b === button)); });
    });
  });

  var dialog = document.getElementById('scc-contact-dialog');
  var output = document.getElementById('scc-terminal-output');
  var command = document.getElementById('scc-terminal-command');
  var modes = dialog.querySelectorAll('button[data-mode]');
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var skip = document.createElement('button');
  skip.type = 'button';
  skip.className = 'scc-skip';
  skip.textContent = 'Skip animation ↓';
  dialog.querySelector('.scc-terminal-modes').appendChild(skip);
  var source = null;
  var loading = null;
  var generation = 0;
  var timer = 0;
  var oldOverflow = '';

  function clean(text) {
    return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1').replace(/\*\*/g, '').replace(/\*/g, '');
  }
  function parse(markdown) {
    return markdown.split(/\r?\n/).filter(function (line) {
      return line.trim() && !/^---+$/.test(line.trim());
    }).map(function (line) {
      var heading = line.match(/^(#{1,3})\s+(.*)/);
      return { tag: heading ? 'h' + heading[1].length : 'p',
        bullet: /^- /.test(line), text: clean(heading ? heading[2] : line.replace(/^- /, '')) };
    });
  }
  function cancel() {
    generation++;
    window.clearTimeout(timer);
  }
  function render(instant) {
    cancel();
    var run = generation;
    output.replaceChildren();
    if (!source) return;
    var mode = dialog.dataset.mode;
    var staticView = instant || motion.matches;
    command.textContent = mode === 'agent' ? 'resume-agent --local --read-only' : mode === 'compile' ? 'build xinyi.resume --theme light' : 'cat CV_XinyiHan_2026.md';
    skip.hidden = staticView;
    var blocks = parse(source);
    var i = 0;
    if (mode !== 'typewriter') {
      var log = document.createElement('p');
      log.className = 'scc-agent-log';
      log.textContent = mode === 'agent'
        ? '✓ Local résumé loaded\n✓ Experience, education & projects indexed\n→ Rendering profile · scripted preview, not a live agent'
        : '$ source: CV_XinyiHan_2026.md\n✓ content preserved → light résumé\n✓ build ready';
      output.appendChild(log);
    }
    function next() {
      if (run !== generation || !dialog.open) return;
      if (i >= blocks.length) { skip.hidden = true; return; }
      var block = blocks[i++];
      var el = document.createElement(block.tag);
      if (block.bullet) el.classList.add('scc-resume-bullet');
      output.appendChild(el);
      if (staticView) {
        el.textContent = block.text;
        next();
      } else if (mode === 'typewriter') {
        el.classList.add('is-writing');
        var chars = 0;
        // Short lines visibly type; long paragraphs finish quickly for readability.
        var step = Math.max(1, Math.ceil(block.text.length / 22));
        (function type() {
          if (run !== generation) return;
          chars += step;
          el.textContent = block.text.slice(0, chars);
          if (chars < block.text.length) timer = window.setTimeout(type, 14);
          else { el.classList.remove('is-writing'); timer = window.setTimeout(next, 45); }
        })();
      } else {
        el.textContent = block.text;
        el.classList.add('scc-resume-enter');
        timer = window.setTimeout(next, mode === 'agent' ? 100 : 65);
      }
    }
    next();
  }
  function load() {
    if (!loading) {
      loading = fetch('./assets/docs/CV_XinyiHan_2026.md').then(function (response) {
        if (!response.ok) throw new Error('Resume unavailable');
        return response.text();
      }).then(function (text) { source = text; }).catch(function (error) {
        loading = null;
        throw error;
      });
    }
    return loading;
  }
  document.getElementById('scc-contact-open').addEventListener('click', function () {
    oldOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    dialog.querySelector('.scc-terminal-screen').scrollTop = 0;
    output.textContent = 'Loading local résumé…';
    skip.hidden = true;
    load().then(function () { if (dialog.open) render(false); }).catch(function () {
      output.textContent = 'Could not load the résumé. Please use Full résumé below.';
    });
  });
  modes.forEach(function (button) {
    button.addEventListener('click', function () {
      dialog.dataset.mode = button.dataset.mode;
      modes.forEach(function (b) { b.setAttribute('aria-pressed', String(b === button)); });
      dialog.querySelector('.scc-terminal-screen').scrollTop = 0;
      render(false);
    });
  });
  skip.addEventListener('click', function () { render(true); });
  dialog.querySelector('.scc-terminal-close').addEventListener('click', function () { dialog.close(); });
  dialog.addEventListener('click', function (event) {
    var rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
  dialog.addEventListener('close', function () {
    cancel();
    document.body.style.overflow = oldOverflow;
    document.getElementById('scc-contact-open').focus();
  });
  motion.addEventListener('change', function () { if (dialog.open && source) render(motion.matches); });
})();
