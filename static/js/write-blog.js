(() => {
  const root = document.documentElement;
  const control = document.querySelector('.language-switch');
  if (!control) return;

  const applyLanguage = (language, save = true) => {
    const chinese = language === 'zh';
    root.dataset.blogLanguage = chinese ? 'zh' : 'en';
    root.lang = chinese ? 'zh-Hant' : 'en';
    control.setAttribute('aria-pressed', String(chinese));
    control.setAttribute('aria-label', chinese ? 'Switch language to English' : 'Switch language to Chinese');
    document.querySelectorAll('.journal-photo img').forEach((image) => {
      image.alt = chinese ? image.dataset.altZh : image.dataset.altEn;
    });
    if (save) localStorage.setItem('daisy-blog-language', chinese ? 'zh' : 'en');
  };

  applyLanguage(localStorage.getItem('daisy-blog-language') === 'zh' ? 'zh' : 'en', false);
  control.addEventListener('click', () => {
    applyLanguage(root.dataset.blogLanguage === 'zh' ? 'en' : 'zh');
  });
})();
