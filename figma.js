/* Figma layer: multiplayer cursors + frame selection. Shared by index.html and case.html */
(function(){
var FINE=window.matchMedia('(pointer:fine)').matches;
var REDUCED=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

var ARROW='<svg width="18" height="18" viewBox="0 0 18 18" fill="none">'
  +'<path d="M2 1.5L15.5 9.2L9.1 10.6L6.2 16.5L2 1.5Z" fill="COLOR" stroke="#fff" stroke-width="1.1" stroke-linejoin="round"/></svg>';

function mkCursor(id,color,name){
  var d=document.createElement('div');
  d.className='fcur';d.id=id;
  d.innerHTML=ARROW.replace('COLOR',color)+'<span class="fcur-tag">'+name+'</span>';
  document.body.appendChild(d);
  return d;
}

/* ── guest cursor (the visitor) ── */
if(FINE){
  var guest=mkCursor('fcur-guest','#0d99ff','Guest');
  var tag=guest.querySelector('.fcur-tag');
  var mx=-100,my=-100,gx=-100,gy=-100;
  document.addEventListener('mousemove',function(e){mx=e.clientX;my=e.clientY;});
  document.addEventListener('mouseleave',function(){mx=-100;my=-100;});
  (function tick(){
    gx+=(mx-gx)*.55;gy+=(my-gy)*.55;
    guest.style.transform='translate('+gx+'px,'+gy+'px)';
    requestAnimationFrame(tick);
  })();

  /* delegated hover: cards get an action label, other interactives get emphasis */
  var ACT='a,.nav-links span,.nav-logo,.narr,.stat,.clink,.cb-nav-btn,.case-back';
  document.addEventListener('mouseover',function(e){
    var card=e.target.closest('.ccard,.mcard');
    if(card){tag.textContent='View case';guest.classList.add('act');return;}
    if(e.target.closest(ACT)){guest.classList.add('act');}
  });
  document.addEventListener('mouseout',function(e){
    if(e.target.closest('.ccard,.mcard,'+ACT)){
      tag.textContent='Guest';guest.classList.remove('act');
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

/* ── Anton ghost cursor — index page, once per session ── */
if(FINE&&!REDUCED&&document.getElementById('cards-main')&&!sessionStorage.getItem('fghost')&&window.gsap){
  setTimeout(function(){
    sessionStorage.setItem('fghost','1');
    var ghost=mkCursor('fcur-anton','#4ade80','Anton');
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
  },8000);
}
})();
