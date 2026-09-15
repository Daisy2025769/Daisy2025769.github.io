(() => {
 document.querySelectorAll('.slideshow').forEach(root => {
  const slides=[...root.querySelectorAll('.slide')], prev=root.querySelector('[data-prev]'), next=root.querySelector('[data-next]'), pause=root.querySelector('[data-pause]'), count=root.querySelector('output');
  if(slides.length < 2) return;
  [prev,next,pause].forEach(b=>b.disabled=false);
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  let index=0, hovered=false, focused=false, stopped=reduced.matches, timer;
  const sync=()=>{ clearInterval(timer); pause.textContent=stopped?'Play':'Pause'; pause.setAttribute('aria-label',stopped?'Play slideshow':'Pause slideshow'); if(!stopped&&!hovered&&!focused&&!document.hidden)timer=setInterval(()=>show(1),4500); };
  const show=delta=>{slides[index].hidden=true;slides[index].classList.remove('enter-right','enter-left'); index=(index+delta+slides.length)%slides.length; slides[index].hidden=false;slides[index].classList.add(delta>0?'enter-right':'enter-left');count.textContent=`${index+1} / ${slides.length}`;};
  prev.addEventListener('click',()=>{show(-1);sync();});next.addEventListener('click',()=>{show(1);sync();});pause.addEventListener('click',()=>{stopped=!stopped;sync();});
  root.addEventListener('mouseenter',()=>{hovered=true;sync();});root.addEventListener('mouseleave',()=>{hovered=false;sync();});
  root.addEventListener('focusin',()=>{focused=true;sync();});root.addEventListener('focusout',e=>{if(!root.contains(e.relatedTarget)){focused=false;sync();}});
  root.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();show(e.key==='ArrowRight'?1:-1);sync();}});
  document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',e=>{stopped=e.matches;sync();});sync();
 });
})();