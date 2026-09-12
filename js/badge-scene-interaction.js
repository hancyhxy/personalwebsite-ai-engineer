/* Projected native links navigate directly; Flip + Zoom is an optional visual enhancement. */
(function () {
  'use strict';
  var B = window.BadgeScene;
  B.Interaction = function (runtime) {
    this.runtime = runtime; this.pointer = new THREE.Vector2(4,4); this.raycaster = new THREE.Raycaster();
    this.selected = -1; this.entering = false; this.flight = false; this.links = []; this.keyboardHover = -1;
    B.projects.forEach(function (project,i) {
      var link = document.createElement('a'); link.className = 'scene-project-hit'; link.href = './project-scrollcarousel.html?project='+i;
      link.setAttribute('aria-label','View '+project.title); link.hidden = true; link.dataset.group = project.section;
      var label = document.createElement('span'); label.className = 'scene-project-label'; label.textContent = project.title+(project.sceneNote ? ' · Concept' : ''); link.append(label);
      link.addEventListener('click',function(e){
        if(e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault(); this.open(i,link);
      }.bind(this));
      link.addEventListener('focus',function(){this.keyboardHover=i;}.bind(this));
      link.addEventListener('blur',function(){this.keyboardHover=-1;}.bind(this));
      runtime.overlay.append(link); this.links.push(link);
    },this);
    this.onPointer = function(e){
      if(e.pointerType !== 'mouse') return;
      var ui = e.target.closest('a:not(.scene-project-hit),button,iframe,.badge,.project-flip-layer');
      this.pointer.set(ui ? 4 : e.clientX/innerWidth*2-1,ui ? 4 : 1-e.clientY/innerHeight*2);
      runtime.rig.pointer.x=e.clientX/innerWidth*2-1; runtime.rig.pointer.y=1-e.clientY/innerHeight*2;
    }.bind(this);
    this.reset = function(){this.pointer.set(4,4);runtime.rig.pointer.x=runtime.rig.pointer.y=0;}.bind(this);
    addEventListener('pointermove',this.onPointer,{passive:true}); addEventListener('blur',this.reset);
    document.documentElement.addEventListener('pointerleave',this.reset);
  };
  B.Interaction.prototype.open = function(index,source){
    if(this.entering || !B.projects[index]) return;
    this.selected=index;
    var href='./project-scrollcarousel.html?project='+index;
    if(window.BadgeNavigation) BadgeNavigation.open(href,source || this.links[index]); else location.href=href;
  };
  B.Interaction.prototype.update = function(items,interactive){
    var rt=this.runtime;
    var canHover=interactive && Math.abs(B.scroll.velocity)<12 && !this.entering && !(window.ProjectFlip && ProjectFlip.busy);
    this.raycaster.setFromCamera(this.pointer,rt.rig.camera);
    var candidates=items.filter(function(item){return item.mesh.visible && item.opacity>.55 && item.owner==='mesh';});
    var hits=canHover ? this.raycaster.intersectObjects(candidates.map(function(i){return i.mesh;})) : [];
    var hit=hits[0] ? hits[0].object.userData.index : -1;
    items.forEach(function(item,index){
      var r=item.rect,a=this.links[index];
      var visible=interactive && !this.entering && item.owner==='mesh' && item.opacity>.55 && r.top+r.height>0 && r.top<innerHeight && r.left+r.width>0 && r.left<innerWidth;
      a.hidden=!visible;
      if(visible){a.style.setProperty('--scene-project-scale',item.sceneScale || 1);a.style.transform='translate3d('+r.left+'px,'+r.top+'px,0)';a.style.width=r.width+'px';a.style.height=r.height+'px';}
      item.mesh.userData.hoverTarget=canHover && (index===hit || index===this.keyboardHover);
    },this);
  };
  B.Interaction.prototype.dispose = function(){
    removeEventListener('pointermove',this.onPointer); removeEventListener('blur',this.reset);
    document.documentElement.removeEventListener('pointerleave',this.reset);
  };
})();
