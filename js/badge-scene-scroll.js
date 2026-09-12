/* One normalized scroll state for canvas, camera and HTML. Native touch; Lenis smooth wheel. */
(function () {
  'use strict';
  var B = window.BadgeScene;
  B.ScrollDriver = function (section) {
    this.section = section; this.value = { travel: 0 }; this.velocity = 0; this.previous = scrollY; this.locked = false;
    this.oldOverflow = '';
    var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.lenis = window.Lenis && !reduced ? new Lenis({ duration: 1.05, smoothWheel: matchMedia('(pointer:fine)').matches, syncTouch: false }) : null;
    this.onLenis = function () { if (window.ScrollTrigger) ScrollTrigger.update(); };
    if (this.lenis) this.lenis.on('scroll', this.onLenis);
    this.timeline = gsap.timeline({ paused: true }).fromTo(this.value, { travel: 0 }, { travel: B.duration, duration: 1, ease: 'none' });
    gsap.registerPlugin(ScrollTrigger);
    this.resize();
    this.trigger = ScrollTrigger.create({ trigger: section, start: function () { return 'top ' + (innerHeight * B.timing.heroOverlap) + 'px'; }, end: function () { return '+=' + B.duration * innerHeight; }, animation: this.timeline, scrub: true, invalidateOnRefresh: true });
    B.groups.forEach(function (g) {
      var anchor = document.createElement('span'); anchor.className = 'scene-anchor'; anchor.id = 'work-' + g.id;
      anchor.dataset.at = g.center; section.append(anchor);
      if (g.legacyHash) { var alias = anchor.cloneNode(); alias.id = g.legacyHash.slice(1); section.append(alias); }
    });
    this.resize();
  };
  B.ScrollDriver.prototype.resize = function () {
    var oldHeight = this.viewportHeight, oldStart = this.start, oldDuration = B.duration;
    var oldGroup = B.groups.find(function (g) { return this.lastTravel < g.end; }, this) || B.groups[B.groups.length - 1];
    var oldGroupStart = oldGroup.start, oldGroupLength = oldGroup.end - oldGroup.start;
    // Browser scroll anchoring may already have moved scrollY before the resize event.
    // Preserve the last rendered narrative state, not that intermediate document offset.
    var progress = oldHeight && this.previous >= oldStart && this.previous <= oldStart + oldDuration * oldHeight ? this.lastTravel : -1;
    var changed = B.configureViewport();
    if (changed) {
      if (progress >= 0) progress = oldGroup.start + (progress - oldGroupStart) / oldGroupLength * (oldGroup.end - oldGroup.start);
      this.timeline.clear().fromTo(this.value, { travel: 0 }, { travel: B.duration, duration: 1, ease: 'none', immediateRender: false });
    }
    this.start = this.section.offsetTop - innerHeight * B.timing.heroOverlap;
    this.viewportHeight = innerHeight;
    // The next document section arrives as the final collage exits; no empty extra viewport.
    this.section.style.height = ((B.duration - B.timing.heroOverlap) * innerHeight) + 'px';
    this.section.querySelectorAll('.scene-anchor').forEach(function (a) {
      var group = B.groups.find(function (g) { return a.id === 'work-' + g.id || '#' + a.id === g.legacyHash; });
      if (group) a.dataset.at = group.center;
      a.style.top = (Number(a.dataset.at) - B.timing.heroOverlap) * innerHeight + 'px';
    });
    if (this.lenis) this.lenis.resize();
    if (this.trigger) this.trigger.refresh();
    if (oldHeight && (changed || oldHeight !== innerHeight || oldStart !== this.start) && progress >= 0 && progress <= B.duration) {
      var top = this.start + progress * innerHeight;
      if (this.lenis) this.lenis.scrollTo(top, { immediate: true, force: true }); else scrollTo(0, top);
      this.previous = scrollY;
    }
  };
  B.ScrollDriver.prototype.tick = function (now) {
    if (this.lenis) this.lenis.raf(now);
    var current = scrollY;
    this.velocity = B.mix(this.velocity, current - this.previous, .3); this.previous = current;
    // The same physical scroll position supplies all phases. Never add another smoothScroll lerp.
    this.work = B.smooth(Math.max(innerHeight * .15, this.start - innerHeight * .70), this.start, current);
    this.trigger.update();
    // Before the chapter trigger, continue its vertical path below the viewport
    // instead of fading a stationary composition into the departing badge.
    this.lastTravel = current < this.start ? (current - this.start) / innerHeight : this.value.travel;
    return this.lastTravel;
  };
  B.ScrollDriver.prototype.go = function (travel, immediate) {
    var top = this.start + travel * innerHeight;
    if (this.lenis) this.lenis.scrollTo(top, { immediate: Boolean(immediate) });
    else scrollTo({ top: top, behavior: immediate || matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };
  B.ScrollDriver.prototype.lock = function (locked) {
    if (this.locked === locked) return; this.locked = locked;
    if (locked) { this.oldOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden'; if (this.lenis) this.lenis.stop(); }
    else { document.body.style.overflow = this.oldOverflow; if (this.lenis) this.lenis.start(); }
  };
  B.ScrollDriver.prototype.dispose = function () {
    this.lock(false); this.trigger.kill(); this.timeline.kill(); if (this.lenis) this.lenis.destroy(); this.section.style.height = '';
  };
})();
