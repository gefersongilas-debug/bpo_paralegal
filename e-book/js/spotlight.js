/* V16 — spotlight, bounded work, no offscreen drawing. */
(() => {
  const cards = [...document.querySelectorAll('[data-spotlight]')];
  if (!cards.length) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(any-hover: hover) and (any-pointer: fine)');
  const visible = new Set();
  let frame=0, timer=0, lastMove=-Infinity, x=0, y=0;
  const enabled=()=>!document.hidden&&!reduced.matches&&fine.matches&&!document.body.classList.contains('form-open');
  function active(card){return !document.body.classList.contains('pinned-story')||!!card.closest('.scene.is-current');}
  function cancel(){cancelAnimationFrame(frame);clearTimeout(timer);frame=timer=0;}
  function schedule(immediate=false){
    if(!enabled()||!visible.size)return;
    if(immediate){clearTimeout(timer);timer=0;}
    if(!frame&&!timer)frame=requestAnimationFrame(paint);
  }
  function paint(now){
    frame=0;if(!enabled())return;
    const activeCards=[...visible].filter(active);
    if(!activeCards.length)return;
    const idle=Math.min(1,Math.max(0,(now-lastMove-2500)/900)),t=now/1000;
    // Read geometry once, before writing any CSS values.
    const geometry=activeCards.map(card=>[card,card.getBoundingClientRect(),cards.indexOf(card)]);
    for(const [card,r,i] of geometry){
      const dx=Math.max(r.left-x,0,x-r.right),dy=Math.max(r.top-y,0,y-r.bottom);
      const near=Math.max(0,1-Math.hypot(dx,dy)/260);
      const ax=r.width*(.5+.48*Math.sin(t*.58+i*.8)),ay=r.height*(.5+.49*Math.cos(t*.74+i*.55));
      card.style.setProperty('--spot-x',`${((x-r.left)*(1-idle)+ax*idle).toFixed(1)}px`);
      card.style.setProperty('--spot-y',`${((y-r.top)*(1-idle)+ay*idle).toFixed(1)}px`);
      card.style.setProperty('--spot-opacity',(near*(1-idle)+.9*idle).toFixed(2));
    }
    // Pointer response is event-driven; slow ambient drift is capped at 12.5 fps.
    const wait=idle>0?80:Math.max(80,2500-(now-lastMove));
    timer=setTimeout(()=>{timer=0;schedule();},wait);
  }
  if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting)visible.add(entry.target);else visible.delete(entry.target);}if(!visible.size)cancel();else schedule(true);});cards.forEach(c=>observer.observe(c));}else cards.forEach(c=>visible.add(c));
  document.addEventListener('pointermove',e=>{if(e.pointerType==='touch'||!enabled())return;x=e.clientX;y=e.clientY;lastMove=performance.now();schedule(true);},{passive:true});
  document.addEventListener('pointerleave',()=>{lastMove=-Infinity;schedule(true);});
  document.addEventListener('visibilitychange',()=>{cancel();schedule(true);});
  document.addEventListener('bpo:scene',()=>{cancel();schedule(true);});
  document.addEventListener('bpo:form',()=>{cancel();schedule(true);});
  addEventListener('scroll',()=>schedule(),{passive:true});
  for(const m of [reduced,fine])m.addEventListener('change',()=>{cancel();cards.forEach(c=>['--spot-x','--spot-y','--spot-opacity'].forEach(k=>c.style.removeProperty(k)));schedule(true);});
  schedule();
})();
