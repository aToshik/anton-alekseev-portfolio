/* Product Orbit: interactive hero scene (canvas). Markup: #hero > canvas#poCanvas + .card-info#poInfo. Styles: orbit.css */
(() => {
'use strict';
const hero=document.getElementById('hero'), cv=document.getElementById('poCanvas'); if(!hero||!cv) return; const ctx=cv.getContext('2d');
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const PAL={ dark:{panel:'#141714',fg:'#f0f2ea',label:'#8e948a',accent:'#83de72'},
            light:{panel:'#ffffff',fg:'#14160f',label:'#6f7568',accent:'#4ea832'} };
const layoutMode='left', planetMode='wire';
const themeOf=()=>document.documentElement.getAttribute('data-theme')==='light'?'light':'dark';
const MONO='"DM Mono", ui-monospace, SFMono-Regular, Menlo, monospace';

// ---- two galaxies: how I ship / what it changes
const GALAXIES={
  impact:{ title:'Impact', orbits:[
    {name:'Interface', q:'one screen', speed:.15, r:1.75, tx:1.05, rz:-.18},
    {name:'Product', q:'the whole flow', speed:.1, r:2.7, tx:1.14, rz:.34},
    {name:'Team', q:'how others work', speed:.075, r:3.65, tx:1.1, rz:-.42},
    {name:'Business', q:'what the numbers show', speed:.055, r:4.6, tx:1.2, rz:.12}],
   objs:[
    {id:'experience',o:0,label:'Experience',text:'How the product feels as a whole: calm and predictable.',rel:['confidence','adoption']},
    {id:'clarity',o:0,label:'Clarity',text:'At a glance it is clear what is going on and what to do next.',rel:['guidelines','self-service'],kase:'Channel Analysis'},
    {id:'usability',o:0,label:'Usability',text:'A complex task gets done fast and without mistakes.',rel:['design-system','adoption']},
    {id:'impact',o:1,label:'Impact',text:'The solution changes how people work, not just a screen.',rel:['outcomes','experience']},
    {id:'confidence',o:1,label:'Confidence',text:'Users trust the numbers and recommendations because they can see where they come from.',rel:['experience','outcomes'],kase:'Price Exploration'},
    {id:'self-service',o:1,label:'Self-service',text:'Customers get it done on their own, without support or an account manager.',rel:['clarity','scale'],kase:'Cross-Campaign Management'},
    {id:'governance',o:2,label:'Governance',text:'It is clear who changes the system and how, so it does not sprawl.',rel:['guidelines','scale']},
    {id:'guidelines',o:2,label:'Guidelines',text:'Rules that let the team make the same calls without a designer.',rel:['clarity','governance']},
    {id:'design-system',o:2,label:'Design System',text:'The components and tokens every screen is built from.',rel:['usability','scale'],kase:'Design System for AI Agents'},
    {id:'adoption',o:3,label:'Adoption',text:'Features get used, not just shipped.',rel:['usability','experience']},
    {id:'scale',o:3,label:'Scale',text:'The solution works for thousands of customers, not just one.',rel:['self-service','design-system']},
    {id:'outcomes',o:3,label:'Outcomes',text:'A measurable result: time, money, support tickets.',rel:['impact','confidence']}]},
};
// case pages that exist in the prototype; the rest show as "coming soon"
const CASE_URL={'Channel Analysis':'../case/channel-analysis/','Price Exploration':'../case/price-exploration/','Design System for AI Agents':'../case/design-system/'};
let ORBITS=[], OBJ=[], byId={}, LBL=[];
function loadGalaxy(key){
  const g=GALAXIES[key]; ORBITS=g.orbits; OBJ=g.objs; byId=Object.fromEntries(OBJ.map(o=>[o.id,o])); LBL=ORBITS.map(()=>null);
  OBJ.forEach(o=>{ const sib=OBJ.filter(x=>x.o===o.o); if(o.theta==null) o.theta=sib.indexOf(o)/sib.length*Math.PI*2+o.o*1.3+.5; o.x=o.y=o.z=0; o.k=1; o.lab=0; });
}
loadGalaxy('impact');

// ---- geometry
let W=0,H=0,dpr=1,C={x:0,y:0},Rp=0;
const R=i=>ORBITS[i].r*Rp;
let depthOn=true, cursorMark=false, idleOrb=false, idleObj=false, radObj=60, radOrb=80, showRel=false, glowMode='trail', glowAmt=0; const GLOW_R=120; const tilt={x:0,z:0};
function project(orb,r,th){
  let x=r*Math.cos(th), y=r*Math.sin(th);
  const tx=orb.tx+tilt.x, rz=orb.rz+tilt.z;
  const z=y*Math.sin(tx); y=y*Math.cos(tx);
  const c=Math.cos(rz), s=Math.sin(rz);
  // perspective: the near side of the ring comes toward the viewer and grows
  const k=depthOn?(Rp*18)/(Rp*18-z):1;
  return {x:C.x+(x*c-y*s)*k, y:C.y+(x*s+y*c)*k, z:z/r, k};
}
let domCache=null, domAge=0; // hero copy rects, see domRects()
function layout(){ domCache=null; if(shown) measureCard();
  const r=hero.getBoundingClientRect(); W=r.width; H=r.height; dpr=Math.min(2,devicePixelRatio||1);
  cv.width=Math.round(W*dpr); cv.height=Math.round(H*dpr);
  if(W<700){ // stacked: the system sits in the free band between the eyebrow and the name
    const eb=hero.querySelector('.hero-eyebrow').getBoundingClientRect(), nm=hero.querySelector('h1').getBoundingClientRect();
    const top=eb.bottom-r.top+12, bot=nm.top-r.top-12; C={x:W*.5,y:(top+bot)/2}; Rp=Math.max(18,Math.min(W*.1,(bot-top)*.16)); }
  else if(layoutMode==='chip'){ C={x:W*.5,y:H*.46}; Rp=Math.min(W*.075,H*.125); }
  else { const v=hero.dataset; // a composition can move the system: data-cx/cy (share of W/H), data-rw/rh (planet radius caps)
    C={x:W*(+v.cx||.665),y:H*(+v.cy||.47)}; Rp=Math.min(W*(+v.rw||.058),H*(+v.rh||.105)); }
  placeLabels();
}
function placeLabels(){
  ctx.font=`400 10px ${MONO}`; const minX=W>=700?(hero.dataset.minx?W*+hero.dataset.minx:layoutMode==='left'?W*.44:12):12, maxX=W>=700&&hero.dataset.maxx?W*+hero.dataset.maxx:W-12; const chosen=[], dom=domRects(); // orbit names also keep clear of the hero copy
  ORBITS.map((_,i)=>i).reverse().forEach(i=>{ let best=-1, bestA=null, bestBox=null; const tw=labW('Orbit',ORBITS[i].name);
    for(let a=0;a<Math.PI*2;a+=.04){ const p=project(ORBITS[i],R(i),a); if(p.z<.25) continue;
      const dx=p.x-C.x, dy=p.y-C.y, d=Math.hypot(dx,dy); if(d<Rp*1.35) continue;
      const ux=dx/d, uy=dy/d, ex=p.x+ux*(40+i*8), ey=p.y+uy*(40+i*8); const x0=ux>=0?ex+12:ex-12-tw;
      if(x0<minX||x0+tw>maxX||ey<30||ey>H-30) continue; if(dom.some(d=>hit(d,{x:x0-4,y:ey-16,w:tw+8,h:30}))) continue;
      const qx=Math.max(x0,Math.min(C.x,x0+tw)), qy=Math.max(ey-14,Math.min(C.y,ey+14)); if(Math.hypot(qx-C.x,qy-C.y)<Rp*1.2) continue;
      const cx=x0+tw/2; if(chosen.some(c=>Math.abs(c.x-cx)<(c.w+tw)/2+16&&Math.abs(c.y-ey)<40)) continue; let sc=chosen.length?Math.min(...chosen.map(c=>Math.hypot((c.x-cx)/1.6,c.y-ey))):300; sc=Math.min(sc,260)+uy*20;
      if(sc>best){best=sc; bestA=a; bestBox={x:cx,y:ey,w:tw};} }
    LBL[i]=bestA; if(bestA===null) return; chosen.push(bestBox); });
}
const smooth=(a,b,x)=>{ const t=Math.min(1,Math.max(0,(x-a)/(b-a))); return t*t*(3-2*t); };

// ---- pointer
const mouse={x:0,y:0}, target={x:0,y:0};
let real=false, touch=false, hover=-1, hoverRing=-1, sel=-1;
hero.addEventListener('pointermove',e=>{ const r=hero.getBoundingClientRect(); target.x=e.clientX-r.left; target.y=e.clientY-r.top; real=true; });
hero.addEventListener('pointerdown',e=>{ touch=e.pointerType!=='mouse'; const r=hero.getBoundingClientRect(); target.x=e.clientX-r.left; target.y=e.clientY-r.top; real=true; });
// touch: the tap point stays as a resting "cursor" (labels near it, orbit under it), until the next tap
hero.addEventListener('pointerleave',e=>{ if(e.pointerType!=='mouse') return; real=false; hover=-1; hoverRing=-1; });
function pick(x,y){ let k=-1, best=touch?30:18; OBJ.forEach((o,i)=>{ const d=Math.hypot(o.x-x,o.y-y); if(d<best&&!(o.z<0&&Math.hypot(o.x-C.x,o.y-C.y)<Rp)){best=d; k=i;} }); return k; }
hero.addEventListener('click',e=>{ if(e.target.closest('.card-info, .gal')) return;
  if(String(getSelection())) return; // the visitor was selecting text, not picking an object
  const r=hero.getBoundingClientRect(), k=pick(e.clientX-r.left,e.clientY-r.top); sel=k>=0?(sel===k?-1:k):-1; });
document.getElementById('poX').addEventListener('click',()=>{ sel=-1; });
addEventListener('keydown',e=>{ if(e.key==='Escape') sel=-1; });

// ---- drawing helpers
function brackets(x,y,s,len,col,a,sy){ sy=sy||s; ctx.strokeStyle=col; ctx.globalAlpha=a; ctx.lineWidth=1; ctx.beginPath();
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([u,v])=>{ const cx=x+u*s, cy=y+v*sy; ctx.moveTo(cx-u*len,cy); ctx.lineTo(cx,cy); ctx.lineTo(cx,cy-v*len); }); ctx.stroke(); }
const DISP='"Manrope", -apple-system, "Segoe UI", sans-serif';
const SUBF=`400 9px ${MONO}`, NAMEF=`600 13px ${DISP}`;
// text widths never change, but setting ctx.font re-parses the font every call: measure once per string
const labCache=new Map();
if(document.fonts) document.fonts.ready.then(()=>labCache.clear());
function labW(sub,name){ const key=sub+'|'+name; let w=labCache.get(key); if(w===undefined){ w=measureLab(sub,name); labCache.set(key,w); } return w; }
function measureLab(sub,name){ if(!sub){ ctx.font=NAMEF; return ctx.measureText(name).width; } ctx.font=SUBF; const a=ctx.measureText(sub.toUpperCase()).width+sub.length*1.2; ctx.font=NAMEF; return Math.max(a,ctx.measureText(name).width); }
// two-line tag: quiet uppercase subtitle above, the name emphasised below
function label2(sub,name,x,y,al,colName,colSub){
  ctx.textBaseline='middle';
  if(!sub){ ctx.font=NAMEF; ctx.globalAlpha=al; ctx.fillStyle=colName; ctx.fillText(name,x,y); return; }
  ctx.font=SUBF; ctx.letterSpacing='1.2px'; ctx.globalAlpha=al*.75; ctx.fillStyle=colSub; ctx.fillText(sub.toUpperCase(),x,y-8);
  ctx.letterSpacing='0px'; ctx.font=NAMEF; ctx.globalAlpha=al; ctx.fillStyle=colName; ctx.fillText(name,x,y+6);
}
// canvas cost is per draw call, not per segment: group segments of similar alpha into a few paths
const paths=n=>Array.from({length:n},()=>new Path2D());
const bucket=(v,n)=>Math.max(0,Math.min(n-1,Math.floor(v*n)));
function rotP(x,y,a){ const c=Math.cos(a), s=Math.sin(a); return [x*c-y*s, x*s+y*c]; }
const VT=.42; function view(x,y,z){ const c=Math.cos(VT), s=Math.sin(VT); return [x, y*c-z*s, y*s+z*c]; }

function drawRing(P,i,t,hot,dimmed){
  const orb=ORBITS[i], r=R(i), N=220, buckets=Array.from({length:8},()=>new Path2D());
  const base=hot?.7:.34, k=dimmed?.55:1;
  const gb=Array.from({length:4},()=>new Path2D()), gOn=glowMode==='orbits'||glowMode==='both', dots=paths(6);
  let prev=project(orb,r,0);
  for(let s=1;s<=N;s++){
    const p=project(orb,r,s/N*Math.PI*2); const zf=(p.z+prev.z)/2; const f=smooth(-.35,.35,zf);
    const hidden=zf<0&&Math.hypot((p.x+prev.x)/2-C.x,(p.y+prev.y)/2-C.y)<Rp;
    if(!hidden){
      if(f>.03){ const b=Math.min(7,Math.floor(f*8)); buckets[b].moveTo(prev.x,prev.y); buckets[b].lineTo(p.x,p.y); }
      if(gOn){ const g=glowAmt*Math.exp(-((Math.hypot((p.x+prev.x)/2-mouse.x,(p.y+prev.y)/2-mouse.y)/GLOW_R)**2))*(.35+.65*f);
        if(g>.04){ const b=Math.min(3,Math.floor(g*4)); gb[b].moveTo(prev.x,prev.y); gb[b].lineTo(p.x,p.y); } }
      if(f<.97&&s%2===0) dots[bucket(1-f,6)].rect(p.x-.6,p.y-.6,1.2,1.2);
    }
    prev=p;
  }
  ctx.fillStyle=hot?P.accent:P.fg; dots.forEach((path,b)=>{ ctx.globalAlpha=(b+.5)/6*.3*k*(hot?1.6:1); ctx.fill(path); });
  ctx.strokeStyle=hot?P.accent:P.fg;
  buckets.forEach((path,b)=>{ const f=(b+.5)/8; ctx.globalAlpha=f*base*k; ctx.lineWidth=.8+f*.4; ctx.stroke(path); });
  if(gOn){ ctx.strokeStyle=P.accent; ctx.lineCap='round';
    gb.forEach((path,b)=>{ const g=(b+.5)/4*k; ctx.globalAlpha=.1*g; ctx.lineWidth=5; ctx.stroke(path); ctx.globalAlpha=.85*g; ctx.lineWidth=1.2; ctx.stroke(path); });
    ctx.lineCap='butt'; }
}
// glowing trail: the arc an object has just travelled, fading out behind it
function drawTrail(P,o){
  const orb=ORBITS[o.o], r=R(o.o), dir=Math.sign(orb.speed)||1, span=.6*(.25+.75*speed), N=16;
  let prev=project(orb,r,o.theta); const tb=paths(6);
  for(let j=1;j<=N;j++){ const p=project(orb,r,o.theta-dir*span*j/N);
    const zf=(p.z+prev.z)/2, behind=zf<0&&Math.hypot((p.x+prev.x)/2-C.x,(p.y+prev.y)/2-C.y)<Rp;
    if(!behind){ const a=(1-(j-1)/N)**1.7*(.4+.6*smooth(-.4,.4,zf));
      const path=tb[bucket(a,6)]; path.moveTo(prev.x,prev.y); path.lineTo(p.x,p.y); }
    prev=p; }
  ctx.strokeStyle=P.accent; ctx.lineCap='round';
  tb.forEach((path,b)=>{ const a=(b+.5)/6; ctx.globalAlpha=.12*a; ctx.lineWidth=6; ctx.stroke(path); ctx.globalAlpha=.8*a; ctx.lineWidth=1.4; ctx.stroke(path); });
  ctx.lineCap='butt'; ctx.globalAlpha=1;
}

function drawPlanet(P,t,Ls){
  const now=performance.now()/1000, base=Rp; const br=reduce?0:Math.sin(now*1.25);
  Rp=base*(1+.018*br);
  try{ drawPlanetBody(P,t,Ls);
    if(!reduce){ const ph=(now%4.2)/4.2; ctx.strokeStyle=P.accent; ctx.lineWidth=1; ctx.globalAlpha=.22*(1-ph)*(1-ph); ctx.beginPath(); ctx.arc(C.x,C.y,base*(1.02+ph*.38),0,7); ctx.stroke(); ctx.globalAlpha=1; }
  } finally { Rp=base; }
}
function drawPlanetBody(P,t,Ls){
  const ll=Math.hypot(Ls.x,Ls.y,Rp*1.6); const L={x:Ls.x/ll,y:Ls.y/ll,z:Rp*1.6/ll}; const rot=t*.16, tilt=-.32;
  ctx.globalAlpha=1; ctx.fillStyle=P.panel; ctx.beginPath(); ctx.arc(C.x,C.y,Rp,0,7); ctx.fill();
  ctx.lineWidth=1;
  const wb=paths(10);
  const seg=pts=>{ for(let i=1;i<pts.length;i++){ const a=pts[i-1], b=pts[i]; if(a[2]<0||b[2]<0) continue;
      const nl=Math.max(0,((a[0]+b[0])/2*L.x+(a[1]+b[1])/2*L.y+(a[2]+b[2])/2*L.z)/Rp);
      const path=wb[bucket(nl*nl,10)]; path.moveTo(C.x+a[0],C.y+a[1]); path.lineTo(C.x+b[0],C.y+b[1]); } };
  if(planetMode==='wire'){
    for(let k=0;k<9;k++){ const lon=k/9*Math.PI+rot; const pts=[];
      for(let j=0;j<=28;j++){ const lat=-Math.PI/2+j/28*Math.PI; let [x,y,z]=view(Rp*Math.cos(lat)*Math.sin(lon),Rp*Math.sin(lat),Rp*Math.cos(lat)*Math.cos(lon)); [x,y]=rotP(x,y,tilt); pts.push([x,y,z]); } seg(pts); }
    for(const lat of [-1.05,-.55,0,.55,1.05]){ const pts=[];
      for(let j=0;j<=44;j++){ const th=j/44*Math.PI*2; let [x,y,z]=view(Rp*Math.cos(lat)*Math.sin(th),Rp*Math.sin(lat),Rp*Math.cos(lat)*Math.cos(th)); [x,y]=rotP(x,y,tilt); pts.push([x,y,z]); } seg(pts); }
    ctx.strokeStyle=P.fg; wb.forEach((path,b)=>{ const v=(b+.5)/10; ctx.globalAlpha=.1+.55*v; ctx.stroke(path); });
  } else {
    for(let i=1;i<=3;i++){ ctx.globalAlpha=.12+i*.06; ctx.strokeStyle=P.fg; ctx.beginPath(); ctx.arc(C.x,C.y,Rp*i/3.2,0,7); ctx.stroke(); }
    ctx.globalAlpha=.9; ctx.fillStyle=P.accent; ctx.fillRect(C.x-2,C.y-2,4,4);
  }
  // limb: dim outline that turns green where it faces the viewer's cursor
  const la=Math.atan2(L.y,L.x), planar=Math.min(1,Math.hypot(L.x,L.y)*1.4);
  const lb=paths(8);
  for(let s=0;s<120;s++){ const a0=s/120*Math.PI*2, a1=(s+1)/120*Math.PI*2; const lit=Math.max(0,Math.cos((a0+a1)/2-la))**2*planar;
    const path=lb[bucket(lit,8)]; path.moveTo(C.x+Rp*Math.cos(a0),C.y+Rp*Math.sin(a0)); path.arc(C.x,C.y,Rp,a0,a1+.004); }
  lb.forEach((path,b)=>{ const lit=b?(b+.5)/8:0;
    ctx.strokeStyle=P.fg; ctx.globalAlpha=.32*(1-lit); ctx.lineWidth=1; ctx.stroke(path);
    if(b){ ctx.strokeStyle=P.accent; ctx.globalAlpha=lit*.95; ctx.lineWidth=1+lit*.6; ctx.stroke(path); } });
  ctx.lineWidth=1; ctx.globalAlpha=1;
}

const jobs=[];
function drawObj(P,o,k,prox,state){
  // state: 0 normal, 1 selected, 2 related, -1 dimmed
  const depth=.45+.55*smooth(-.4,.4,o.z);
  if(o.z<0&&Math.hypot(o.x-C.x,o.y-C.y)<Rp){ o.slot=-1; return; }
  const on=state>0||k===hover, fade=state<0?.35:1;
  const s=(on?8:6)*(depthOn?Math.pow(o.k,1.8):1);
  ctx.globalAlpha=depth*fade; ctx.fillStyle=on?P.accent:P.fg; ctx.fillRect(o.x-s/2,o.y-s/2,s,s);
  if(on) brackets(o.x,o.y,state===1?13:11,4,state>0?P.accent:P.fg,state>0?.95:.6);
  // label: visible by proximity, always for selected/related; placed later by layoutLabels()
  const want=on?1:Math.max(0,prox); o.lab+=(want-o.lab)*.15;
  const a=Math.max(prox<0?0:(idleObj?.5:0)*depth,o.lab)*depth*fade;
  if(a<.02){ o.slot=-1; return; }
  jobs.push({o,a,state,on,pri:(state>0?3:0)+(k===hover?2:0)+a});
}

// ---- label layout: no overlaps between labels, objects, the planet and the hero copy
const hit=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
const PAD=4, LH=18;
// candidate slots around an object: [dx, dy, anchor] where anchor 0 = text starts at x, 1 = text ends at x, .5 = centred
const SLOTS=[[14,0,0],[-14,0,1],[10,-16,0],[-10,-16,1],[10,16,0],[-10,16,1],[0,-20,.5],[0,20,.5]];
// hero copy rects are cached: reading them every frame forced a full layout 60 times a second
function domRects(){
  if(domCache&&domAge++<20) return domCache;
  domAge=0;
  const hr=hero.getBoundingClientRect(), out=[];
  hero.querySelectorAll('.hero-eyebrow, .hero h1, .hero-tagline, .hero-tags .tag, .card-info[data-on="true"]').forEach(el=>{ const r=el.getBoundingClientRect(); if(!r.width||+getComputedStyle(el).opacity<.1) return;
    out.push({x:r.left-hr.left-8,y:r.top-hr.top-6,w:r.width+16,h:r.height+12}); });
  return domCache=out;
}
function planetHit(r){ const qx=Math.max(r.x,Math.min(C.x,r.x+r.w)), qy=Math.max(r.y,Math.min(C.y,r.y+r.h)); return Math.hypot(qx-C.x,qy-C.y)<Rp*1.08; }
function slotRect(o,i,w){ const [dx,dy,an]=SLOTS[i]; const x=o.x+dx-an*w; return {x:x-PAD,y:o.y+dy-LH/2,w:w+PAD*2,h:LH}; }
function layoutLabels(obstacles){
  // objects themselves are obstacles for every label but their own
  const boxes=OBJ.filter(o=>o.slot!==-2&&!(o.z<0&&Math.hypot(o.x-C.x,o.y-C.y)<Rp)).map(o=>({o,r:{x:o.x-8,y:o.y-8,w:16,h:16}}));
  const placed=[];
  jobs.sort((a,b)=>b.pri-a.pri).forEach(j=>{
    const o=j.o, w=labW('',o.label);
    const ux=o.x-C.x, uy=o.y-C.y;
    // prefer slots that point away from the planet; keep the previous slot while it stays free
    const order=SLOTS.map((s,i)=>i).sort((a,b)=>(SLOTS[b][0]*ux+SLOTS[b][1]*uy)-(SLOTS[a][0]*ux+SLOTS[a][1]*uy));
    if(o.slot>=0){ order.splice(order.indexOf(o.slot),1); order.unshift(o.slot); }
    // strict pass first; selected / related / hovered labels may then relax the soft rules
    // (other objects, the planet) but never cover another label or the hero copy
    const tries=j.pri>=2?[0,1,2]:[0];
    let pick=-1;
    for(const lvl of tries){ for(const i of order){ const r=slotRect(o,i,w);
      if(r.x<8||r.x+r.w>W-8||r.y<8||r.y+r.h>H-8) continue;
      if(lvl<2&&planetHit(r)) continue;
      if(obstacles.some(b=>hit(r,b))||placed.some(b=>hit(r,b))) continue;
      if(lvl<1&&boxes.some(b=>b.o!==o&&hit(r,b.r))) continue;
      pick=i; break; } if(pick>=0) break; }
    if(pick<0){ j.hidden=true; o.slot=-1; return; }
    o.slot=pick; const r=slotRect(o,pick,w); placed.push(r);
    const [dx,dy,an]=SLOTS[pick]; j.tx=o.x+dx-an*w; j.ty=o.y+dy;
    // ease label position so slot changes glide instead of jumping
    if(o.lx==null||Math.hypot(o.lx-j.tx,o.ly-j.ty)>80){ o.lx=j.tx; o.ly=j.ty; } else { o.lx+=(j.tx-o.lx)*.35; o.ly+=(j.ty-o.ly)*.35; }
    j.w=w;
  });
  return placed;
}
function drawObjLabel(P,j){
  if(j.hidden) return; const o=j.o, acc=j.state>0;
  const cx=Math.max(o.lx,Math.min(o.x,o.lx+j.w)), cy=o.ly; const d=Math.hypot(cx-o.x,cy-o.y);
  if(d>10){ ctx.strokeStyle=acc?P.accent:P.fg; ctx.globalAlpha=j.a*.5; ctx.setLineDash([1.5,3]); ctx.beginPath();
    ctx.moveTo(o.x+(cx-o.x)/d*7,o.y+(cy-o.y)/d*7); ctx.lineTo(cx-(cx-o.x)/d*3,cy-(cy-o.y)/d*3); ctx.stroke(); ctx.setLineDash([]); }
  label2('',o.label,o.lx,o.ly,j.a,acc?P.accent:P.fg,acc?P.accent:P.label);
}

// ---- loop
// hero style writes restyle its whole subtree, so skip the ones that would not change anything
const heroVars={};
function setVar(k,v){ if(heroVars[k]!==v) hero.style.setProperty(k,heroVars[k]=v); }
let t=0, prev=performance.now(), speed=1;
function frame(now){
  const dt=Math.min(.05,(now-prev)/1000); prev=now;
  const P=PAL[themeOf()];
  if(!real){ target.x=C.x+Math.cos(t*.25)*Rp*3.2; target.y=C.y-Rp*2+Math.sin(t*.4)*Rp; }
  mouse.x+=(target.x-mouse.x)*(real?.25:.04); mouse.y+=(target.y-mouse.y)*(real?.25:.04);

  const tw=depthOn&&!reduce?{x:(mouse.y-C.y)/H*.22,z:(mouse.x-C.x)/W*.12}:{x:0,z:0};
  tilt.x+=(tw.x-tilt.x)*Math.min(1,dt*3); tilt.z+=(tw.z-tilt.z)*Math.min(1,dt*3);
  glowAmt+=((real?1:.45)-glowAmt)*Math.min(1,dt*3);
  setVar('--mx',mouse.x.toFixed(1)+'px'); setVar('--my',mouse.y.toFixed(1)+'px'); setVar('--glow',glowAmt.toFixed(3));
  hover=-1; hoverRing=-1;
  if(real){ hover=pick(target.x,target.y);
    if(hover<0){ let bd=touch?22:10; ORBITS.forEach((orb,i)=>{ for(let a=0;a<120;a++){ const p=project(orb,R(i),a/120*Math.PI*2); const d=Math.hypot(p.x-target.x,p.y-target.y); if(d<bd){bd=d; hoverRing=i;} } }); } }
  setVar('cursor',hover>=0?'pointer':'default');

  const want=(hover>=0||sel>=0)?.08:1; speed+=(want-speed)*Math.min(1,dt*4);
  if(!reduce) t+=dt*speed;
  OBJ.forEach(o=>{ if(!reduce) o.theta+=ORBITS[o.o].speed*dt*speed; const p=project(ORBITS[o.o],R(o.o),o.theta); o.x=p.x; o.y=p.y; o.z=p.z; o.k=p.k; });

  const selObj=sel>=0?OBJ[sel]:null;
  const stateOf=o=>!selObj?0:o===selObj?1:!showRel?0:selObj.rel.includes(o.id)?2:-1;

  ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,W,H);
  // faint grid crosses
  ctx.strokeStyle=P.fg; ctx.lineWidth=1; ctx.globalAlpha=.08; ctx.beginPath();
  for(let gx=W*.12;gx<W;gx+=W*.125) for(let gy=H*.16;gy<H;gy+=H*.17){ ctx.moveTo(gx-3,gy); ctx.lineTo(gx+3,gy); ctx.moveTo(gx,gy-3); ctx.lineTo(gx,gy+3); } ctx.stroke();

  const focus=sel>=0?-1:hover>=0?OBJ[hover].o:hoverRing;
  ORBITS.forEach((_,i)=>drawRing(P,i,t,i===focus,!!selObj||(focus>=0&&i!==focus)));
  if((glowMode==='trail'||glowMode==='both')&&!reduce) OBJ.forEach(o=>{ if(o.z<0) drawTrail(P,o); });
  jobs.length=0;
  const prox=o=>focus>=0?(o.o===focus?1:-1):real?Math.exp(-((Math.hypot(o.x-target.x,o.y-target.y)/radObj)**2)):0;
  OBJ.forEach((o,k)=>{ if(o.z<0) drawObj(P,o,k,prox(o),stateOf(o)); });
  drawPlanet(P,t,{x:mouse.x-C.x,y:mouse.y-C.y});
  if((glowMode==='trail'||glowMode==='both')&&!reduce) OBJ.forEach(o=>{ if(o.z>=0) drawTrail(P,o); });
  OBJ.forEach((o,k)=>{ if(o.z>=0) drawObj(P,o,k,prox(o),stateOf(o)); });

  // orbit names: fixed point on each ring, pushed outward on a leader
  const orbLabs=[];
  ORBITS.forEach((orb,i)=>{ if(LBL[i]===null||(W<700&&i!==focus&&!idleOrb)) return; const p=project(orb,R(i),LBL[i]); if(p.z<0) return;
    const dx=p.x-C.x, dy=p.y-C.y, d=Math.hypot(dx,dy)||1, ux=dx/d, uy=dy/d;
    const ex=p.x+ux*(40+i*8), ey=p.y+uy*(40+i*8);
    const tw=labW('Orbit',orb.name);
    let lx=ux>=0?ex+12:ex-12-tw, tx2=ux>=0?ex+8:ex-8; if(lx+tw>W-12){ lx=ex-12-tw; tx2=ex-8; } if(lx<12){ lx=ex+12; tx2=ex+8; }
    const pr=real?Math.exp(-((Math.hypot(ex-target.x,ey-target.y)/radOrb)**2)):0; const al=i===focus?1:focus>=0?.08:Math.min(1,(idleOrb?.6:0)+.75*pr);
    orbLabs.push({i,orb,p,ux,uy,ex,ey,lx,tx2,al,r:{x:lx-PAD,y:ey-16,w:tw+PAD*2,h:30}}); });
  // an object drifting under an orbit label: let the label step back instead of printing over it
  orbLabs.forEach(l=>{ const under=OBJ.some(o=>!(o.z<0&&Math.hypot(o.x-C.x,o.y-C.y)<Rp)&&hit({x:o.x-6,y:o.y-6,w:12,h:12},l.r));
    l.orb.dim=(l.orb.dim||0)+((under&&l.i!==focus?1:0)-(l.orb.dim||0))*.2; l.al*=1-.95*l.orb.dim; });
  const obstacles=domRects().concat(orbLabs.filter(l=>l.al>.05).map(l=>l.r));
  layoutLabels(obstacles);
  jobs.forEach(j=>drawObjLabel(P,j));
  orbLabs.forEach(l=>{ const col=l.i===focus?P.accent:P.label;
    ctx.strokeStyle=col; ctx.globalAlpha=l.al*.7; ctx.setLineDash([1.5,3]); ctx.beginPath(); ctx.moveTo(l.p.x+l.ux*4,l.p.y+l.uy*4); ctx.lineTo(l.ex,l.ey); ctx.lineTo(l.tx2,l.ey); ctx.stroke(); ctx.setLineDash([]);
    label2('Orbit',l.orb.name,l.lx,l.ey,l.al,l.i===focus?P.accent:P.fg,col); });

  if(layoutMode==='chip'){ ctx.font=`500 15px ${MONO}`; const txt='anton.alekseev'; const w=ctx.measureText(txt).width; const y=C.y+Rp+34;
    ctx.globalAlpha=1; ctx.fillStyle=P.fg; ctx.textBaseline='middle'; ctx.fillText(txt,C.x-w/2,y); ctx.fillStyle=P.accent; ctx.fillRect(C.x+w/2+3,y+3,4,4);
    brackets(C.x,y,w/2+14,6,P.fg,.5,16); }

  // optional brand mark next to the system cursor (hero only)
  if(real&&cursorMark){ ctx.globalAlpha=1; ctx.fillStyle=P.accent; ctx.fillRect(target.x+12,target.y+16,4,4); }
  ctx.globalAlpha=1;

  updateInfo(selObj); if(selObj) placeCard(selObj);
  if(visible) requestAnimationFrame(frame); else running=false;
}

