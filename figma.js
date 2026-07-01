/* Figma layer: multiplayer cursors, frame selection, text editing,
   drag + Anton the fixer. Shared by index.html and case.html. */
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
var DRAGGABLE='.cstat';
var VIBE_VARIANTS=["This site is vibe-coded. That’s intentional.","This site is vibe-coded. Built with intuition.","This site is vibe-coded. Guided by instinct.","This site is vibe-coded. Made by feel.","This site is vibe-coded. Trusting the eye.","This site is vibe-coded. Some decisions were visual.","This site is vibe-coded. Optimized for taste.","This site is vibe-coded. Intentional enough.","This site is vibe-coded. The pixels agreed."];

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
var HOVERABLE=EDITABLE+',a,.clink,.cb-nav-btn,.stat,.narr,.cstat';
document.addEventListener('mouseover',function(e){
  if(FINE&&tag){
    var card=e.target.closest('.ccard,.mcard,.cover-card,.tile-card');
    if(card){tag.textContent='View case';guest.classList.add('act');}
    else if(e.target.closest('.cb-img-wrap')||(e.target.closest('.case-visual')&&!e.target.closest('.case-visual').querySelector('video'))){tag.textContent='Zoom in';guest.classList.add('act');}
    else if(e.target.closest('.clink')){var cl=e.target.closest('.clink');var href=cl.getAttribute('href')||'';tag.textContent=href.startsWith('mailto:')?'Send email':href.startsWith('tel:')?'Call':'Visit profile';guest.classList.add('act');}
    else if(e.target.closest('a,.nav-links span,.nav-logo,.cb-nav-btn')){guest.classList.add('act');}
  }
  var h=e.target.closest(HOVERABLE);
  if(h&&h.classList.contains('cstat'))h.classList.add('fhov');
});
document.addEventListener('mouseout',function(e){
  if(FINE&&tag&&e.target.closest('.ccard,.mcard,.cover-card,.tile-card,.cb-img-wrap,.case-visual,a,.nav-links span,.nav-logo,.clink,.cb-nav-btn')){
    tag.textContent='You';guest.classList.remove('act');
  }
  var h=e.target.closest(HOVERABLE);
  if(h)h.classList.remove('fhov');
});

/* ── frame selection on case cards ── */
var COMP_GLYPH='<svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">'
  +'<path d="M3 0L6 3L3 6L0 3ZM9 0L12 3L9 6L6 3ZM3 6L6 9L3 12L0 9ZM9 6L12 9L9 12L6 9Z"/></svg>';

