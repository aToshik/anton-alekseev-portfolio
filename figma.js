/* Figma layer: edit-mode toggle, multiplayer cursors, frame selection,
   text editing, drag + Anton the fixer. Shared by index.html and case.html.
   All chrome is gated behind html.edit */
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

/* what can be edited as text in edit mode */
var EDITABLE='.h-name,.h-sub,.h-eyebrow,.h-meta,.about-h,.about-body p,.narr-t,.narr-tag,'
  +'.work-h,.work-cnt,.contact-h,.clink-v,.clink-l,.ccard-title,.ccard-desc,.ccard-impact,'
  +'.mcard-title,.mcard-desc,.stat-n,.stat-l,.case-h,.case-tagline,.cstat-n,.cstat-l,'
  +'.cb-h,.cb-p,.cb-insight,.cb-step-t,.cb-step-d,.cb-reflection p,.nav-links span,.nav-logo';
var DRAGGABLE='.ccard,.mcard,.stat,.narr,.cstat';

/* ── guest cursor (the visitor) ── */
var guest=null,tag=null;
if(FINE){
  guest=mkCursor('fcur-guest','#0d99ff','You');
  tag=guest.querySelector('.fcur-tag');
  var mx=-100,my=-100,gx=-100,gy=-100;
  document.addEventListener('mousemove',function(e){mx=e.clientX;my=e.clientY;});
  document.addEventListener('mouseleave',function(){mx=-100;my=-100;});
  (function tick(){
    gx+=(mx-gx)*.55;gy+=(my-gy)*.55;
    guest.style.transform='translate('+gx+'px,'+gy+'px)';
    requestAnimationFrame(tick);
  })();
}

/* ── edit-mode hover: figma outline on every interactive object ── */
var HOVERABLE=EDITABLE+',a,.clink,.cb-nav-btn,.case-back,.stat,.narr,.cstat';
document.addEventListener('mouseover',function(e){
  if(FINE&&tag){
    var card=e.target.closest('.ccard,.mcard');
    if(card){tag.textContent=inEdit()?'You':'View case';guest.classList.add('act');}
    else if(e.target.closest('a,.nav-links span,.nav-logo,.clink,.cb-nav-btn,.case-back,.mode-toggle')){guest.classList.add('act');}
  }
  if(!inEdit())return;
  var h=e.target.closest(HOVERABLE);
  if(h&&!h.closest('.ccard,.mcard')||h&&h.matches(EDITABLE))h.classList.add('fhov');
});
document.addEventListener('mouseout',function(e){
  if(FINE&&tag&&e.target.closest('.ccard,.mcard,a,.nav-links span,.nav-logo,.clink,.cb-nav-btn,.case-back,.mode-toggle')){
    tag.textContent='You';guest.classList.remove('act');
  }
  var h=e.target.closest(HOVERABLE);
  if(h)h.classList.remove('fhov');
});

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
    card.__updDim=updDim;

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

/* ── selection state ── */
function deselectAll(){
  document.querySelectorAll('.fselected').forEach(function(el){el.classList.remove('fselected');});
}
function select(card){
  deselectAll();
  card.classList.add('fselected');
  if(card.__updDim)card.__updDim();
}

/* ── text editing ── */
var editingEl=null;
function enterTextEdit(el){
  if(el.isContentEditable)return;
  exitTextEdit();
  deselectAll();
  if(!el.dataset.forig)el.dataset.forig=el.innerHTML;
  el.classList.add('fedit');
  try{el.contentEditable='plaintext-only';}catch(e){el.contentEditable='true';}
  if(el.contentEditable!=='plaintext-only'&&el.contentEditable!=='true')el.contentEditable='true';
  editingEl=el;
  el.focus();
  el.addEventListener('blur',onEditBlur);
}
function onEditBlur(){
  var el=this;
  el.removeEventListener('blur',onEditBlur);
  el.contentEditable='false';
  el.classList.remove('fedit');
  if(editingEl===el)editingEl=null;
  if(el.innerHTML!==el.dataset.forig){
    queueFix({el:el,kind:'text'});
  }
}
function exitTextEdit(){
  if(editingEl)editingEl.blur();
}

