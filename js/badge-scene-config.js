/* Three chapter compositions, not a per-project slideshow. Canonical detail indices stay intact. */
(function () {
  'use strict';
  var B = window.BadgeScene = window.BadgeScene || {};
  B.clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  B.mix = function (a, b, t) { return a + (b - a) * t; };
  B.smooth = function (a, b, v) { var t = B.clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  B.easeOut = function (a, b, v) { var t = B.clamp((v - a) / (b - a), 0, 1); return 1 - Math.pow(1 - t, 3); };
  B.projects = SCROLLCAROUSEL_PROJECTS;
  B.groups = [
    { id: 'independent', title: 'Independent Work', keywords: ['AI Prototyping', 'Interactive Products', 'Content Practice'], line: 'I turn emerging ideas into working experiences through AI-powered tools, interactive prototypes and independent content practice.' },
    { id: 'ux', title: 'UX Designer', keywords: ['Platform Systems', 'Complex Workflows', 'Global Experiences'], line: 'At Alibaba and ByteDance, I designed clear, usable experiences across complex platforms, service workflows and global products.' },
    { id: 'experimental', legacyHash: '#work-parsons', title: 'Experimental Practice', keywords: ['Space', 'Objects', 'Play'], line: 'I explore how space, physical objects and playful interactions turn abstract ideas into experiences people can feel and participate in.' }
  ];
  B.timing = { group: 1.2, groupBlend: .18, exit: .35, heroOverlap: .6 };
  B.motion = { desktop: .70, mobile: .98, cameraZ: 4.6, nearZ: -.08, rhythmStrength: .86, chapterInScale: .84, chapterOutScale: 1.12, readingHalfWidth: .14 };
  B.worldTravel = function (mobile) { return (mobile ? B.motion.mobile : B.motion.desktop) * 2 * (B.motion.cameraZ - B.motion.nearZ) * Math.tan(Math.PI / 8); };
  B.protectReading = function (r, safe, w, h) {
    if (safe.regions) return safe.regions.reduce(function (box, region) { return B.protectReading(box, region, w, h); }, r);
    var padding = 28, margin = Math.max(32, h * .055), band = h * .06;
    var top = safe.top - margin, bottom = safe.bottom + margin;
    var strength = B.smooth(top - band, top, r.top + r.height + 26) * (1 - B.smooth(bottom, bottom + band, r.top)) * (safe.strength === undefined ? 1 : safe.strength);
    var left = r.left + r.width / 2 < w / 2 ? Math.min(r.left, safe.left - padding - r.width) : Math.max(r.left, safe.left + safe.width + padding);
    return { left: B.mix(r.left, left, strength), top: r.top, width: r.width, height: r.height };
  };
  B.groups.forEach(function (g, n) {
    g.projects = B.projects.map(function (p, i) { return p.section === g.id && p.sceneFeatured !== false ? i : -1; }).filter(function (i) { return i >= 0; }).sort(function (a, b) {
      var authored = (B.projects[a].sceneOrder ?? 999) - (B.projects[b].sceneOrder ?? 999);
      return authored || B.projects[b].year - B.projects[a].year || a - b;
    });
    var years = g.projects.map(function (i) { return B.projects[i].year; });
    g.years = Math.max.apply(null, years) + '–' + Math.min.apply(null, years);
    g.start = n * B.timing.group; g.end = g.start + B.timing.group; g.center = (g.start + g.end) / 2;
  });
  B.featured = B.groups.reduce(function (ids, g) { return ids.concat(g.projects); }, []);
  B.archived = B.projects.map(function (_, i) { return i; }).filter(function (i) { return B.featured.indexOf(i) < 0; });
  B.duration = B.groups.length * B.timing.group + B.timing.exit;
  // Mobile uses the semantic HTML chapters; desktop keeps the perspective compositions.
  B.configureViewport = function () {
    var mobile = innerWidth <= 700, changed = B.nativeMobile !== mobile;
    B.nativeMobile = mobile;
    B.mobilePilot = false;
    document.body.classList.toggle('scene-native-mobile', mobile);
    var start = 0;
    B.groups.forEach(function (g, i) {
      g.start = start;
      g.end = start + B.timing.group;
      g.center = start + B.timing.group / 2;
      start = g.end;
    });
    B.duration = start + B.timing.exit;
    return changed;
  };
  B.configureViewport();
  // Spatial easing, not another scroll smoother: identical input always yields identical output.
  // Each overview is a slow reading beat; boundaries carry the transition momentum.
  // One mapping moves every real card and its copy, preserving inter-chapter clearance.
  B.presentationTravel = function (travel) {
    var length = B.timing.group, strength = B.clamp(B.motion.rhythmStrength, 0, .95);
    var end = B.groups[B.groups.length - 1].end;
    if (B.mobilePilot && travel < B.groups[0].end) return travel;
    var origin = B.mobilePilot ? B.groups[1].start : 0;
    if (travel <= end) return travel + strength * length / (2 * Math.PI) * Math.sin(2 * Math.PI * (travel - origin) / length);
    var u = B.clamp((travel - end) / B.timing.exit, 0, 1);
    // Join the last fast boundary smoothly to the natural document exit; no trailing spacer.
    return travel + strength * B.timing.exit * u * (1 - u) * (1 - u);
  };
  // Every card AND its chapter copy share this transform, centered on the composition.
  // The reading interval holds 1:1; no per-card entrance tweens or scale resets at boundaries.
  B.chapterTransform = function (group, state) {
    if (B.mobilePilot && group === B.groups[0]) return { scale: 1, offset: (group.center - state.travel) * B.motion.desktop };
    var read = B.motion.readingHalfWidth;
    var enter = B.smooth(group.start - .25, group.center - read, state.travel);
    var leave = B.smooth(group.center + read, group.end + .22, state.travel);
    return {
      scale: B.mix(B.motion.chapterInScale, 1, enter) + (B.motion.chapterOutScale - 1) * leave,
      offset: (group.center - state.motionTravel) * B.motion.desktop
    };
  };
  B.sample = function (travel) {
    var motionTravel = B.presentationTravel(travel);
    var group = B.groups.find(function (g) { return travel < g.end; }) || B.groups[B.groups.length - 1], weights = {};
    B.groups.forEach(function (g, i) {
      var enter = i ? B.smooth(g.start - B.timing.groupBlend, g.start + B.timing.groupBlend, motionTravel) : 1;
      var leave = i < B.groups.length - 1 ? 1 - B.smooth(g.end - B.timing.groupBlend, g.end + B.timing.groupBlend, motionTravel) : 1;
      weights[g.id] = enter * leave;
    });
    return { travel: travel, motionTravel: motionTravel, group: group, groupIndex: B.groups.indexOf(group), weights: weights, focused: -1,
      exit: B.smooth(B.groups[B.groups.length - 1].center + B.motion.readingHalfWidth, B.duration - B.timing.exit, travel) };
  };
})();
