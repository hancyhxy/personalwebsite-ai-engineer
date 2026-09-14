/* One physical scroll position drives identity exit and both progress guides.
   Card pointer tilt stays on #badge; scroll transforms only .badge-stage. */
(function () {
  'use strict';
  var B = window.BadgeScene, mast = document.querySelector('.mast'), logo = mast.querySelector('a');
  var dockedLogo = logo.cloneNode(true); dockedLogo.className = 'mast-docked';
  dockedLogo.setAttribute('aria-hidden', 'true'); dockedLogo.tabIndex = -1; mast.append(dockedLogo);
  var stage = document.querySelector('.badge-stage'), cue = document.getElementById('hero-scroll');
  var reduced = matchMedia('(prefers-reduced-motion: reduce)'), frame = 0;
  var rail = document.createElement('aside'); rail.className = 'badge-scroll-guide'; rail.setAttribute('aria-label', 'Portfolio navigation');
  var total = document.createElement('div'); total.className = 'badge-page-progress';
  total.setAttribute('role', 'progressbar'); total.setAttribute('aria-label', 'Page scroll progress'); total.setAttribute('aria-valuemin', '0'); total.setAttribute('aria-valuemax', '100');
  total.innerHTML = '<span></span>';
  var nav = document.createElement('nav'); nav.className = 'scene-chapter-nav'; nav.setAttribute('aria-label', 'Selected Work chapters');
  B.groups.forEach(function (g) {
    var a = document.createElement('a'); a.href = '#work-' + g.id; a.setAttribute('aria-label', g.title); a.title = g.title;
    a.innerHTML = '<span class="chapter-dot" aria-hidden="true"></span>';
    a.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      e.preventDefault();
      if (B.scroll && !B.runtime.failed) B.scroll.go(g.center);
      else document.getElementById('fallback-' + g.id).scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth' });
      history.replaceState(history.state, '', a.hash);
    });
    nav.append(a);
  });
  rail.append(total, nav);
  var timeline = document.createElement('aside'); timeline.className = 'badge-chapter-progress'; timeline.hidden = true;
  timeline.innerHTML = '<div class="chapter-progress-label"><span></span><span></span></div><div class="chapter-progress-track" role="progressbar" aria-label="Overall Selected Work progress" aria-valuemin="0" aria-valuemax="100"><span></span></div>';
  var label = timeline.querySelector('.chapter-progress-label'), track = timeline.querySelector('.chapter-progress-track');
  var years = B.featured.map(function (i) { return B.projects[i].year; });
  var newest = Math.max.apply(null, years), oldest = Math.min.apply(null, years);
  label.firstElementChild.textContent = newest;
  label.lastElementChild.textContent = oldest;
  timeline.setAttribute('aria-label', 'Selected Work, ' + newest + '–' + oldest);
  document.body.append(rail, timeline);
  function value(el, v) { var percent = String(Math.round(v * 100)); if (el.getAttribute('aria-valuenow') !== percent) el.setAttribute('aria-valuenow', percent); }
  function update() {
    frame = 0;
    var opening = document.documentElement.classList.contains('opening-pending') || document.body.classList.contains('opening-active');
    var y = scrollY, h = innerHeight;
    var resumeTop = document.getElementById('resume-section').getBoundingClientRect().top;
    var mobileResume = innerWidth <= 700 && resumeTop < h * .92;
    rail.hidden = opening || mobileResume;
    // Two stationary names crossfade; no logo travels across the screen.
    var centerAlpha = reduced.matches ? (y > 24 ? 0 : 1) : 1 - B.smooth(0, h * .18, y);
    var dockAlpha = reduced.matches ? (y > 24 ? 1 : 0) : B.smooth(h * .08, h * .24, y);
    logo.style.top = mast.offsetHeight / 2 + 'px'; logo.style.opacity = centerAlpha;
    dockedLogo.style.opacity = dockAlpha;
    if (window.BadgeMenu) window.BadgeMenu.sync(dockAlpha, opening);
    [logo, dockedLogo].forEach(function (el, i) {
      var available = i ? dockAlpha >= .5 : centerAlpha >= .5;
      el.tabIndex = available ? 0 : -1; el.setAttribute('aria-hidden', String(!available));
      el.style.pointerEvents = available ? 'auto' : 'none';
    });
    var nativeHero = reduced.matches || B.nativeMobile;
    var push = B.easeOut(0, h * .80, y);
    var fade = nativeHero ? 0 : B.smooth(h * .12, h * .82, y);
    // A shallow forward/upward arc: grow gently while rising, never shrink away.
    stage.style.transform = nativeHero ? '' : 'translate3d(0,' + (Math.min(y, h) * .20 - h * .06 * push * push) + 'px,0) scale(' + (1 + push * .14) + ')';
    stage.style.opacity = 1 - fade;
    stage.inert = fade > .96;
    cue.style.opacity = 1 - fade; cue.inert = fade > .96;
    var scrollRange = document.documentElement.scrollHeight - h;
    var progress = B.clamp(y / Math.max(1, scrollRange), 0, 1);
    total.style.setProperty('--page-progress', progress); value(total, progress);
    var active = null, workProgress = 0, showing = false;
    if (B.scroll && B.runtime && !B.runtime.failed) {
      var travel = (y - B.scroll.start) / h;
      var state = B.sample(B.clamp(travel, 0, B.duration));
      showing = !opening && travel >= -.12 && travel < B.duration;
      active = showing ? state.group : null;
      var progressEnd = B.nativeMobile ? (document.getElementById('fallback-experimental').getBoundingClientRect().bottom + y - h - B.scroll.start) / h : B.groups[B.groups.length - 1].center;
      workProgress = B.clamp(travel / Math.max(.01, progressEnd), 0, 1);
    } else {
      B.groups.forEach(function (g) {
        var el = document.getElementById('fallback-' + g.id), rect = el.getBoundingClientRect();
        if (rect.top <= h * .45 && rect.bottom > h * .45) active = g;
      });
      var first = document.getElementById('fallback-' + B.groups[0].id).getBoundingClientRect();
      var last = document.getElementById('fallback-' + B.groups[B.groups.length - 1].id).getBoundingClientRect();
      workProgress = B.clamp((h * .45 - first.top) / Math.max(1, last.bottom - first.top), 0, 1);
      showing = first.top <= h * .45 && last.bottom > h * .45 && !opening;
    }
    // Finish at the last overview, then retire before the incoming résumé reaches the axis.
    showing = showing && resumeTop > h * .91;
    timeline.hidden = !showing;
    document.body.classList.toggle('mobile-work-axis-active', innerWidth <= 700 && showing);
    timeline.style.opacity = reduced.matches ? 1 : B.smooth(h * .91, h * .98, resumeTop);
    track.style.setProperty('--chapter-progress', workProgress); value(track, workProgress);
    track.setAttribute('aria-valuetext', 'Selected Work ' + newest + '–' + oldest + ', ' + Math.round(workProgress * 100) + '%');
    Array.from(nav.children).forEach(function (a, i) { if (active === B.groups[i]) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current'); });
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(update); }
  addEventListener('scroll', schedule, { passive: true }); addEventListener('resize', schedule, { passive: true });
  addEventListener('pageshow', schedule); addEventListener('badge-opening-complete', schedule); addEventListener('badge-scene-fallback', schedule);
  reduced.addEventListener('change', schedule); document.fonts.ready.then(schedule);
  if (window.ResizeObserver) new ResizeObserver(schedule).observe(document.body);
  // Fallback hash destinations exist only after scene initialization.
  if ((!B.runtime || B.runtime.failed) && !window.BADGE_RETURN_STATE) {
    var group = B.groups.find(function (g) { return location.hash === '#work-' + g.id || location.hash === g.legacyHash; });
    if (group) document.fonts.ready.then(function () { document.getElementById('fallback-' + group.id).scrollIntoView(); });
  }
  schedule();
})();
