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
})();
