/* Figma layer: edit-mode toggle, multiplayer cursors, frame selection, drag + auto-fix.
   Shared by index.html and case.html. All chrome is gated behind html.edit */
(function(){
var FINE=window.matchMedia('(pointer:fine)').matches;
var REDUCED=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var root=document.documentElement;

var ARROW='<svg width="18" height="18" viewBox="0 0 18 18" fill="none">'
  +'<path d="M2 1.5L15.5 9.2L9.1 10.6L6.2 16.5L2 1.5Z" fill="COLOR" stroke="#fff" stroke-width="1.1" stroke-linejoin="round"/></svg>';

function mkCursor(id,color,name){
  var d=document.createElement('div');
  d.className='fcur';d.id=id;
  d.innerHTML=ARROW.replace('COLOR',color)+'<span class="fcur-tag">'+name+'</span>';
  document.body.appendChild(d);
  return d;
}
function inEdit(){return root.classList.contains('edit');}

/* ── guest cursor (the visitor) ── */
if(FINE){
  var guest=mkCursor('fcur-guest','#0d99ff','You');
  var tag=guest.querySelector('.fcur-tag');
  var mx=-100,my=-100,gx=-100,gy=-100;
  document.addEventListener('mousemove',function(e){mx=e.clientX;my=e.clientY;});
  document.addEventListener('mouseleave',function(){mx=-100;my=-100;});
  (function tick(){
    gx+=(mx-gx)*.55;gy+=(my-gy)*.55;
    guest.style.transform='translate('+gx+'px,'+gy+'px)';
    requestAnimationFrame(tick);
  })();

  /* delegated hover: cards get an action label, real interactives get emphasis */
  var ACT='a,.nav-links span,.nav-logo,.clink,.cb-nav-btn,.case-back,.mode-toggle';
  document.addEventListener('mouseover',function(e){
    var card=e.target.closest('.ccard,.mcard');
    if(card){tag.textContent='View case';guest.classList.add('act');return;}
    if(e.target.closest(ACT)){guest.classList.add('act');}
  });
  document.addEventListener('mouseout',function(e){
    if(e.target.closest('.ccard,.mcard,'+ACT)){
      tag.textContent='You';guest.classList.remove('act');
    }
  });
}

/* ── frame selection on case cards ── */
var FRAME_GLYPH='<svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" stroke-width="1">'
  +'<path d="M2.2 0v9M6.8 0v9M0 2.2h9M0 6.8h9"/></svg>';

function kebab(s){return s.replace(/&amp;/g,'and').replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-|-$/g,'');}

window.initFigmaFrames=function(){
  document.querySelectorAll('.ccard:not(.fsel-host),.mcard:not(.fsel-host)').forEach(function(card,i){
    card.classList.add('fsel-host');
    card.setAttribute('tabindex','0');
    card.setAttribute('role','link');
    var t=card.querySelector('.ccard-title,.mcard-title');
    if(t)card.setAttribute('aria-label','View case: '+t.textContent);
    card.addEventListener('keydown',function(e){
      if(e.key==='Enter'||e.key===' '){e.preventDefault();card.click();}
    });
    var sel=document.createElement('div');
    sel.className='fsel';
    sel.innerHTML='<i></i><i></i><i></i><i></i><span class="fsel-dim"></span>';
    card.appendChild(sel);
    function updDim(){
      var r=card.getBoundingClientRect();
      sel.querySelector('.fsel-dim').textContent=Math.round(r.width)+' × '+Math.round(r.height);
    }
    card.addEventListener('mouseenter',updDim);
    card.addEventListener('focus',updDim);

    /* frame label — main cards only */
    if(card.classList.contains('ccard')){
      var lbl=document.createElement('div');
      lbl.className='fframe-lbl';
      var num=(card.querySelector('.ccard-num')||{textContent:'0'+(i+1)}).textContent.split('/')[0].trim();
      var name=t?kebab(t.textContent):'Untitled';
      lbl.innerHTML=FRAME_GLYPH+'<span>Case-'+num+' / '+name+'</span>';
      card.parentNode.insertBefore(lbl,card);
    }
  });
};

/* ── Anton ghost: intro wander on first edit-mode enable ── */
function ghostIntro(){
  if(!FINE||REDUCED||!window.gsap)return;
  if(sessionStorage.getItem('fghost'))return;
  sessionStorage.setItem('fghost','1');
  var ghost=mkCursor('fcur-anton-intro','#4ade80','Anton');
  var vw=window.innerWidth,vh=window.innerHeight;
  var card=document.querySelector('#cards-main .ccard');
  var r=card?card.getBoundingClientRect():null;
  var inView=r&&r.top<vh*.8&&r.bottom>0;
  var tx=inView?r.left+r.width*.6:vw*.55;
  var ty=inView?r.top+r.height*.45:vh*.5;
  var tl=gsap.timeline({onComplete:function(){ghost.remove();}});
  gsap.set(ghost,{x:vw+40,y:vh*.3});
  tl.to(ghost,{opacity:1,duration:.4},0)
    .to(ghost,{x:vw*.72,y:vh*.42,duration:1.4,ease:'power2.out'},0)
    .to(ghost,{x:tx,y:ty,duration:1.6,ease:'power1.inOut'})
    .to(ghost,{x:'+=14',y:'+=8',duration:.5,ease:'sine.inOut'})
    .to(ghost,{x:'-=10',y:'+=6',duration:.5,ease:'sine.inOut'})
    .to(ghost,{x:'+=4',y:'-=5',duration:.6,ease:'sine.inOut'})
    .to(ghost,{x:vw*.3,y:-60,duration:1.3,ease:'power2.in'},'+=0.8')
    .to(ghost,{opacity:0,duration:.4},'-=0.4');
}

/* ── draggable elements + Anton the fixer ── */
var fixQueue=[],fixBusy=false,fixTimer=null,fixer=null;

function scheduleFix(){clearTimeout(fixTimer);fixTimer=setTimeout(runFix,1400);}

function runFix(){
  if(fixBusy||!fixQueue.length||!window.gsap)return;
  var el=fixQueue.shift();
  if(!gsap.getProperty(el,'x')&&!gsap.getProperty(el,'y')){runFix();return;}
  if(REDUCED){gsap.set(el,{x:0,y:0});runFix();return;}
  fixBusy=true;
  if(!fixer)fixer=mkCursor('fcur-anton','#4ade80','Anton');
  var ftag=fixer.querySelector('.fcur-tag');
  ftag.textContent='Anton';
  var r=el.getBoundingClientRect();
  var vw=window.innerWidth;
  gsap.set(fixer,{x:vw+40,y:Math.max(60,r.top-80),opacity:0});
  var tl=gsap.timeline({onComplete:function(){
    fixBusy=false;
    if(fixQueue.length){runFix();}
    else{
      gsap.to(fixer,{x:vw+60,y:-60,opacity:0,duration:.9,ease:'power2.in'});
    }
  }});
  tl.to(fixer,{opacity:1,duration:.3},0)
    .to(fixer,{x:r.left+r.width*.5,y:r.top+r.height*.5,duration:.9,ease:'power2.out'},0)
    .add(function(){ftag.textContent='fixing…';})
    .to(el,{x:0,y:0,duration:.7,ease:'power3.inOut',onUpdate:function(){
      var rr=el.getBoundingClientRect();
      gsap.set(fixer,{x:rr.left+rr.width*.5,y:rr.top+rr.height*.5});
    }})
    .add(function(){
      el.classList.add('fix-flash');
      setTimeout(function(){el.classList.remove('fix-flash');},350);
      ftag.textContent='Anton';
    })
    .to({},{duration:.35});
}

function makeDraggable(sel){
  if(!FINE||!window.gsap)return;
  document.querySelectorAll(sel).forEach(function(el){
    if(el.classList.contains('fdrag'))return;
    el.classList.add('fdrag');
    var sx,sy,bx,by,active=false;
    el.addEventListener('pointerdown',function(e){
      if(!inEdit())return;
      active=true;sx=e.clientX;sy=e.clientY;
      bx=gsap.getProperty(el,'x')||0;by=gsap.getProperty(el,'y')||0;
      var qi=fixQueue.indexOf(el);if(qi>-1)fixQueue.splice(qi,1);
      el.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    el.addEventListener('pointermove',function(e){
      if(!active)return;
      gsap.set(el,{x:bx+e.clientX-sx,y:by+e.clientY-sy});
    });
    function drop(){
      if(!active)return;active=false;
      var dx=gsap.getProperty(el,'x'),dy=gsap.getProperty(el,'y');
      if(Math.abs(dx)>10||Math.abs(dy)>10){
        if(fixQueue.indexOf(el)<0)fixQueue.push(el);
        scheduleFix();
      }else if(dx||dy){gsap.to(el,{x:0,y:0,duration:.3,ease:'power2.out'});}
    }
    el.addEventListener('pointerup',drop);
    el.addEventListener('pointercancel',drop);
  });
}

/* ── mode toggle ── */
function setMode(on){
  root.classList.toggle('edit',!!on);
  try{sessionStorage.setItem('fmode',on?'1':'0');}catch(e){}
  document.querySelectorAll('.mode-toggle').forEach(function(b){b.setAttribute('aria-pressed',on?'true':'false');});
  if(on)setTimeout(ghostIntro,1200);
}
window.FigmaMode={set:setMode,toggle:function(){setMode(!inEdit());}};
window.initFigmaDrag=function(){makeDraggable('.stat,.narr,.cstat');};

document.addEventListener('DOMContentLoaded',function(){
  var btn=document.getElementById('mode-toggle');
  if(btn)btn.addEventListener('click',function(){window.FigmaMode.toggle();});
  makeDraggable('.stat,.narr,.cstat');
  try{if(sessionStorage.getItem('fmode')==='1')setMode(true);}catch(e){}
});
document.addEventListener('keydown',function(e){
  if(e.key==='\\'&&(e.metaKey||e.ctrlKey)){e.preventDefault();window.FigmaMode.toggle();}
});
})();