/* ── Anton the fixer ── */
var fixQueue=[],fixBusy=false,fixTimer=null,fixer=null,fixerOn=false;

function queueFix(job){
  for(var i=0;i<fixQueue.length;i++){if(fixQueue[i].el===job.el&&fixQueue[i].kind===job.kind)return scheduleFix();}
  fixQueue.push(job);
  scheduleFix();
}
function scheduleFix(){clearTimeout(fixTimer);fixTimer=setTimeout(runFix,1500);}

function applyInstant(job){
  if(job.kind==='move')gsap.set(job.el,{x:0,y:0});
  else job.el.innerHTML=job.el.dataset.forig;
}
function jobStale(job){
  if(job.kind==='move')return !gsap.getProperty(job.el,'x')&&!gsap.getProperty(job.el,'y');
  return job.el.innerHTML===job.el.dataset.forig;
}

function runFix(){
  if(fixBusy||!fixQueue.length||!window.gsap)return;
  var job=fixQueue.shift();
  var el=job.el;
  if(jobStale(job)){runFix();return;}
  if(job.kind==='text'&&el.isContentEditable){fixQueue.push(job);scheduleFix();return;}
  if(REDUCED||!inEdit()){applyInstant(job);runFix();return;}
  fixBusy=true;
  if(!fixer)fixer=mkCursor('fcur-anton','#4ade80','Anton');
  gsap.killTweensOf(fixer);
  var ftag=fixer.querySelector('.fcur-tag');
  ftag.textContent='Anton';
  var r=el.getBoundingClientRect();
  var vw=window.innerWidth;
  if(!fixerOn){
    fixerOn=true;
    gsap.set(fixer,{x:vw+40,y:Math.max(60,r.top-80),opacity:0});
  }
  gsap.to(fixer,{opacity:1,duration:.25});
  gsap.to(fixer,{x:r.left+Math.min(r.width*.5,280),y:r.top+r.height*.5,duration:.85,ease:'power2.out',onComplete:function(){
    ftag.textContent='fixing…';
    if(job.kind==='move')fixMove(el,done);else fixText(el,done);
  }});
  function done(){
    el.classList.add('fix-flash');
    setTimeout(function(){el.classList.remove('fix-flash');},350);
    ftag.textContent='Anton';
    setTimeout(function(){
      fixBusy=false;
      if(fixQueue.length){runFix();}
      else{gsap.to(fixer,{x:vw+60,y:-60,opacity:0,duration:.9,ease:'power2.in',onComplete:function(){fixerOn=false;}});}
    },400);
  }
}
function fixMove(el,cb){
  gsap.to(el,{x:0,y:0,duration:.7,ease:'power3.inOut',
    onUpdate:function(){
      var rr=el.getBoundingClientRect();
      gsap.set(fixer,{x:rr.left+rr.width*.5,y:rr.top+rr.height*.5});
    },
    onComplete:cb});
}
function fixText(el,cb){
  var orig=el.dataset.forig||'';
  var asText=orig.replace(/<[^>]*>/g,'');
  var canType=orig.indexOf('<')<0&&orig.length<=90;
  if(!canType||Math.random()<0.35){
    setTimeout(function(){el.innerHTML=orig;cb();},500);
  }else{
    el.textContent='';
    var i=0;
    var iv=setInterval(function(){
      i++;
      el.textContent=asText.slice(0,i);
      if(i>=asText.length){clearInterval(iv);el.innerHTML=orig;cb();}
    },26);
  }
}