window.initFigmaFrames=function(){
  document.querySelectorAll('.ccard:not(.fsel-host),.mcard:not(.fsel-host),.cover-card:not(.fsel-host),.tile-card:not(.fsel-host)').forEach(function(card,i){
    card.classList.add('fsel-host');
    card.setAttribute('tabindex','0');
    card.setAttribute('role','link');
    var t=card.querySelector('.ccard-title,.mcard-title,.cover-title,.tile-title');
    if(t)card.setAttribute('aria-label','View case: '+t.textContent);
    card.addEventListener('keydown',function(e){
      if(e.key==='Enter'||e.key===' '){e.preventDefault();card.click();}
    });
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
  if(REDUCED){applyInstant(job);runFix();return;}
  fixBusy=true;
  var heroEl=document.querySelector('.hcur');
  if(!fixer)fixer=heroEl||mkCursor('fcur-anton','#4ade80','Anton');
  if(window.__tlAnton){window.__tlAnton.kill();window.__tlAnton=null;}
  gsap.killTweensOf(fixer);
  var ftag=fixer.querySelector('.hcur-tag,.fcur-tag');
  ftag.textContent='Anton';
  var r=el.getBoundingClientRect();
  var vw=window.innerWidth;
  if(!heroEl&&!fixerOn){
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
      else if(heroEl&&window.__resumeAntonWander){window.__resumeAntonWander(fixer);}
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
  var orig;
  if(el.classList.contains('vibe')){
    var prev=(el.dataset.forig||'').replace(/<[^>]*>/g,'');
    var pool=VIBE_VARIANTS.filter(function(v){return v!==prev;});
    orig=pool[Math.floor(Math.random()*pool.length)];
    el.dataset.forig=orig;
  }else{orig=el.dataset.forig||'';}
  var asText=orig.replace(/<[^>]*>/g,'');
  var canType=orig.indexOf('<')<0&&orig.length<=90;
  if(!canType||(Math.random()<0.35&&!el.classList.contains('vibe'))){
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
      if(!FINE)return;
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
window.figmaQueueFix=queueFix;

/* ── click routing: text edit (edit mode only, except .vibe which is always editable) ── */
document.addEventListener('click',function(e){
  if(!FINE)return;
  if(Date.now()-lastDragEnd<200){e.preventDefault();e.stopPropagation();return;}
  var vf=e.target.closest('.vibe-frame');
  if(vf){var vp=vf.querySelector('.vibe');if(vp){e.preventDefault();e.stopPropagation();enterTextEdit(vp);return;}}
  var ed=e.target.closest(EDITABLE);
  if(ed&&inEdit()){e.preventDefault();e.stopPropagation();enterTextEdit(ed);return;}
},true);

document.addEventListener('keydown',function(e){
  if(e.key==='Escape'){
    if(editingEl)exitTextEdit();else deselectAll();
  }
});


/* ── WebGL background gradient (fixed, full-site) ── */
function initGrad(){
  var cv=document.getElementById('grad');
  if(!cv)return;
  var gl=cv.getContext('webgl')||cv.getContext('experimental-webgl');
  if(!gl){cv.style.display='none';return;}
  function resize(){cv.width=Math.round(window.innerWidth*.5);cv.height=Math.round(window.innerHeight*.5);gl.viewport(0,0,cv.width,cv.height);}
  resize();window.addEventListener('resize',resize);
  function mkShader(t,s){var sh=gl.createShader(t);gl.shaderSource(sh,s);gl.compileShader(sh);return sh;}
  var vs='attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
  var fs=[
    'precision mediump float;',
    'uniform float uT;uniform vec2 uRes;',
    'float h(vec2 p){p=fract(p*vec2(127.1,311.7));p+=dot(p,p+34.23);return fract(p.x*p.y);}',
    'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);',
    'return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}',
    'float fbm(vec2 p){float v=0.,a=.5;mat2 r=mat2(.87,.5,-.5,.87);',
    'for(int i=0;i<4;i++){v+=a*n(p);p=r*p*2.+100.;a*=.5;}return v;}',
    'void main(){',
    'vec2 uv=gl_FragCoord.xy/uRes;',
    'float t=uT*.22;',
    'vec2 q=vec2(fbm(uv*1.2+t*.18),fbm(uv*1.2+vec2(5.2,1.3)+t*.14));',
    'float nm=fbm(uv*1.2+q*1.1+t*.1);',
    'vec3 c1=vec3(.18,.32,.48),c2=vec3(.08,.55,.22),c3=vec3(.14,.08,.20);',
    'vec3 col=mix(c3,c1,smoothstep(.2,.65,nm));',
    'col=mix(col,c2,smoothstep(.55,.88,nm)*.52);',
    'col*=.44;',
    'vec2 vc=uv-vec2(.45,.5);col*=max(0.,1.-dot(vc,vc)*1.0);',
    'gl_FragColor=vec4(max(col,vec3(0.031)),1.);}',
  ].join('\n');
  var prog=gl.createProgram();
  gl.attachShader(prog,mkShader(gl.VERTEX_SHADER,vs));
  gl.attachShader(prog,mkShader(gl.FRAGMENT_SHADER,fs));
  gl.linkProgram(prog);gl.useProgram(prog);
  var buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  var aLoc=gl.getAttribLocation(prog,'a');gl.enableVertexAttribArray(aLoc);gl.vertexAttribPointer(aLoc,2,gl.FLOAT,false,0,0);
  var uTLoc=gl.getUniformLocation(prog,'uT'),uResLoc=gl.getUniformLocation(prog,'uRes'),t0=performance.now();
  (function loop(){
    requestAnimationFrame(loop);
    gl.uniform1f(uTLoc,(performance.now()-t0)/1000);
    gl.uniform2f(uResLoc,cv.width,cv.height);
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
  })();
}

document.addEventListener('DOMContentLoaded',function(){
  makeDraggable(DRAGGABLE);

  initGrad();

  /* cursor glow — elegant depth across full background */
  var glow=document.getElementById('cursor-glow');
  if(glow&&FINE&&window.gsap){
    var qgx=gsap.quickTo(glow,'x',{duration:.65,ease:'power2.out'});
    var qgy=gsap.quickTo(glow,'y',{duration:.65,ease:'power2.out'});
    document.addEventListener('mousemove',function(e){
      qgx(e.clientX-340);
      qgy(e.clientY+70-340);
      glow.classList.add('gl-active');
    });
    document.addEventListener('mouseleave',function(){glow.classList.remove('gl-active');});
  }
});
})();
