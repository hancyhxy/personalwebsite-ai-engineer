/* Texture-free decorative canvases. Separate instances, no project identities or raycasting. */
(function () {
  'use strict';
  var B = window.BadgeScene;
  B.Background = function (scene, rig) {
    this.rig = rig; this.count = 40;
    this.geometry = new THREE.PlaneBufferGeometry(1, 1);
    this.material = new THREE.MeshBasicMaterial({ color: 0xe4e5e1, transparent: true, opacity: .42, depthWrite: false, toneMapped: false });
    this.mesh = new THREE.InstancedMesh(this.geometry, this.material, this.count);
    this.mesh.frustumCulled = false; this.mesh.renderOrder = 0;
    this.dummy = new THREE.Object3D(); this.mesh.userData.decorative = true; scene.add(this.mesh);
  };
  B.Background.prototype.update = function (state, alpha, readingRect) {
    var aspect = this.rig.width / this.rig.height, mobile = this.rig.width < 700;
    this.mesh.count = mobile ? 20 : this.count;
    this.material.opacity = (B.mobilePilot ? B.mix(.42, .26, state.weights.independent) : .42) * alpha;
    for (var i = 0; i < this.mesh.count; i++) {
      var column = i % 4, row = Math.floor(i / 4), z = -1 - (i % 3) * 1.1;
      var cycle = mobile ? 8 : 14, y = ((row * (mobile ? 1.6 : 1.45) + state.travel * B.worldTravel(mobile) + cycle / 2) % cycle + cycle) % cycle - cycle / 2;
      var nx = [-.54, -.32, .32, .54][column];
      var x = nx * 4.14 * aspect + Math.sin(i * 3.7) * .12;
      var width = .3 + (i % 4) * .12, ratio = [1, .75, 1.25, 16 / 9, .667][i % 5];
      this.dummy.position.set(x, y, z); this.dummy.scale.set(width, width / ratio, 1);
      var r = this.rig.rect(this.dummy, true);
      var protectedRect = B.protectReading(r, readingRect, this.rig.width, this.rig.height);
      if (protectedRect.left !== r.left) this.rig.placeRect(this.dummy, protectedRect, z, true);
      this.dummy.updateMatrix(); this.mesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  };
  B.Background.prototype.dispose = function () { this.geometry.dispose(); this.material.dispose(); };
})();
