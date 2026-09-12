'use strict';

/* One persistent set of project objects shared by opening, hero and story. */
window.BADGE_PROJECT_FIELD=(async()=>{
  const response=await fetch('content/gallery.json');
  if(!response.ok)throw Error('Project collection unavailable');
  const projects=(await response.json()).slice(0,16);
  const layer=document.createElement('div');
  layer.className='portfolio-object-layer';
  layer.id='portfolio-object-layer';
  layer.setAttribute('aria-hidden','true');
  document.body.append(layer);

  const priority=new Set([3,4,5,7]);
  const cards=projects.map((project,index)=>{
    const slug=project.projectUrl.split('/')[1];
    const link=document.createElement('a');
    link.className='portfolio-object work-story-card';
    link.href=new URL(project.projectUrl,'https://xyhan.com/').href;
    link.target='_blank';
    link.rel='noopener noreferrer';
    link.tabIndex=-1;
    link.setAttribute('aria-label',`${project['project name']} — open case study`);
    const inner=document.createElement('span');
    inner.className='work-story-card-inner';
    const image=document.createElement('img');
    image.src=`assets/images/thumbs/${slug}-thumb.jpg`;
    image.alt='';
    image.width=320;
    image.height=240;
    image.loading='eager';
    image.decoding='async';
    const shade=document.createElement('span');
    shade.className='work-story-card-shade';
    const copy=document.createElement('span');
    copy.className='work-story-card-copy';
    const title=document.createElement('h3');
    title.textContent=project['project name'];
    const meta=document.createElement('p');
    meta.textContent=`${project.company==='-'?'Independent':project.company} · ${project.date.slice(0,4)}`;
    copy.append(title,meta);
    inner.append(image,shade,copy);
    link.append(inner);
    layer.append(link);
    return{el:link,image,project,index,slug,priority:priority.has(index)};
  });

  const curveFor=(index,width=innerWidth,height=innerHeight)=>{
    const t=index/Math.max(1,cards.length-1);
    // Getty's intro source uses a linear horizontal run plus sin(t * 2π) for its wave.
    const x=(t-.5)*Math.min(width*.82,1120);
    const y=Math.sin(t*Math.PI*2)*Math.min(height*.13,105);
    const z=-(index%2)*95-Math.abs(index-(cards.length-1)/2)*7;
    const rotate=Math.cos(t*Math.PI*2)*-7;
    return{x,y,z,rotate};
  };

  function setCurve({visible=true}={}){
    layer.hidden=false;
    layer.classList.add('is-visible');
    cards.forEach(card=>{
      const pose=curveFor(card.index);
      card.curve=pose;
      card.el.style.transform=`translate3d(calc(-50% + ${pose.x}px),calc(-50% + ${pose.y}px),${pose.z}px) rotate(${pose.rotate}deg) scale(1)`;
      card.el.style.setProperty('--card-opacity',String(visible?(card.priority?.88:.5):0));
      card.el.style.setProperty('--card-copy-opacity','0');
      card.el.dataset.focus='false';
      card.el.tabIndex=-1;
    });
  }

  function hide(){layer.classList.remove('is-visible');layer.setAttribute('aria-hidden','true')}
  await Promise.race([Promise.all(cards.map(card=>card.image.decode().catch(()=>{}))),new Promise(resolve=>setTimeout(resolve,900))]);
  if(!document.documentElement.classList.contains('opening-pending')&&innerWidth>800)setCurve();
  return{layer,cards,projects,curveFor,setCurve,hide};
})().catch(error=>{console.error('[project field]',error);return null});
