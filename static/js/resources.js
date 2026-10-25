(() => {
    const uploadButton = document.querySelector('#uploadButton');
    const stickerInput = document.querySelector('#stickerInput');
    const stickerTray = document.querySelector('#stickerTray');
    const dropzone = document.querySelector('#coverDropzone');
    const tabs = [...document.querySelectorAll('.tab')];
    const title = document.querySelector('#libraryTitle');
    const count = document.querySelector('#resourceCount');

    if (!uploadButton || !stickerInput || !stickerTray || !dropzone) return;

    const openTray = () => stickerTray.classList.add('is-open');

    uploadButton.addEventListener('click', () => {
        openTray();
        stickerInput.click();
    });

    const placeSticker = (src, clientX, clientY) => {
        const rect = dropzone.getBoundingClientRect();
        const sticker = document.createElement('img');
        sticker.src = src;
        sticker.alt = 'Uploaded sticker';
        sticker.className = 'placed-sticker';
        sticker.style.left = `${Math.max(0, Math.min(rect.width, clientX - rect.left))}px`;
        sticker.style.top = `${Math.max(0, Math.min(rect.height, clientY - rect.top))}px`;
        dropzone.appendChild(sticker);
        enablePointerDrag(sticker);
    };

    const addPreview = file => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.addEventListener('load', () => {
            stickerTray.querySelector('p')?.remove();
            const preview = document.createElement('img');
            preview.src = reader.result;
            preview.alt = file.name;
            preview.className = 'sticker-preview';
            preview.draggable = true;
            preview.addEventListener('dragstart', event => event.dataTransfer.setData('text/plain', preview.src));
            preview.addEventListener('dblclick', () => {
                const rect = dropzone.getBoundingClientRect();
                placeSticker(preview.src, rect.left + rect.width / 2, rect.top + rect.height / 2);
            });
            stickerTray.appendChild(preview);
        });
        reader.readAsDataURL(file);
    };

    stickerInput.addEventListener('change', () => {
        openTray();
        [...stickerInput.files].forEach(addPreview);
        stickerInput.value = '';
    });

    dropzone.addEventListener('dragover', event => { event.preventDefault(); dropzone.classList.add('is-over'); });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('is-over'));
    dropzone.addEventListener('drop', event => {
        event.preventDefault();
        dropzone.classList.remove('is-over');
        const src = event.dataTransfer.getData('text/plain');
        if (src) placeSticker(src, event.clientX, event.clientY);
    });

    function enablePointerDrag(sticker) {
        sticker.addEventListener('pointerdown', event => {
            event.preventDefault();
            sticker.setPointerCapture(event.pointerId);
            const move = moveEvent => {
                const rect = dropzone.getBoundingClientRect();
                const x = Math.max(0, Math.min(rect.width, moveEvent.clientX - rect.left));
                const y = Math.max(0, Math.min(rect.height, moveEvent.clientY - rect.top));
                sticker.style.left = `${x}px`;
                sticker.style.top = `${y}px`;
            };
            const finish = () => {
                sticker.removeEventListener('pointermove', move);
                sticker.removeEventListener('pointerup', finish);
                sticker.removeEventListener('pointercancel', finish);
            };
            sticker.addEventListener('pointermove', move);
            sticker.addEventListener('pointerup', finish);
            sticker.addEventListener('pointercancel', finish);
        });
    }

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
})();
