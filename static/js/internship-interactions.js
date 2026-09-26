(() => {
  const initBubble = bubble => {
    let startX = 0;
    let startY = 0;
    let originX = 0;
    let originY = 0;

    bubble.addEventListener('pointerdown', event => {
      if (event.button !== undefined && event.button !== 0) return;
      startX = event.clientX;
      startY = event.clientY;
      originX = Number(bubble.dataset.x || 0);
      originY = Number(bubble.dataset.y || 0);
      bubble.classList.add('is-dragging');
      bubble.setPointerCapture(event.pointerId);
    });

    bubble.addEventListener('pointermove', event => {
      if (!bubble.hasPointerCapture(event.pointerId)) return;
      const pool = bubble.closest('.bubble-pool');
      const nextX = originX + event.clientX - startX;
      const nextY = originY + event.clientY - startY;
      const limitX = Math.max(20, pool.clientWidth * .38);
      const limitY = Math.max(20, pool.clientHeight * .34);
      const x = Math.max(-limitX, Math.min(limitX, nextX));
      const y = Math.max(-limitY, Math.min(limitY, nextY));
      bubble.dataset.x = x;
      bubble.dataset.y = y;
      bubble.style.transform = `translate(${x}px, ${y}px)`;
    });

    const release = event => {
      if (bubble.hasPointerCapture(event.pointerId)) bubble.releasePointerCapture(event.pointerId);
      bubble.classList.remove('is-dragging');
    };
    bubble.addEventListener('pointerup', release);
    bubble.addEventListener('pointercancel', release);
  };

  document.querySelectorAll('.skill-bubble').forEach(initBubble);

  document.querySelectorAll('.image-reel').forEach(reel => {
    const slides = [...reel.querySelectorAll('.image-slide')];
    const controls = [...reel.querySelectorAll('[data-image-slide]')];
    if (slides.length < 2) return;
    let index = 0;
    let timer;

    const show = next => {
      index = (next + slides.length) % slides.length;
      slides.forEach((slide, slideIndex) => slide.classList.toggle('is-active', slideIndex === index));
      controls.forEach((control, controlIndex) => {
        const active = controlIndex === index;
        control.classList.toggle('is-active', active);
        control.setAttribute('aria-pressed', String(active));
      });
    };
    const play = () => {
      clearInterval(timer);
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) timer = setInterval(() => show(index + 1), 4200);
    };

    controls.forEach(control => control.addEventListener('click', () => {
      show(Number(control.dataset.imageSlide));
      play();
    }));
    reel.addEventListener('mouseenter', () => clearInterval(timer));
    reel.addEventListener('mouseleave', play);
    reel.addEventListener('focusin', () => clearInterval(timer));
    reel.addEventListener('focusout', play);
    show(0);
    play();
  });
})();
