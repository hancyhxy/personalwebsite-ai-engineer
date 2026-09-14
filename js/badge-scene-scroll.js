/* Native HTML chapters on mobile; one normalized perspective timeline on desktop. */
(function () {
  'use strict';
  var B = window.BadgeScene;
  B.ScrollDriver = function (section) {
    this.section = section; this.value = { travel: 0 }; this.velocity = 0; this.previous = scrollY; this.locked = false;
    this.oldOverflow = ''; this.lenis = null;
    this.onLenis = function () { if (window.ScrollTrigger) ScrollTrigger.update(); };
    this.timeline = gsap.timeline({ paused: true }).fromTo(this.value, { travel: 0 }, { travel: B.duration, duration: 1, ease: 'none' });
    gsap.registerPlugin(ScrollTrigger);
    B.groups.forEach(function (g) {
      var anchor = document.createElement('span'); anchor.className = 'scene-anchor'; anchor.id = 'work-' + g.id;
      anchor.dataset.at = g.center; section.append(anchor);
      if (g.legacyHash) { var alias = anchor.cloneNode(); alias.id = g.legacyHash.slice(1); section.append(alias); }
    });
    this.trigger = ScrollTrigger.create({ trigger: section, start: function () { return 'top ' + (innerHeight * B.timing.heroOverlap) + 'px'; }, end: function () { return '+=' + B.duration * innerHeight; }, animation: this.timeline, scrub: true, invalidateOnRefresh: true });
    this.resize();
  };
  B.ScrollDriver.prototype.resize = function () {
    var oldHeight = this.viewportHeight, oldStart = this.start, oldDuration = B.duration;
    var oldGroup = B.groups.find(function (g) { return this.lastTravel < g.end; }, this) || B.groups[B.groups.length - 1];
    var oldGroupStart = oldGroup.start, oldGroupLength = oldGroup.end - oldGroup.start;
    var progress = oldHeight && this.previous >= oldStart && this.previous <= oldStart + oldDuration * oldHeight ? this.lastTravel : -1;
    var changed = B.configureViewport();
    if (B.nativeMobile) {
      // Toolbar-only height changes must never force scrollTo or resize a scene spacer.
      this.trigger.disable(false);
      if (this.lenis) { this.lenis.destroy(); this.lenis = null; }
      this.section.style.height = '';
      this.start = this.section.offsetTop;
      this.viewportHeight = innerHeight;
      B.groups.forEach(function (g) {
        var el = document.getElementById('fallback-' + g.id);
        g.start = (el.getBoundingClientRect().top + scrollY - 88 - this.start) / innerHeight;
        g.center = g.start;
      }, this);
      B.duration = this.section.offsetHeight / innerHeight;
      B.groups.forEach(function (g, i) { g.end = i + 1 < B.groups.length ? B.groups[i + 1].start : B.duration; });
    } else {
      if (!this.lenis && window.Lenis && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.lenis = new Lenis({ duration: 1.05, smoothWheel: matchMedia('(pointer:fine)').matches, syncTouch: false });
        this.lenis.on('scroll', this.onLenis);
        if (this.locked) this.lenis.stop();
      }
      this.timeline.clear().fromTo(this.value, { travel: 0 }, { travel: B.duration, duration: 1, ease: 'none', immediateRender: false });
      this.start = this.section.offsetTop - innerHeight * B.timing.heroOverlap;
      this.viewportHeight = innerHeight;
      this.section.style.height = ((B.duration - B.timing.heroOverlap) * innerHeight) + 'px';
      if (this.lenis) this.lenis.resize();
      this.trigger.enable(false, false); this.trigger.refresh();
    }
    this.section.querySelectorAll('.scene-anchor').forEach(function (a) {
      var group = B.groups.find(function (g) { return a.id === 'work-' + g.id || '#' + a.id === g.legacyHash; });
      if (group) a.dataset.at = group.center;
      a.style.top = (Number(a.dataset.at) * innerHeight + this.start - this.section.offsetTop) + 'px';
    }, this);
    if (progress >= 0 && changed) {
      this.go(oldGroup.start + (progress - oldGroupStart) / oldGroupLength * (oldGroup.end - oldGroup.start), true);
    } else if (!B.nativeMobile && oldHeight && (oldHeight !== innerHeight || oldStart !== this.start) && progress >= 0 && progress <= B.duration) {
      this.go(progress, true);
    }
    if (B.nativeMobile) this.value.travel = this.lastTravel = (scrollY - this.start) / innerHeight;
    this.previous = scrollY;
  };
  B.ScrollDriver.prototype.tick = function (now) {
    if (this.lenis) this.lenis.raf(now);
    var current = scrollY;
    this.velocity = B.mix(this.velocity, current - this.previous, .3); this.previous = current;
    if (B.nativeMobile) {
      this.work = 0;
      return this.lastTravel = this.value.travel = (current - this.start) / innerHeight;
    }
    this.work = B.smooth(Math.max(innerHeight * .15, this.start - innerHeight * .70), this.start, current);
    this.trigger.update();
    this.lastTravel = current < this.start ? (current - this.start) / innerHeight : this.value.travel;
    return this.lastTravel;
  };
  B.ScrollDriver.prototype.go = function (travel, immediate) {
    var top = this.start + travel * innerHeight;
    if (this.lenis) this.lenis.scrollTo(top, { immediate: Boolean(immediate) });
    else scrollTo({ top: top, behavior: immediate || B.nativeMobile || matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
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
