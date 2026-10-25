(() => {
    const dropzone = document.querySelector('#coverDropzone');
    const carousel = document.querySelector('#stickerCarousel');
    const stickerChoices = [...document.querySelectorAll('.sticker-choice')];
    const previousSticker = document.querySelector('.carousel-prev');
    const nextSticker = document.querySelector('.carousel-next');
    const tabs = [...document.querySelectorAll('.tab')];
    const title = document.querySelector('#libraryTitle');
    const count = document.querySelector('#resourceCount');
    const kindle = document.querySelector('.kindle');
    const swatches = [...document.querySelectorAll('.color-swatch')];

    if (!dropzone || !carousel) return;

    let carouselAngle = 0;
    let hoveredSticker = null;
    let lastFrame = performance.now();
    let animationFrame;
    const drawProgress = new WeakMap(stickerChoices.map(sticker => [sticker, 0]));

    const renderCarousel = () => {
        const total = stickerChoices.length;
        const radiusX = carousel.clientWidth < 100 ? 27 : carousel.clientWidth < 170 ? 47 : 82;
        const radiusY = carousel.clientWidth < 100 ? 11 : carousel.clientWidth < 170 ? 17 : 27;
        stickerChoices.forEach((sticker, index) => {
            const theta = carouselAngle + (index / total) * Math.PI * 2;
            const depth = (Math.cos(theta) + 1) / 2;
            const x = Math.sin(theta) * radiusX;
            const y = (1 - depth) * radiusY;
            const scale = .56 + depth * .44;
            const rotate = -Math.sin(theta) * 66;
            const isDrawn = hoveredSticker === sticker;
            const currentProgress = drawProgress.get(sticker) || 0;
            const nextProgress = currentProgress + ((isDrawn ? 1 : 0) - currentProgress) * .13;
            drawProgress.set(sticker, Math.abs(nextProgress - (isDrawn ? 1 : 0)) < .002 ? (isDrawn ? 1 : 0) : nextProgress);
            const pull = nextProgress * nextProgress * (3 - 2 * nextProgress);
            const pulledY = y - 28 * pull;
            const pulledZ = depth * 95 + (250 - depth * 95) * pull;
            const pulledRotate = rotate * (1 - pull);
            const pulledScale = scale + (1.28 - scale) * pull;
            sticker.classList.toggle('is-drawn', isDrawn);
            sticker.style.opacity = `${.24 + depth * .76 + (1 - (.24 + depth * .76)) * pull}`;
            sticker.style.zIndex = pull > .03 ? '100' : `${Math.round(depth * 80)}`;
            sticker.style.transform = `translate(-50%, -50%) translateX(${x}px) translateY(${pulledY}px) translateZ(${pulledZ}px) rotateY(${pulledRotate}deg) scale(${pulledScale})`;
        });
    };

    const rotateCarousel = direction => {
        carouselAngle += direction * ((Math.PI * 2) / stickerChoices.length);
        renderCarousel();
    };

    const animateCarousel = now => {
        const elapsed = Math.min(now - lastFrame, 50);
        lastFrame = now;
        if (!hoveredSticker && !document.hidden) carouselAngle += elapsed * .00013;
        renderCarousel();
        animationFrame = requestAnimationFrame(animateCarousel);
    };

    previousSticker.addEventListener('click', () => rotateCarousel(-1));
    nextSticker.addEventListener('click', () => rotateCarousel(1));
    carousel.addEventListener('wheel', event => {
        event.preventDefault();
        rotateCarousel(event.deltaY > 0 || event.deltaX > 0 ? 1 : -1);
    }, { passive: false });

    const placeSticker = (source, clientX, clientY) => {
        const rect = dropzone.getBoundingClientRect();
        const sticker = document.createElement('div');
        sticker.className = `placed-sticker ${source.dataset.variant}`;
        sticker.innerHTML = source.innerHTML;
        sticker.setAttribute('role', 'img');
        sticker.setAttribute('aria-label', source.getAttribute('aria-label'));
        sticker.style.left = `${Math.max(0, Math.min(rect.width, clientX - rect.left))}px`;
        sticker.style.top = `${Math.max(0, Math.min(rect.height, clientY - rect.top))}px`;
        dropzone.appendChild(sticker);
        enablePointerDrag(sticker);
    };

    stickerChoices.forEach(sticker => {
        sticker.addEventListener('pointerenter', () => { hoveredSticker = sticker; });
        sticker.addEventListener('pointerleave', () => { if (hoveredSticker === sticker) hoveredSticker = null; });
        sticker.addEventListener('focus', () => { hoveredSticker = sticker; });
        sticker.addEventListener('blur', () => { if (hoveredSticker === sticker) hoveredSticker = null; });
        sticker.addEventListener('pointerdown', () => dropzone.classList.add('is-ready'));
        sticker.addEventListener('dragstart', event => {
            hoveredSticker = sticker;
            event.dataTransfer.setData('text/plain', sticker.dataset.sticker);
            event.dataTransfer.effectAllowed = 'copy';
            dropzone.classList.add('is-ready');
        });
        sticker.addEventListener('dragend', () => {
            dropzone.classList.remove('is-ready', 'is-over');
            hoveredSticker = null;
        });
    });

    document.addEventListener('pointerup', () => dropzone.classList.remove('is-ready'));

    dropzone.addEventListener('dragover', event => { event.preventDefault(); dropzone.classList.add('is-over'); });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('is-over'));
    dropzone.addEventListener('drop', event => {
        event.preventDefault();
        dropzone.classList.remove('is-over');
        const stickerId = event.dataTransfer.getData('text/plain');
        const source = stickerChoices.find(sticker => sticker.dataset.sticker === stickerId);
        if (source) placeSticker(source, event.clientX, event.clientY);
        dropzone.classList.remove('is-ready');
    });

    function enablePointerDrag(sticker) {
        sticker.addEventListener('pointerdown', event => {
            event.preventDefault();
            dropzone.classList.add('is-ready');
            sticker.setPointerCapture(event.pointerId);
            const move = moveEvent => {
                const rect = dropzone.getBoundingClientRect();
                const x = Math.max(0, Math.min(rect.width, moveEvent.clientX - rect.left));
                const y = Math.max(0, Math.min(rect.height, moveEvent.clientY - rect.top));
                sticker.style.left = `${x}px`;
                sticker.style.top = `${y}px`;
            };
            const finish = () => {
                dropzone.classList.remove('is-ready');
                sticker.removeEventListener('pointermove', move);
                sticker.removeEventListener('pointerup', finish);
                sticker.removeEventListener('pointercancel', finish);
            };
            sticker.addEventListener('pointermove', move);
            sticker.addEventListener('pointerup', finish);
            sticker.addEventListener('pointercancel', finish);
        });
    }

    renderCarousel();
    animationFrame = requestAnimationFrame(animateCarousel);
    window.addEventListener('resize', renderCarousel);
    window.addEventListener('pagehide', () => cancelAnimationFrame(animationFrame));

    tabs.forEach(tab => tab.addEventListener('click', () => {
        const selected = tab.dataset.tab;
        tabs.forEach(item => {
            const active = item === tab;
            item.classList.toggle('is-active', active);
            item.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        document.querySelector('#booksPanel').hidden = selected !== 'books';
        document.querySelector('#articlesPanel').hidden = selected !== 'articles';
        document.querySelector('#podcastsPanel').hidden = selected !== 'podcasts';
        const labels = {
            books: ['Books', '6 saved books'],
            articles: ['Articles', '6 saved articles'],
            podcasts: ['Podcasts', '4 saved podcasts']
        };
        title.textContent = labels[selected][0];
        count.textContent = labels[selected][1];
    }));

    swatches.forEach(swatch => swatch.addEventListener('click', () => {
        kindle.style.setProperty('--case', swatch.dataset.case);
        kindle.style.setProperty('--case-highlight', swatch.dataset.highlight);
        kindle.style.setProperty('--case-deep', swatch.dataset.deep);
        swatches.forEach(option => {
            const selected = option === swatch;
            option.classList.toggle('is-selected', selected);
            option.setAttribute('aria-pressed', selected ? 'true' : 'false');
        });
    }));

    document.querySelectorAll('[data-placeholder-link]').forEach(link => {
        link.addEventListener('click', event => event.preventDefault());
    });
})();
