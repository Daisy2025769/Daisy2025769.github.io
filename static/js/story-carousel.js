(() => {
  document.querySelectorAll('.story-carousel').forEach(root => {
    const track = root.querySelector('.story-track');
    const count = root.querySelector('.story-count');
    const previous = root.querySelector('[data-previous]');
    const next = root.querySelector('[data-next]');
    if (!track || !count) return;

    const originals = [...track.querySelectorAll('[data-story]')];
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (originals.length < 2) {
      count.textContent = originals.length ? '1 / 1' : '0 / 0';
      [previous, next].forEach(button => { if (button) button.disabled = true; });
      return;
    }

    const before = originals.at(-1).cloneNode(true);
    const after = originals[0].cloneNode(true);
    before.dataset.clone = 'before';
    after.dataset.clone = 'after';
    before.setAttribute('aria-hidden', 'true');
    after.setAttribute('aria-hidden', 'true');
    track.prepend(before);
    track.append(after);

    const cards = [...track.querySelectorAll('[data-story]')];
    let position = 1;
    let settleTimer;
    const logicalIndex = index => index === 0 ? originals.length - 1 : index === cards.length - 1 ? 0 : index - 1;
    const update = index => {
      position = index;
      count.textContent = `${logicalIndex(index) + 1} / ${originals.length}`;
    };
    const center = (index, smooth = true) => {
      index = Math.max(0, Math.min(cards.length - 1, index));
      update(index);
      cards[index].scrollIntoView({ behavior: smooth && !reduced ? 'smooth' : 'auto', block: 'nearest', inline: 'center' });
    };
    const normalize = () => {
      if (position === 0) center(originals.length, false);
      if (position === cards.length - 1) center(1, false);
    };

    previous?.addEventListener('click', () => center(position - 1));
    next?.addEventListener('click', () => center(position + 1));
    track.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        center(position + (event.key === 'ArrowRight' ? 1 : -1));
      }
    });
    track.addEventListener('wheel', event => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      const atStart = track.scrollLeft <= 1;
      const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 1;
      if ((event.deltaY < 0 && atStart) || (event.deltaY > 0 && atEnd)) return;
      event.preventDefault();
      track.scrollBy({ left: event.deltaY, behavior: reduced ? 'auto' : 'smooth' });
    }, { passive: false });
    track.addEventListener('scroll', () => {
      clearTimeout(settleTimer);
      settleTimer = setTimeout(normalize, 180);
    }, { passive: true });

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio >= .6) update(cards.indexOf(entry.target));
      });
    }, { root: track, threshold: [.6] });
    cards.forEach(card => observer.observe(card));
    requestAnimationFrame(() => requestAnimationFrame(() => center(1, false)));
  });
})();
