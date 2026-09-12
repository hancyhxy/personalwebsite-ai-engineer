/* A real perspective camera; pointer spring changes the lens, not each artwork's world pose. */
(function () {
  'use strict';
  var B = window.BadgeScene;
  B.CameraRig = function () {
    this.camera = new THREE.PerspectiveCamera(45, 1, .1, 60);
    this.base = new THREE.PerspectiveCamera(45, 1, .1, 60);
    this.pointer = { x: 0, y: 0 };
    this.spring = { x: 0, y: 0, vx: 0, vy: 0 };
    this.width = innerWidth; this.height = innerHeight;
    this.resize(); this.update(0, 0, 0);
  };
  B.CameraRig.prototype.resize = function () {
    this.width = innerWidth; this.height = innerHeight;
    this.camera.aspect = this.base.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix(); this.base.updateProjectionMatrix();
  };
  B.CameraRig.prototype.update = function (dt, work, motion) {
    var s = this.spring, target = this.pointer;
    // Stable semi-implicit spring, including low-frame-rate and resumed-tab paths.
    var steps = Math.max(1, Math.ceil(dt / .008)), step = dt / steps;
    for (var i = 0; i < steps; i++) {
      s.vx += (100 * (target.x * motion - s.x) - 30 * s.vx) * step;
      s.vy += (100 * (target.y * motion - s.y) - 30 * s.vy) * step;
      s.x += s.vx * step; s.y += s.vy * step;
    }
    var z = B.mix(5, B.motion.cameraZ, work);
    this.base.position.set(0, 0, z); this.base.updateMatrixWorld();
    this.camera.position.set(s.x, s.y, z); this.camera.updateMatrixWorld();
  };
  B.CameraRig.prototype.rect = function (mesh, neutral) {
    mesh.updateWorldMatrix(true, false);
    var camera = neutral ? this.base : this.camera;
    var points = [[-.5, -.5], [.5, -.5], [.5, .5], [-.5, .5]].map(function (p) {
      return new THREE.Vector3(p[0], p[1], 0).applyMatrix4(mesh.matrixWorld).project(camera);
    });
    var xs = points.map(function (p) { return (p.x + 1) * this.width / 2; }, this);
    var ys = points.map(function (p) { return (1 - p.y) * this.height / 2; }, this);
    var left = Math.min.apply(null, xs), top = Math.min.apply(null, ys);
    return { left: left, top: top, width: Math.max.apply(null, xs) - left, height: Math.max.apply(null, ys) - top };
  };
  B.CameraRig.prototype.placeRect = function (mesh, rect, z, neutral) {
    var camera = neutral ? this.base : this.camera;
    var distance = camera.position.z - z;
    var worldHeight = 2 * distance * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    var unit = worldHeight / this.height;
    mesh.position.set(camera.position.x + (rect.left + rect.width / 2 - this.width / 2) * unit,
      camera.position.y + (this.height / 2 - rect.top - rect.height / 2) * unit, z);
    mesh.scale.set(rect.width * unit, rect.height * unit, 1);
  };
  B.mixRect = function (a, b, t) {
    return { left: B.mix(a.left, b.left, t), top: B.mix(a.top, b.top, t), width: B.mix(a.width, b.width, t), height: B.mix(a.height, b.height, t) };
  };
})();
