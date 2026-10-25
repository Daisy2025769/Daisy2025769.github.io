(() => {
    const dropzone = document.querySelector('#coverDropzone');
    const kindleCover = document.querySelector('.kindle-cover');
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

    let carouselIndex = 0;
    let carouselTimer;

    const renderCarousel = () => {
        const total = stickerChoices.length;
        const spacing = carousel.clientWidth < 220 ? 38 : 78;
        stickerChoices.forEach((sticker, index) => {
            let offset = (index - carouselIndex + total) % total;
            if (offset > total / 2) offset -= total;
            const distance = Math.abs(offset);
            sticker.style.opacity = distance > 2 ? '0' : `${1 - distance * .25}`;
            sticker.style.zIndex = `${10 - distance}`;
            sticker.style.pointerEvents = distance > 2 ? 'none' : 'auto';
            sticker.style.transform = `translate(-50%, -50%) translateX(${offset * spacing}px) translateZ(${(2 - distance) * 24}px) rotateY(${-offset * 52}deg) scale(${1 - distance * .16})`;
        });
    };

    const rotateCarousel = direction => {
        carouselIndex = (carouselIndex + direction + stickerChoices.length) % stickerChoices.length;
        renderCarousel();
    };

    const startCarousel = () => {
        clearInterval(carouselTimer);
        carouselTimer = setInterval(() => rotateCarousel(1), 2400);
    };

    previousSticker.addEventListener('click', () => { rotateCarousel(-1); startCarousel(); });
    nextSticker.addEventListener('click', () => { rotateCarousel(1); startCarousel(); });
    carousel.addEventListener('pointerenter', () => clearInterval(carouselTimer));
    carousel.addEventListener('pointerleave', startCarousel);

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
        sticker.addEventListener('pointerdown', () => dropzone.classList.add('is-ready'));
        sticker.addEventListener('dragstart', event => {
            clearInterval(carouselTimer);
            event.dataTransfer.setData('text/plain', sticker.dataset.sticker);
            event.dataTransfer.effectAllowed = 'copy';
            dropzone.classList.add('is-ready');
            kindleCover.classList.add('is-dragging');
        });
        sticker.addEventListener('dragend', () => {
            dropzone.classList.remove('is-ready', 'is-over');
            kindleCover.classList.remove('is-dragging');
            startCarousel();
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
        kindleCover.classList.remove('is-dragging');
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
    startCarousel();
    window.addEventListener('resize', renderCarousel);

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