const info=document.getElementById('poInfo'); let shown=null;
function updateInfo(o){
  if(o===shown) return; shown=o;
  if(!o){ info.dataset.on='false'; hero.classList.remove('card-open'); domCache=null; return; }
  const orb=ORBITS[o.o], $=id=>document.getElementById(id);
  $('poK').textContent=`${orb.name} orbit`;
  $('poT').textContent=o.label; $('poP').textContent=o.text;
  $('poQ').textContent=orb.q;
  $('poR').innerHTML=o.rel.length?`<span class="lbl">Related</span>`+o.rel.map(id=>`<span class="po-chip">${byId[id].label}</span>`).join(''):'';
  const go=$('poGo'), url=o.kase&&CASE_URL[o.kase]; go.hidden=!o.kase; $('poC').textContent=o.kase||'';
  if(url){ go.href=url; go.classList.remove('soon'); } else { go.removeAttribute('href'); go.classList.add('soon'); } info.dataset.on='true'; hero.classList.add('card-open'); domCache=null;
  measureCard(); cardSide=-1;
}
// the card opens next to its object and follows it, never covering it; it prefers spots clear of the hero copy
let cardW=0, cardH=0, cardSide=-1, copyRects=[];
function measureCard(){
  cardW=info.offsetWidth; cardH=info.offsetHeight;
  const hr=hero.getBoundingClientRect();
  copyRects=[...hero.querySelectorAll('.hero-eyebrow, .hero h1, .hero-tagline, .hero-tags')].map(el=>{ const r=el.getBoundingClientRect(); return {x:r.left-hr.left,y:r.top-hr.top,w:r.width,h:r.height}; });
}
function placeCard(o){
  const G=18, M=12, ob={x:o.x-12,y:o.y-12,w:24,h:24};
  const spots=[[o.x+G,o.y-cardH/2],[o.x-G-cardW,o.y-cardH/2],[o.x-cardW/2,o.y+G],[o.x-cardW/2,o.y-G-cardH]];
  let best=-1, bestScore=Infinity, bestXY=null;
  spots.forEach(([x,y],i)=>{
    x=Math.max(M,Math.min(W-cardW-M,x)); y=Math.max(M,Math.min(H-cardH-M,y));
    const r={x,y,w:cardW,h:cardH}; if(hit(r,ob)) return;
    let sc=copyRects.reduce((a,c)=>a+Math.max(0,Math.min(r.x+r.w,c.x+c.w)-Math.max(r.x,c.x))*Math.max(0,Math.min(r.y+r.h,c.y+c.h)-Math.max(r.y,c.y)),0);
    if(i!==cardSide) sc+=2000; // stay on the same side unless another one is clearly better
    if(sc<bestScore){ bestScore=sc; best=i; bestXY=[x,y]; } });
  if(best<0){ best=0; bestXY=[Math.max(M,Math.min(W-cardW-M,spots[0][0])),Math.max(M,Math.min(H-cardH-M,spots[0][1]))]; }
  cardSide=best; info.style.left=Math.round(bestXY[0])+'px'; info.style.top=Math.round(bestXY[1])+'px';
}

new ResizeObserver(layout).observe(hero); layout();
mouse.x=target.x=C.x+Rp*3; mouse.y=target.y=C.y-Rp*2;
// only animate while the hero is on screen
let visible=true, running=true;
if('IntersectionObserver' in window) new IntersectionObserver(es=>{ visible=es[0].isIntersecting; if(visible&&!running){ running=true; prev=performance.now(); requestAnimationFrame(frame); } }).observe(hero);
requestAnimationFrame(frame);
})();
