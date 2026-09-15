/* Same-tab case navigation with a per-entry, tab-local return snapshot. */
(function () {
  'use strict';
  var key = 'badge-return-', params = new URLSearchParams(location.search);
  var detail = /project-scrollcarousel\.html$/.test(location.pathname);
  function read(id) { try { return JSON.parse(sessionStorage.getItem(key + id)); } catch (_) { return null; } }
  function save(id, value) { try { sessionStorage.setItem(key + id, JSON.stringify(value)); return true; } catch (_) { return false; } }
  if (detail) {
    addEventListener('DOMContentLoaded', function () {
      if (params.has('measure')) return;
      var id = params.get('return'), state = id && read(id);
      var home = new URL('./index.html#work-independent', location.href);
      if (state) {
        var source = new URL(state.url, location.href);
        var rootPath = new URL('./', location.href).pathname;
        if (source.origin === location.origin && [rootPath, rootPath + 'index.html', rootPath + 'index-badge.html'].includes(source.pathname)) {
          home = source; home.searchParams.set('restore', id);
        }
      }
      function returnHome() {
        if (window.ProjectFlip) ProjectFlip.returnTo(home.href, state); else location.href = home.href;
      }
      document.querySelectorAll('[data-return-home]').forEach(function (a) {
        a.href = home.href;
        a.addEventListener('click', function (e) {
          if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
          e.preventDefault(); returnHome();
        });
      });
      var next = document.getElementById('scc-detail-next');
      if (state && next) { var url = new URL(next.href); url.searchParams.set('return', id); next.href = url.href; }
      addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !e.defaultPrevented && !e.target.closest('input,textarea,select,[contenteditable]')) { e.preventDefault(); returnHome(); }
      });
    });
    return;
  }
  var nav = performance.getEntriesByType('navigation')[0];
  var id = params.get('restore') || (nav && nav.type === 'back_forward' && history.state && history.state.badgeReturn);
  var snapshot = id && read(id);
  window.BADGE_RETURN_STATE = snapshot || null;
  if (snapshot && 'scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.BadgeNavigation = {
    open: function (href, source) {
      if (window.ProjectFlip && ProjectFlip.busy) return;
      var target = this.enter(href, source);
      if (window.ProjectFlip) ProjectFlip.open(target, source); else location.href = target;
    },
    enter: function (href, source) {
      var url = new URL(href, location.href), B = window.BadgeScene;
      var token = Date.now().toString(36) + Math.random().toString(36).slice(2);
      var menu = window.BadgeMenu && window.BadgeMenu.capture();
      var state = { url: location.href, project: url.searchParams.get('project'), y: scrollY, travel: B && B.scroll && scrollY >= B.scroll.start && scrollY <= B.scroll.start + B.duration * innerHeight ? B.scroll.value.travel : null, menu: menu, mode: document.getElementById('work-next').dataset.layout || 'topic' };
      if (source) {
        state.flipKeyboard = source.matches(':focus-visible');
        state.flipSource = source.classList.contains('scene-project-hit') ? 'scene' : source.closest('#work-collection') ? 'directory' : source.closest('.scene-fallback') ? 'fallback' : null;
      }
      // Native mobile snapshots use physical position, not a possibly idle renderer frame.
      if (state.travel !== null && B.nativeMobile) state.travel = (scrollY - B.scroll.start) / innerHeight;
      // Chapter-relative snapshots survive desktop/native-mobile breakpoint changes.
      if (state.travel !== null) {
        var group = B.sample(state.travel).group;
        state.scenePosition = { group: group.id, fraction: (state.travel - group.start) / (group.end - group.start) };
      }
      if (save(token, state)) {
        history.replaceState(Object.assign({}, history.state, { badgeReturn: token }), '');
        url.searchParams.set('return', token);
      }
      return url.href;
    }
  };
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === '_blank' || a.classList.contains('scene-project-hit') || a.classList.contains('badge-project-enter')) return;
    var url = new URL(a.href, location.href);
    if (url.origin === location.origin && /project-scrollcarousel\.html$/.test(url.pathname)) { e.preventDefault(); window.BadgeNavigation.open(url.href, a); }
  });
  addEventListener('pageshow', async function (event) {
    if (event.persisted || !snapshot) return;
    await document.fonts.ready;
    if (window.BADGE_WORK_READY) await window.BADGE_WORK_READY;
    if (window.BadgeWorkRestore) window.BadgeWorkRestore(snapshot);
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      var B = window.BadgeScene;
      if (B && B.scroll && !(B.runtime && B.runtime.failed)) {
        B.scroll.resize(); B.scroll.lock(false);
        var position = snapshot.scenePosition;
        var group = position && B.groups.find(function (g) { return g.id === position.group; });
        if (group) B.scroll.go(group.start + position.fraction * (group.end - group.start), true);
        else if (snapshot.travel !== null) B.scroll.go(snapshot.travel, true);
        else if (B.scroll.lenis) B.scroll.lenis.scrollTo(snapshot.y, { immediate: true, force: true });
        else scrollTo(0, snapshot.y);
      } else scrollTo(0, snapshot.y);
      if (window.BadgeMenu) window.BadgeMenu.restore(snapshot.menu || (snapshot.open ? { open: true, view: 'projects', top: 0 } : null));
      var clean = new URL(location.href); clean.searchParams.delete('restore');
      history.replaceState(Object.assign({}, history.state, { badgeReturn: id }), '', clean.href);
      dispatchEvent(new CustomEvent('badge-return-restored', { detail: snapshot }));
    }); });
  });
})();
