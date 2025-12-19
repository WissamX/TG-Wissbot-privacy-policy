// app.js – paragraph rendering that preserves newlines
(function(){
  const els = {
    content: document.getElementById('content'),
    langToggle: document.getElementById('langToggle'),
    themeToggle: document.getElementById('themeToggle'),
    tabPrivacy: document.getElementById('tabPrivacy'),
    tabTerms: document.getElementById('tabTerms')
  };

  const state = {
    lang: detectLang(),
    theme: detectTheme(),
    page: 'privacy',
    data: null
  };

  applyLang(state.lang);
  applyTheme(state.theme);

  fetch('data/content.json')
    .then(r => r.json())
    .then(json => { state.data = json; render(); })
    .catch(err => { console.error('Failed to load content.json', err); els.content.textContent = 'Failed to load content.'; });

  // Event listeners
  els.langToggle.addEventListener('click', () => {
    state.lang = (state.lang === 'en') ? 'ar' : 'en';
    applyLang(state.lang);
    render();
  });

  els.themeToggle.addEventListener('click', () => {
    state.theme = (state.theme === 'dark') ? 'light' : 'dark';
    applyTheme(state.theme);
  });

  [els.tabPrivacy, els.tabTerms].forEach(btn => {
    btn.addEventListener('click', () => {
      state.page = btn.dataset.page;
      updateTabs();
      render();
    });
  });

  function detectLang(){
    const nav = (navigator.languages && navigator.languages.length) ? navigator.languages[0] : (navigator.language || 'en');
    return /^ar(\b|[-_])/i.test(nav) ? 'ar' : 'en';
  }

  function applyLang(lang){
    const html = document.documentElement;
    html.lang = lang; // keep lang for accessibility
    els.content.classList.toggle('rtl', lang === 'ar');

    if (state.data) {
      const privacyTitle = state.data.pages.privacy.title[lang];
      const termsTitle = state.data.pages.terms.title[lang];
      els.tabPrivacy.textContent = privacyTitle;
      els.tabTerms.textContent = termsTitle;
    }
    updateTabs();
  }

  function detectTheme(){
    try {
      if (window.matchMedia) {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
        if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
      }
    } catch(e){}
    return 'dark';
  }

  function applyTheme(theme){
    document.body.classList.remove('light','dark');
    document.body.classList.add(theme);
  }

  function updateTabs(){
    const privacyActive = (state.page === 'privacy');
    els.tabPrivacy.classList.toggle('active', privacyActive);
    els.tabPrivacy.setAttribute('aria-selected', privacyActive ? 'true' : 'false');
    els.tabTerms.classList.toggle('active', !privacyActive);
    els.tabTerms.setAttribute('aria-selected', !privacyActive ? 'true' : 'false');
  }

  // Convert text with \n\n to paragraphs and single \n to line breaks
  function appendTextWithNewlines(container, text){
    // Split on 2+ consecutive newlines to form separate <p> blocks
    const paragraphs = String(text).split(/\n{2,}/);
    paragraphs.forEach(par => {
      const pEl = document.createElement('p');
      // Within a paragraph, convert single newlines to <br>
      const parts = par.split(/\n/);
      parts.forEach((part, idx) => {
        pEl.appendChild(document.createTextNode(part));
        if (idx < parts.length - 1) {
          pEl.appendChild(document.createElement('br'));
        }
      });
      container.appendChild(pEl);
    });
  }

  function render(){
    if (!state.data) return;
    const page = state.data.pages[state.page];
    const lang = state.lang;
    const container = document.createElement('div');

    // Title and summary
    const h1 = document.createElement('h1');
    h1.textContent = page.title[lang];
    container.appendChild(h1);

    const summary = document.createElement('p');
    summary.className = 'summary';
    summary.textContent = page.summary[lang];
    container.appendChild(summary);

    // Sections
    page.sections.forEach(sec => {
      const section = document.createElement('section');
      section.id = sec.id;

      const h2 = document.createElement('h2');
      h2.textContent = sec.heading[lang];
      section.appendChild(h2);

      const bodyVal = sec.body[lang];
      if (Array.isArray(bodyVal)) {
        bodyVal.forEach(item => {
          appendTextWithNewlines(section, item);
        });
      } else if (typeof bodyVal === 'string') {
        appendTextWithNewlines(section, bodyVal);
      }

      container.appendChild(section);
    });

    // In-page footer (separator + texts)
    const footer = document.createElement('div');
    footer.className = 'content-footer';

    const sep = document.createElement('div');
    sep.className = 'sep';
    footer.appendChild(sep);

    const linkP = document.createElement('p');
    const linkA = document.createElement('a');
    linkA.href = state.data.footer.link_url;
    linkA.target = '_blank';
    linkA.rel = 'noopener';
    linkA.textContent = state.data.footer.link_text[lang]; // translated
    linkP.appendChild(linkA);
    footer.appendChild(linkP);

    const copyP = document.createElement('p');
    copyP.className = 'copyright';
    copyP.textContent = '© 2025 @University_WissBot. All rights reserved.'; // fixed, non-translating
    footer.appendChild(copyP);

    // Inject
    els.content.innerHTML = '';
    els.content.appendChild(container);
    els.content.appendChild(footer);
  }
})();
