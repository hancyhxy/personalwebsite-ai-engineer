/* Persistent project identities. No duplicated clickable ghosts, no washed foreground shader. */
(function () {
  'use strict';
  var B = window.BadgeScene;
  B.Field = function (scene, rig) {
    this.rig = rig; this.items = []; this.geometry = new THREE.PlaneBufferGeometry(1, 1);
    this.opening = { active: document.documentElement.classList.contains('opening-pending'), wave: 0, gather: 0, land: 0, size: 0, alpha: 0 };
    this.openingLayout = { span: .3, center: 0, stackSpan: .09, stackAmplitude: .035, amplitude: .115, offset: .04, thumb: 88 };
    var loader = new THREE.TextureLoader(), promises = [];
    B.projects.forEach(function (project, index) {
      var group = B.groups.find(function (g) { return g.projects.indexOf(index) >= 0; });
      var resolve;
      promises.push(new Promise(function (r) { resolve = r; }));
      var texture = group ? loader.load(project.thumb, function () { resolve(true); }, undefined, function () { resolve(false); }) : null;
      if (texture) { texture.encoding = THREE.sRGBEncoding; texture.minFilter = THREE.LinearFilter; } else resolve(true);
      var material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
      var mesh = new THREE.Mesh(this.geometry, material);
      mesh.userData = { index: index, project: project, hover: 1 };
      scene.add(mesh);
      this.items.push({ index: index, project: project, group: group, featured: Boolean(group), local: group ? group.projects.indexOf(index) : -1, mesh: mesh, rect: { left: 0, top: 0, width: 0, height: 0 }, owner: 'mesh', opacity: 0 });
    }, this);
    this.texturesReady = Promise.all(promises);
  };
  B.Field.prototype.pose = function (item, state) {
    var slots = item.group.id === 'experimental' ? [[.50,.20,.30],[.26,.78,.23],[.74,.78,.22]] :
      [[.235,.20,.255],[.765,.20,.235],[.235,.78,.23],[.765,.78,.235]];
    var slot = slots[item.local], activeZ = B.motion.nearZ;
    // Scale the full authored composition around its center, not individual card centers.
    var transform = B.chapterTransform(item.group, state), scale = transform.scale;
    var z = activeZ;
    var height = 2 * (B.motion.cameraZ - activeZ) * Math.tan(Math.PI / 8), unit = height / this.rig.height;
    var width = Math.min(this.rig.width * slot[2], this.rig.height * (item.group.id === 'experimental' && item.local === 0 ? .44 : .36));
    if (B.mobilePilot && item.group === B.groups[0] && B.mobileComposition) {
      var layout = B.mobileComposition;
      // Alternate restrained lateral offsets; every real image can be read in full.
      return { x: (item.local % 2 ? -.075 : -.035) * this.rig.width * unit,
        y: (this.rig.height / 2 - layout.firstY - item.local * layout.gap - transform.offset * this.rig.height) * unit,
        z: z, width: layout.width * unit, scale: 1 };
    }
    return { x: (slot[0] - .5) * this.rig.width * unit * scale,
      y: ((.5 - slot[1]) * scale - transform.offset) * height,
      z: z, width: width * unit * scale, scale: scale };
  };
  B.Field.prototype.update = function (state, work, readingRect, dt, safeRect) {
    safeRect = safeRect || readingRect;
    var o = this.opening, w = this.rig.width, h = this.rig.height, layout = this.openingLayout;
    this.items.forEach(function (item) {
      var mesh = item.mesh;
      if (!item.featured) { mesh.visible = false; item.opacity = 0; return; }
      var pose = this.pose(item, state);
      item.sceneScale = pose.scale;
      mesh.visible = true; item.owner = 'mesh';
      mesh.position.set(pose.x, pose.y, pose.z);
      mesh.scale.set(pose.width, pose.width / (16 / 9), 1);
      var workRect = this.rig.rect(mesh, true);
      // Spacing between authored rows also protects copy across chapter boundaries.
      // Collective zoom preserves internal spacing; only decorations use exclusion steering.
      var identityRect = workRect;
      var groupAlpha = B.mix(.16, 1, state.weights[item.group.id]);
      item.opacity = work * groupAlpha;
      if (o.active) {
        var order = B.featured.indexOf(item.index), t = order / (B.featured.length - 1);
        var stackX = (t - .5) * Math.min(w * layout.stackSpan, 130), stackY = Math.sin(t * Math.PI * 2) * h * layout.stackAmplitude + h * .04;
        var waveT = layout.points ? layout.points[order] : t;
        // Rotate the curve's travel axis on phones, not the image planes themselves.
        var waveX = layout.vertical ? -Math.sin(waveT * Math.PI * 2) * w * layout.amplitude : (waveT - .5) * w * layout.span + w * layout.center;
        var waveY = layout.vertical ? (.5 - waveT) * h * layout.span + h * layout.offset : Math.sin(waveT * Math.PI * 2) * h * layout.amplitude + h * layout.offset;
        var x = B.mix(stackX, waveX, o.wave), y = B.mix(stackY, waveY, o.wave);
        var radius = Math.sqrt(t) * Math.min(w * .105, h * .14), angle = order * 2.399963;
        x = B.mix(x, Math.cos(angle) * radius, o.gather); y = B.mix(y, Math.sin(angle) * radius * .72 + h * .04, o.gather);
        var thumb = Math.min(layout.thumb, w * .23);
        var intro = { left: w / 2 + x - thumb / 2, top: h / 2 - y - thumb / (16 / 9) / 2, width: thumb, height: thumb / (16 / 9) };
        // One progress for position AND proportional scale, through the same projection.
        this.rig.placeRect(mesh, B.mixRect(intro, identityRect, o.land), B.mix(0, pose.z, o.land * work), true);
        item.opacity = o.alpha * (1 - o.land);
      }
      var hoverTarget = mesh.userData.hoverTarget ? 1.055 : 1;
      mesh.userData.hover += (hoverTarget - mesh.userData.hover) * (1 - Math.exp(-dt * 12));
      mesh.scale.multiplyScalar(mesh.userData.hover);
      mesh.material.opacity = item.opacity;
      mesh.renderOrder = o.active ? 10 + B.featured.indexOf(item.index) : item.group.id === state.group.id ? 3 : 1;
      item.rect = this.rig.rect(mesh);
    }, this);
  };
  B.Field.prototype.dispose = function () {
    this.items.forEach(function (i) { if (i.mesh.material.map) i.mesh.material.map.dispose(); i.mesh.material.dispose(); }); this.geometry.dispose();
  };
})();
