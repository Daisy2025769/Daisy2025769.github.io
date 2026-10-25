(() => {
    const dropzone = document.querySelector('#coverDropzone');
    const carousel = document.querySelector('#stickerCarousel');
    const stickerChoices = [...document.querySelectorAll('.sticker-choice')];
    const previousSticker = document.querySelector('.carousel-prev');
    const nextSticker = document.querySelector('.carousel-next');
    const tabs = [...document.querySelectorAll('.tab')];
    const title = document.querySelector('#libraryTitle');
    const count = document.querySelector('#resourceCount');
    const sortToggle = document.querySelector('#sortToggle');
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
        sticker.insertAdjacentHTML('beforeend', '<button class="sticker-handle edge-resize-handle crop-n" type="button" data-axis="y" data-direction="-1" aria-label="Stretch sticker upward"></button><button class="sticker-handle edge-resize-handle crop-e" type="button" data-axis="x" data-direction="1" aria-label="Stretch sticker right"></button><button class="sticker-handle edge-resize-handle crop-s" type="button" data-axis="y" data-direction="1" aria-label="Stretch sticker downward"></button><button class="sticker-handle edge-resize-handle crop-w" type="button" data-axis="x" data-direction="-1" aria-label="Stretch sticker left"></button><button class="sticker-handle resize-handle crop-nw" type="button" aria-label="Resize sticker proportionally from top left"></button><button class="sticker-handle resize-handle crop-sw" type="button" aria-label="Resize sticker proportionally from bottom left"></button><button class="sticker-handle resize-handle crop-se" type="button" aria-label="Resize sticker proportionally from bottom right"></button><button class="sticker-handle rotate-handle" type="button" aria-label="Rotate sticker"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7v5h-5"></path><path d="M19 12a7 7 0 1 0-2 5"></path></svg></button>');
        sticker.setAttribute('role', 'group');
        sticker.setAttribute('aria-label', source.getAttribute('aria-label'));
        sticker.dataset.scale = '1';
        sticker.dataset.rotation = '0';
        sticker.style.left = `${Math.max(0, Math.min(rect.width, clientX - rect.left))}px`;
        sticker.style.top = `${Math.max(0, Math.min(rect.height, clientY - rect.top))}px`;
        dropzone.appendChild(sticker);
        enablePointerDrag(sticker);
        selectSticker(sticker);
    };

    const selectSticker = selected => {
        dropzone.querySelectorAll('.placed-sticker').forEach(sticker => sticker.classList.toggle('is-selected', sticker === selected));
    };

    const applyStickerTransform = sticker => {
        sticker.style.setProperty('--sticker-scale', sticker.dataset.scale || '1');
        sticker.style.setProperty('--sticker-rotation', `${sticker.dataset.rotation || 0}deg`);
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
    dropzone.addEventListener('pointerdown', event => {
        if (!event.target.closest('.placed-sticker')) selectSticker(null);
    });
    dropzone.addEventListener('drop', event => {
        event.preventDefault();
        dropzone.classList.remove('is-over');
        const stickerId = event.dataTransfer.getData('text/plain');
        const source = stickerChoices.find(sticker => sticker.dataset.sticker === stickerId);
        if (source) placeSticker(source, event.clientX, event.clientY);
        dropzone.classList.remove('is-ready');
    });

    function enablePointerDrag(sticker) {
        const resizeHandles = [...sticker.querySelectorAll('.resize-handle')];
        const edgeResizeHandles = [...sticker.querySelectorAll('.edge-resize-handle')];
        const rotateHandle = sticker.querySelector('.rotate-handle');

        resizeHandles.forEach(resizeHandle => resizeHandle.addEventListener('pointerdown', event => {
                event.preventDefault();
                event.stopPropagation();
                selectSticker(sticker);
                resizeHandle.setPointerCapture(event.pointerId);
                const rect = sticker.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                const startDistance = Math.max(1, Math.hypot(event.clientX - centerX, event.clientY - centerY));
                const startScale = Number(sticker.dataset.scale) || 1;
                const move = moveEvent => {
                    const distance = Math.hypot(moveEvent.clientX - centerX, moveEvent.clientY - centerY);
                    sticker.dataset.scale = String(Math.max(.45, Math.min(2.4, startScale * distance / startDistance)));
                    applyStickerTransform(sticker);
                };
                const finish = () => {
                    resizeHandle.removeEventListener('pointermove', move);
                    resizeHandle.removeEventListener('pointerup', finish);
                    resizeHandle.removeEventListener('pointercancel', finish);
                };
                resizeHandle.addEventListener('pointermove', move);
                resizeHandle.addEventListener('pointerup', finish);
                resizeHandle.addEventListener('pointercancel', finish);
            }));

        edgeResizeHandles.forEach(edgeHandle => edgeHandle.addEventListener('pointerdown', event => {
            event.preventDefault();
            event.stopPropagation();
            selectSticker(sticker);
            edgeHandle.setPointerCapture(event.pointerId);
            const startX = event.clientX;
            const startY = event.clientY;
            const startWidth = sticker.offsetWidth;
            const startHeight = sticker.offsetHeight;
            const scale = Number(sticker.dataset.scale) || 1;
            const rotation = (Number(sticker.dataset.rotation) || 0) * Math.PI / 180;
            const direction = Number(edgeHandle.dataset.direction);
            const move = moveEvent => {
                const deltaX = (moveEvent.clientX - startX) / scale;
                const deltaY = (moveEvent.clientY - startY) / scale;
                const localX = deltaX * Math.cos(rotation) + deltaY * Math.sin(rotation);
                const localY = -deltaX * Math.sin(rotation) + deltaY * Math.cos(rotation);
                if (edgeHandle.dataset.axis === 'x') sticker.style.width = `${Math.max(34, Math.min(230, startWidth + localX * direction))}px`;
                else sticker.style.height = `${Math.max(34, Math.min(230, startHeight + localY * direction))}px`;
            };
            const finish = () => {
                edgeHandle.removeEventListener('pointermove', move);
                edgeHandle.removeEventListener('pointerup', finish);
                edgeHandle.removeEventListener('pointercancel', finish);
            };
            edgeHandle.addEventListener('pointermove', move);
            edgeHandle.addEventListener('pointerup', finish);
            edgeHandle.addEventListener('pointercancel', finish);
        }));

        rotateHandle.addEventListener('pointerdown', event => {
            event.preventDefault();
            event.stopPropagation();
            selectSticker(sticker);
            rotateHandle.setPointerCapture(event.pointerId);
            const rect = sticker.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const startPointerAngle = Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180 / Math.PI;
            const startRotation = Number(sticker.dataset.rotation) || 0;
            const move = moveEvent => {
                const pointerAngle = Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX) * 180 / Math.PI;
                sticker.dataset.rotation = String(startRotation + pointerAngle - startPointerAngle);
                applyStickerTransform(sticker);
            };
            const finish = () => {
                rotateHandle.removeEventListener('pointermove', move);
                rotateHandle.removeEventListener('pointerup', finish);
                rotateHandle.removeEventListener('pointercancel', finish);
            };
            rotateHandle.addEventListener('pointermove', move);
            rotateHandle.addEventListener('pointerup', finish);
            rotateHandle.addEventListener('pointercancel', finish);
        });

        sticker.addEventListener('pointerdown', event => {
            if (event.target.closest('.sticker-handle')) return;
            event.preventDefault();
            selectSticker(sticker);
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
            books: ['Books', '4 saved books'],
            articles: ['Articles', '6 saved articles'],
            podcasts: ['Podcasts', '4 saved podcasts']
        };
        title.textContent = labels[selected][0];
        count.textContent = labels[selected][1];
    }));

    sortToggle.addEventListener('click', () => {
        const nextOrder = sortToggle.dataset.order === 'latest' ? 'earliest' : 'latest';
        sortToggle.dataset.order = nextOrder;
        sortToggle.title = nextOrder === 'latest' ? 'Latest first' : 'Earliest first';
        sortToggle.setAttribute('aria-label', `Order: ${nextOrder} first. Click for ${nextOrder === 'latest' ? 'earliest' : 'latest'} first.`);
        ['#booksPanel', '#articlesPanel', '#podcastsPanel'].forEach(selector => {
            const panel = document.querySelector(selector);
            [...panel.children].reverse().forEach(item => panel.appendChild(item));
        });
    });

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
