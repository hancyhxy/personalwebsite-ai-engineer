/* The full project index lives in a native modal, not between the story and résumé. */
(function () {
  'use strict';
  var B = window.BadgeScene, reduced = matchMedia('(prefers-reduced-motion: reduce)');
  var button = document.createElement('button');
  button.id = 'portfolio-menu-toggle'; button.className = 'portfolio-menu-toggle'; button.type = 'button';
  button.setAttribute('aria-label', 'Open portfolio menu'); button.setAttribute('aria-controls', 'portfolio-menu'); button.setAttribute('aria-expanded', 'false');
  button.hidden = true; button.innerHTML = '<span></span><span></span>';
  var dialog = document.createElement('dialog'); dialog.id = 'portfolio-menu'; dialog.className = 'portfolio-menu';
  dialog.setAttribute('aria-labelledby', 'portfolio-menu-title');
  dialog.innerHTML = '<header class="portfolio-menu-header"><h2 id="portfolio-menu-title">Explore</h2><button class="portfolio-menu-close" type="button" aria-label="Close portfolio menu">×</button></header><div class="portfolio-menu-scroll" data-lenis-prevent><nav class="portfolio-menu-links" aria-label="Portfolio"><p class="micro">SELECTED WORK</p><div class="portfolio-menu-chapters"></div><button class="portfolio-menu-all" type="button">All Projects <span>16 projects ↗</span></button><a href="#resume-section" data-menu-section="resume">Résumé</a><a href="#contact" data-menu-section="contact">Contact</a></nav><div class="portfolio-menu-directory" hidden><button class="portfolio-menu-back" type="button">← Menu</button></div></div>';
  var scroller = dialog.querySelector('.portfolio-menu-scroll'), links = dialog.querySelector('.portfolio-menu-links');
  var directory = dialog.querySelector('.portfolio-menu-directory'), title = dialog.querySelector('h2');
  var index = document.getElementById('work-next'); directory.append(index);
  var view = 'navigation', oldOverflow = '', returnFocus = null, visible = false;
  B.groups.forEach(function (g) {
    var a = document.createElement('a'); a.href = '#work-' + g.id; a.textContent = g.title;
    a.addEventListener('click', function (event) {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault(); close();
      requestAnimationFrame(function () {
        if (B.scroll && !B.runtime.failed) B.scroll.go(g.center);
        else document.getElementById('fallback-' + g.id).scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth' });
        history.replaceState(history.state, '', a.hash);
      });
    });
    dialog.querySelector('.portfolio-menu-chapters').append(a);
  });
  document.body.append(button, dialog); document.body.classList.add('has-portfolio-menu');
  function lock() {
    if (B.scroll && !B.runtime.failed) B.scroll.lock(true);
    else document.body.style.overflow = 'hidden';
  }
  function setView(next) {
    view = next === 'projects' ? 'projects' : 'navigation';
    links.hidden = view === 'projects'; directory.hidden = view !== 'projects';
    title.textContent = view === 'projects' ? 'All Projects' : 'Explore';
    scroller.scrollTop = 0;
  }
  function open(next) {
    if (!dialog.open) {
      returnFocus = document.activeElement; oldOverflow = document.body.style.overflow;
      dialog.showModal(); lock();
    }
    setView(next); button.setAttribute('aria-expanded', 'true');
    dialog.querySelector('.portfolio-menu-close').focus({ preventScroll: true });
  }
  function close() { if (dialog.open) dialog.close(); }
  dialog.addEventListener('close', function () {
    if (B.scroll && !B.runtime.failed) B.scroll.lock(false);
    document.body.style.overflow = oldOverflow;
    button.setAttribute('aria-expanded', 'false');
    var target = visible ? button : returnFocus;
    if (target && target.isConnected && !target.closest('[inert]')) target.focus({ preventScroll: true });
  });
  button.addEventListener('click', function () { open('navigation'); });
  dialog.querySelector('.portfolio-menu-close').addEventListener('click', close);
  dialog.addEventListener('cancel', function (event) { event.preventDefault(); close(); });
  // Keep Tab in page content rather than letting the native dialog cycle into browser chrome.
  dialog.addEventListener('keydown', function (event) {
    if (event.key !== 'Tab') return;
    var controls = Array.from(dialog.querySelectorAll('a[href],button,input,select,textarea,[tabindex]')).filter(function (el) { return !el.disabled && el.tabIndex >= 0 && el.getClientRects().length; });
    var first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  dialog.querySelector('.portfolio-menu-all').addEventListener('click', function () { setView('projects'); directory.querySelector('button').focus({ preventScroll: true }); });
  dialog.querySelector('.portfolio-menu-back').addEventListener('click', function () { setView('navigation'); dialog.querySelector('.portfolio-menu-all').focus({ preventScroll: true }); });
  dialog.querySelectorAll('[data-menu-section]').forEach(function (a) {
    a.addEventListener('click', function (event) {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault(); close();
      requestAnimationFrame(function () {
        if (a.dataset.menuSection === 'resume') document.getElementById('resume-link').click();
        else document.getElementById('contact').scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth' });
      });
    });
  });
  window.BadgeMenu = {
    open: open, close: close,
    sync: function (alpha, opening) {
      visible = !opening && alpha > .05;
      button.hidden = !visible;
      button.style.opacity = alpha;
      button.inert = alpha < .5;
    },
    capture: function () {
      var focused = document.activeElement.closest('a');
      return { open: dialog.open, view: view, top: scroller.scrollTop, focusHref: focused && focused.getAttribute('href') };
    },
    restore: function (state) {
      if (!state || !state.open) return;
      open(state.view);
      requestAnimationFrame(function () {
        scroller.scrollTop = Number(state.top) || 0;
        if (state.focusHref) {
          var a = Array.from(directory.querySelectorAll('a')).find(function (a) { return a.getAttribute('href') === state.focusHref; });
          if (a) a.focus({ preventScroll: true });
        }
      });
    }
  };
  addEventListener('pageshow', function (event) { if (event.persisted && dialog.open) lock(); });
  addEventListener('badge-scene-fallback', function () { if (dialog.open) lock(); });
  if (location.hash === '#work-next' && !window.BADGE_RETURN_STATE) {
    addEventListener('load', function () { open('projects'); });
  }
})();
