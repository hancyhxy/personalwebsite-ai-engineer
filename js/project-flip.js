/* Flip + Zoom across real documents. Animate a visual-only surface, never a measurement iframe.
   The incoming page remains a normal URL with its original renderer, templates and document scroll. */
(function () {
  'use strict';
  var motion = matchMedia('(prefers-reduced-motion: reduce)');
  var returnKey = 'badge-flip-return', entryKey = 'badge-flip-entry';
  var detail = /project-scrollcarousel\.html$/.test(location.pathname);
  var phase = 'idle', operation = 0, layer = null, frame = 0, timer = 0, guard = 0;
  var sourceLink = null, unlock = null, pending = null, shellPromise = null;
  var API = window.ProjectFlip = {};
  Object.defineProperty(API, 'busy', { get: function () { return phase !== 'idle'; } });
  Object.defineProperty(API, 'phase', { get: function () { return phase; } });
  function storage(key, value) {
    try {
      if (value === undefined) return JSON.parse(sessionStorage.getItem(key));
      if (value === null) sessionStorage.removeItem(key); else sessionStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (_) { return false; }
  }
  function supported() { return !motion.matches && typeof HTMLDialogElement !== 'undefined' && HTMLDialogElement.prototype.showModal && CSS.supports('transform-style', 'preserve-3d'); }
  function wait(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function frames() { return new Promise(function (resolve) { requestAnimationFrame(function () { requestAnimationFrame(resolve); }); }); }
  function rect(el) {
    if (!el || !el.isConnected || !el.getClientRects().length || el.closest('[hidden]')) return null;
    var r = el.getBoundingClientRect();
    if (r.width < 20 || r.height < 20 || r.bottom <= 0 || r.top >= innerHeight || r.right <= 0 || r.left >= innerWidth) return null;
    return { left:r.left, top:r.top, width:r.width, height:r.height };
  }
  function imageSource(link) { return link && (link.classList.contains('scene-project-hit') ? link : link.querySelector('img')); }
  function sourceFor(state) {
    var index = Number(state.project), kind = state.flipSource;
    var links = kind === 'scene' ? document.querySelectorAll('.scene-project-hit') : kind === 'directory' ? document.querySelectorAll('#work-collection a') : document.querySelectorAll('.scene-fallback a');
    return Array.from(links).find(function (a) { return new URL(a.href, location.href).searchParams.get('project') === String(index); });
  }
  function clean(root) {
    root.querySelectorAll('script,iframe,object,embed,link,style,form').forEach(function (el) { el.remove(); });
    root.querySelectorAll('*').forEach(function (el) {
      // These IDs carry the real detail typography. The surface exists only on the
      // homepage, where none of the scc-detail IDs exist; other IDs are discarded.
      if (!/^scc-detail-/.test(el.id)) el.removeAttribute('id');
      Array.from(el.attributes).forEach(function (a) { if (/^on/i.test(a.name) || a.name === 'autofocus' || a.name === 'srcdoc') el.removeAttribute(a.name); });
      if (el.matches('a,button,input,textarea,select,[tabindex]')) { el.tabIndex = -1; el.removeAttribute('href'); }
    });
    root.inert = true; root.setAttribute('aria-hidden', 'true');
    return root;
  }
  function documentSurface() {
    var el = document.createElement('div');
    el.className = 'project-flip-document scrollcarousel-page scc-detail-page';
    return el;
  }
  function loadShell() {
    if (!shellPromise) shellPromise = fetch('./project-scrollcarousel.html', { credentials:'same-origin' }).then(function (r) {
      if (!r.ok) throw new Error('Detail unavailable');
      return r.text();
    }).catch(function (e) { shellPromise = null; throw e; });
    return shellPromise;
  }
  API.warm = function (index) {
    if (!supported()) return;
    loadShell().catch(function () {});
    var p = typeof SCROLLCAROUSEL_PROJECTS !== 'undefined' && SCROLLCAROUSEL_PROJECTS[index];
    if (p) { var image = new Image(); image.src = p.hero || p.thumb; }
  };
  async function makeDetail(index) {
    var html = await loadShell();
    var parsed = new DOMParser().parseFromString(html, 'text/html');
    var root = documentSurface(), header = parsed.querySelector('.scc-detail-header'), hero = parsed.querySelector('.scc-detail-hero');
    if (!header || !hero || !window.ProjectDetailHero) throw new Error('Detail template unavailable');
    var main = document.createElement('main'); main.append(document.importNode(hero,true));
    root.append(document.importNode(header,true),main);
    var image = ProjectDetailHero.render(root,index);
    await image.decode();
    clean(root);
    return root;
  }
  function resetScene() {
    var b = window.BadgeScene;
    if (b && b.interaction) { b.interaction.entering = false; b.interaction.flight = false; }
  }
  function cleanup(focus) {
    operation++; cancelAnimationFrame(frame); clearTimeout(timer); clearTimeout(guard);
    if (layer) { if (layer.open) layer.close(); layer.remove(); layer = null; }
    if (unlock) { unlock(); unlock = null; }
    document.documentElement.classList.remove('project-flip-return-pending');
    if (sourceLink) sourceLink.removeAttribute('aria-busy');
    resetScene(); pending = null; phase = 'idle';
    var target = sourceLink;
    if (focus && target && target.isConnected) {
      frames().then(function(){if (phase === 'idle' && target.isConnected && !target.hidden) target.focus({preventScroll:true});});
    }
    sourceLink = null;
  }
  API.cancel = function () { storage(entryKey,null); cleanup(true); };
  function holdScroll() {
    var b = window.BadgeScene, driver = b && b.scroll && !b.runtime.failed ? b.scroll : null;
    var old = document.body.style.overflow, alreadyLocked = driver && driver.locked;
    if (driver) { if (!alreadyLocked) driver.lock(true); }
    else document.body.style.overflow = 'hidden';
    unlock = function () { if (driver && !alreadyLocked) driver.lock(false); document.body.style.overflow = old; };
  }
  function createLayer(surface, thumb, label, width, height, returning) {
    layer = document.createElement('dialog'); layer.className = 'project-flip-layer';
    layer.setAttribute('aria-label',label); layer.tabIndex = -1;
    var status = document.createElement('span'); status.className = 'project-flip-status'; status.setAttribute('role','status'); status.textContent = label;
    var scrim = document.createElement('div'); scrim.className = 'project-flip-scrim'; scrim.setAttribute('aria-hidden','true');
    var geometry = document.createElement('div'); geometry.className = 'project-flip-geometry'; geometry.setAttribute('aria-hidden','true'); geometry.inert = true;
    var turn = document.createElement('div'); turn.className = 'project-flip-turn';
    var front = document.createElement('div'); front.className = 'project-flip-face project-flip-front';
    var img = new Image(); img.src = thumb; img.alt = ''; front.append(img);
    var back = document.createElement('div'); back.className = 'project-flip-face project-flip-back';
    surface.style.width = width + 'px'; surface.style.height = height + 'px'; back.append(surface);
    turn.append(front,back); geometry.append(turn); layer.append(scrim,geometry,status); (document.body || document.documentElement).append(layer);
    layer.addEventListener('cancel',function(e){e.preventDefault();API.cancel();});
    layer.addEventListener('keydown',function(e){if(e.key==='Tab')e.preventDefault();});
    layer.addEventListener('wheel',function(e){e.preventDefault();},{passive:false});
    layer.showModal(); if (!returning) holdScroll();
    return { geometry:geometry, turn:turn, front:front, scrim:scrim, surface:surface, documentWidth:width };
  }
  function paint(parts, origin, progress) {
    var x = origin.left * (1-progress), y = origin.top * (1-progress);
    var w = origin.width + (innerWidth-origin.width)*progress, h = origin.height + (innerHeight-origin.height)*progress;
    parts.geometry.style.transform = 'translate3d('+x+'px,'+y+'px,0)';
    parts.geometry.style.width = w+'px'; parts.geometry.style.height = h+'px';
    parts.turn.style.transform = 'rotateY('+(180*progress)+'deg)';
    parts.front.style.aspectRatio = origin.width+' / '+origin.height;
    parts.turn.style.boxShadow = '0 '+(18*Math.sin(progress*Math.PI))+'px '+(65*Math.sin(progress*Math.PI))+'px rgba(23,20,16,.18)';
    // Uniform scaling inside a changing card envelope; neither artwork nor type is stretched.
    parts.surface.style.transform = 'scale('+(w/parts.documentWidth)+')';
    parts.scrim.style.opacity = progress;
  }
  function animate(parts, origin, reverse, done) {
    var start = performance.now(), mine = operation;
    phase = reverse ? 'closing' : 'opening';
    dispatchEvent(new CustomEvent('project-flip-start',{detail:{direction:phase}}));
    function step(now) {
      if (mine !== operation) return;
      var t = Math.min(1,(now-start)/620), eased = t*t*(3-2*t);
      paint(parts,origin,reverse ? 1-eased : eased);
      if (t < 1) frame = requestAnimationFrame(step); else {
        dispatchEvent(new CustomEvent('project-flip-end',{detail:{direction:phase}}));
        done();
      }
    }
    paint(parts,origin,reverse ? 1 : 0); frame = requestAnimationFrame(step);
  }
  function navigate(href) {
    phase = 'navigating';
    // A denied/interrupted navigation must never leave the source document locked.
    timer = setTimeout(function(){cleanup(true);},1800);
    location.assign(href);
  }
  API.open = async function (href, link) {
    if (API.busy) return;
    var url = new URL(href,location.href), index = Number(url.searchParams.get('project'));
    var project = typeof SCROLLCAROUSEL_PROJECTS !== 'undefined' && SCROLLCAROUSEL_PROJECTS[index];
    if (url.origin !== location.origin || !/project-scrollcarousel\.html$/.test(url.pathname) || !project) { location.assign(href); return; }
    if (!supported() || !rect(imageSource(link))) { location.assign(href); return; }
    phase = 'preparing'; sourceLink = link; link.setAttribute('aria-busy','true');
    var mine = ++operation;
    try {
      var surface = await Promise.race([makeDetail(index),wait(900).then(function(){throw new Error('Preparation timeout');})]);
      if (mine !== operation) return;
      var origin = rect(imageSource(link));
      if (!origin || motion.matches) { cleanup(false); location.assign(href); return; }
      // Snapshot the still-current source before modal focus changes; no intermediate preview.
      var keyboard = link.matches(':focus-visible');
      var parts = createLayer(surface,project.thumb,'Opening '+project.title,innerWidth,innerHeight);
      var b = window.BadgeScene;
      if (b && b.interaction && link.classList.contains('scene-project-hit')) { b.interaction.selected = index; b.interaction.entering = true; b.interaction.flight = true; }
      storage(entryKey,{href:url.href,at:Date.now(),keyboard:keyboard});
      animate(parts,origin,false,function(){navigate(href);});
    } catch (error) {
      if (mine !== operation) return;
      console.warn('Project flip: direct-navigation fallback.', error.message);
      cleanup(false); location.assign(href);
    }
  };
  API.returnTo = function (href, state) {
    if (API.busy) return;
    if (!supported() || !state || !state.flipSource) { location.assign(href); return; }
    var surface = documentSurface(), scroll = document.createElement('div');
    scroll.style.transform = 'translateY('+(-scrollY)+'px)';
    document.querySelectorAll('body > .scc-detail-header, body > main, body > .scc-detail-footer').forEach(function(el){scroll.append(el.cloneNode(true));});
    // Freeze desktop sticky headings at their current visible positions in the inert snapshot.
    // A cloned document has no native scroll offset of its own to reproduce sticky layout.
    var headings = scroll.querySelectorAll('.scc-detail-block > h2,.scc-detail-block > h3');
    document.querySelectorAll('.scc-detail-block > h2,.scc-detail-block > h3').forEach(function(el,i){
      if (!headings[i] || getComputedStyle(el).position !== 'sticky') return;
      var parent = el.parentElement, style = getComputedStyle(parent);
      var naturalTop = parent.getBoundingClientRect().top + parseFloat(style.paddingTop) + parseFloat(style.borderTopWidth);
      headings[i].style.position = 'relative'; headings[i].style.top = '0';
      headings[i].style.transform = 'translateY('+(el.getBoundingClientRect().top-naturalTop)+'px)';
    });
    // The clicked close control retires; the rest of the actual visible page is preserved.
    scroll.querySelectorAll('.scc-detail-close').forEach(function(el){el.remove();});
    surface.append(scroll); clean(surface);
    var original = SCROLLCAROUSEL_PROJECTS[Number(state.project)];
    if (!original) { location.assign(href); return; }
    var handoff = {to:new URL(href,location.href).href,at:Date.now(),index:Number(state.project),thumb:original.thumb,title:original.title,html:surface.innerHTML,width:innerWidth,height:innerHeight};
    if (handoff.html.length > 450000 || !storage(returnKey,handoff)) { location.assign(href); return; }
    navigate(href);
  };
  function readReturn() {
    var value = storage(returnKey);
    if (!value) return null;
    storage(returnKey,null);
    if (detail || !supported() || Date.now()-value.at > 15000 || value.to !== location.href || !Number.isInteger(value.index) || typeof value.thumb !== 'string' || typeof value.title !== 'string' || typeof value.html !== 'string' || value.html.length > 450000 || !(value.width>0 && value.height>0)) return null;
    return value;
  }
  function coverReturn() {
    if (!pending || layer) return;
    try {
      var surface = documentSurface(); surface.innerHTML = pending.html; clean(surface);
      pending.parts = createLayer(surface,pending.thumb,'Returning to '+pending.title,pending.width,pending.height,true);
      paint(pending.parts,{left:0,top:0,width:innerWidth,height:innerHeight},1);
    } catch (_) { pending = null; cleanup(false); }
  }
  async function finishReturn(state) {
    if (!pending) return;
    coverReturn();
    var mine = operation;
    await frames();
    if (!pending || mine !== operation) return;
    var link = sourceFor(state), origin = rect(imageSource(link));
    sourceLink = link;
    if (link && !state.flipKeyboard) link.dataset.flipPointerFocus = 'true';
    // Directory restoration may have opened a modal above the early return cover.
    if (layer) { layer.close(); layer.showModal(); }
    holdScroll();
    document.documentElement.classList.remove('project-flip-return-pending');
    clearTimeout(guard);
    if (!origin || !pending.parts || motion.matches) { pending = null; cleanup(true); return; }
    var parts = pending.parts; pending = null;
    var b = window.BadgeScene;
    if (b && b.interaction && link.classList.contains('scene-project-hit')) {
      b.interaction.selected = Number(state.project); b.interaction.entering = true; b.interaction.flight = true;
    }
    animate(parts,origin,true,function(){cleanup(true);});
  }
  function armReturn(value) {
    pending = value; phase = 'waiting-return';
    document.documentElement.classList.add('project-flip-return-pending');
    guard = setTimeout(function(){pending=null;cleanup(false);},3500);
  }
  // Paint the saved viewport in the head, before homepage scripts/assets finish booting.
  pending = readReturn(); if (pending) { armReturn(pending); coverReturn(); }
  addEventListener('badge-return-restored',function(e){finishReturn(e.detail);});
  addEventListener('DOMContentLoaded',function(){
    if (pending) coverReturn();
    if (detail) {
      var entry = storage(entryKey); storage(entryKey,null);
      if (entry && entry.keyboard && entry.href === location.href && Date.now()-entry.at < 15000) {
        var close = document.querySelector('.scc-detail-close'); if (close) close.focus({preventScroll:true});
      }
    }
    // Intent prefetch is bounded to the card the visitor is actually approaching.
    ['pointerover','focusin','pointerdown'].forEach(function(type){document.addEventListener(type,function(e){
      var a = e.target.closest('a[href*="project-scrollcarousel.html"]');
      if (!detail && a && imageSource(a)) API.warm(Number(new URL(a.href,location.href).searchParams.get('project')));
    },{passive:true});});
  });
  addEventListener('pageshow',function(e){
    if (!e.persisted) return;
    cleanup(false);
    var value = readReturn();
    if (value) {
      armReturn(value); coverReturn();
      var token = history.state && history.state.badgeReturn;
      var state = token && storage('badge-return-'+token);
      if (state) finishReturn(state); else cleanup(false);
    }
  });
  addEventListener('pagehide',function(){cleanup(false);});
  addEventListener('resize',function(){
    if (phase === 'opening' || phase === 'closing') API.cancel();
    else if (pending && pending.parts) paint(pending.parts,{left:0,top:0,width:innerWidth,height:innerHeight},1);
  });
  addEventListener('keydown',function(e){
    document.querySelectorAll('[data-flip-pointer-focus]').forEach(function(el){delete el.dataset.flipPointerFocus;});
    if(e.key==='Escape' && phase==='preparing'){e.preventDefault();API.cancel();}
  });
  motion.addEventListener('change',function(){if(motion.matches && API.busy){pending=null;API.cancel();}});
})();