/* ── dragging ── */
var lastDragEnd=0;
function makeDraggable(sel){
  if(!FINE||!window.gsap)return;
  document.querySelectorAll(sel).forEach(function(el){
    if(el.classList.contains('fdrag'))return;
    el.classList.add('fdrag');
    var sx,sy,bx,by,active=false,moved=false;
    el.addEventListener('pointerdown',function(e){
      if(!inEdit())return;
      if(e.target.closest('[contenteditable="true"],[contenteditable="plaintext-only"]'))return;
      active=true;moved=false;sx=e.clientX;sy=e.clientY;
      bx=gsap.getProperty(el,'x')||0;by=gsap.getProperty(el,'y')||0;
      for(var i=fixQueue.length-1;i>=0;i--){if(fixQueue[i].el===el&&fixQueue[i].kind==='move')fixQueue.splice(i,1);}
      if(el.matches('.ccard,.mcard'))select(el);
      el.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    el.addEventListener('pointermove',function(e){
      if(!active)return;
      var dx=e.clientX-sx,dy=e.clientY-sy;
      if(Math.abs(dx)>3||Math.abs(dy)>3)moved=true;
      gsap.set(el,{x:bx+dx,y:by+dy});
    });
    function drop(){
      if(!active)return;active=false;
      var dx=gsap.getProperty(el,'x'),dy=gsap.getProperty(el,'y');
      if(moved)lastDragEnd=Date.now();
      if(Math.abs(dx)>10||Math.abs(dy)>10){
        queueFix({el:el,kind:'move'});
      }else if(dx||dy){gsap.to(el,{x:0,y:0,duration:.3,ease:'power2.out'});}
    }
    el.addEventListener('pointerup',drop);
    el.addEventListener('pointercancel',drop);
  });
}
window.initFigmaDrag=function(){makeDraggable(DRAGGABLE);};

/* ── edit-mode click routing: text editing, card selection, blocked nav ── */
document.addEventListener('click',function(e){
  if(!inEdit())return;
  if(e.target.closest('.mode-toggle'))return;
  if(Date.now()-lastDragEnd<200){e.preventDefault();e.stopPropagation();return;}
  var ed=e.target.closest(EDITABLE);
  if(ed){e.preventDefault();e.stopPropagation();enterTextEdit(ed);return;}
  var card=e.target.closest('.ccard,.mcard');
  if(card){e.preventDefault();e.stopPropagation();select(card);return;}
  var lnk=e.target.closest('a,nav');
  if(lnk){e.preventDefault();e.stopPropagation();return;}
  exitTextEdit();
  deselectAll();
},true);

document.addEventListener('keydown',function(e){
  if(e.key==='Escape'&&inEdit()){
    if(editingEl)exitTextEdit();else deselectAll();
  }
  if(e.key==='\\'&&(e.metaKey||e.ctrlKey)){e.preventDefault();window.FigmaMode.toggle();}
});

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

/* ── mode toggle ── */
function restoreAll(){
  exitTextEdit();
  deselectAll();
  clearTimeout(fixTimer);
  fixQueue.length=0;
  if(fixer&&window.gsap){gsap.killTweensOf(fixer);gsap.set(fixer,{opacity:0});fixerOn=false;}
  document.querySelectorAll('[data-forig]').forEach(function(el){
    if(el.innerHTML!==el.dataset.forig)el.innerHTML=el.dataset.forig;
  });
  if(window.gsap)document.querySelectorAll('.fdrag').forEach(function(el){
    if(gsap.getProperty(el,'x')||gsap.getProperty(el,'y'))gsap.set(el,{x:0,y:0});
  });
}
function setMode(on){
  root.classList.toggle('edit',!!on);
  try{sessionStorage.setItem('fmode',on?'1':'0');}catch(e){}
  document.querySelectorAll('.mode-toggle').forEach(function(b){b.setAttribute('aria-pressed',on?'true':'false');});
  if(on){setTimeout(ghostIntro,1200);}
  else{restoreAll();}
}
window.FigmaMode={set:setMode,toggle:function(){setMode(!inEdit());}};

document.addEventListener('DOMContentLoaded',function(){
  var btn=document.getElementById('mode-toggle');
  if(btn)btn.addEventListener('click',function(){window.FigmaMode.toggle();});
  makeDraggable(DRAGGABLE);
  try{if(sessionStorage.getItem('fmode')==='1')setMode(true);}catch(e){}
});
})();
