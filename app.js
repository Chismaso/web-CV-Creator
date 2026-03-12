// Default values (px)
    const DEFAULTS = {
      // Font sizes
      '--fs-name':             34,
      '--fs-subtitle':         12.5,
      '--fs-bio':              13,
      '--fs-section':          13,
      '--fs-item-title':       13.5,
      '--fs-institution':      13,
      '--fs-body':             13,
      '--fs-meta':             12,
      '--fs-tag':              12,
      '--fs-contact':          12.5,
      // Spacing tokens
      '--sp-header-pt':        30,
      '--sp-header-pb':        22,
      '--sp-header-gap':       24,
      '--sp-contact-py':       11,
      '--sp-subtitle-mt':       5,
      '--sp-subtitle-mb':      11,
      '--sp-body-pt':          22,
      '--sp-body-pb':          28,
      '--sp-col-gap':          28,
      '--sp-section-mb':       16,
      '--sp-section-title-mb': 11,
      '--sp-item-mb':          12,
    };

    const root = document.documentElement;
    const ACCENT_STORE = 'cv-accent';
    const DEFAULT_ACCENT = '#1a7ba7';
    let accentPickr = null;
    let pendingAccentColor = DEFAULT_ACCENT;
    let openingAccentColor = DEFAULT_ACCENT;

    function normalizeHexColor(value) {
      if (!value) return null;
      const v = String(value).trim();
      return /^#[0-9a-fA-F]{6}$/.test(v) ? v.toLowerCase() : null;
    }

    function getStoredAccentColor() {
      return normalizeHexColor(localStorage.getItem(ACCENT_STORE)) || DEFAULT_ACCENT;
    }

    function updateColorPreview(hex) {
      const preview = document.getElementById('colorPreview');
      if (preview) preview.style.background = hex;
    }

    function setPendingAccentColor(hex) {
      const normalized = normalizeHexColor(hex);
      if (!normalized) return false;
      pendingAccentColor = normalized;
      updateColorPreview(normalized);
      return true;
    }

    function pickrColorToHex(color) {
      if (!color || !color.toRGBA) return null;
      const rgba = color.toRGBA();
      if (!Array.isArray(rgba) || rgba.length < 3) return null;
      const rgb = rgba.slice(0, 3).map(function (v) {
        return Math.max(0, Math.min(255, Math.round(v)));
      });
      return '#' + rgb.map(function (n) {
        return n.toString(16).padStart(2, '0');
      }).join('');
    }

    function ensureAccentPickr() {
      if (accentPickr) return accentPickr;

      const mount = document.getElementById('accentPickrMount');
      if (!mount || !window.Pickr) return null;

      accentPickr = window.Pickr.create({
        el: mount,
        theme: 'classic',
        default: getStoredAccentColor(),
        inline: true,
        showAlways: true,
        comparison: false,
        components: {
          preview: false,
          opacity: false,
          hue: true,
          interaction: {
            hex: true,
            rgba: true,
            hsla: true,
            input: true,
            clear: false,
            save: false,
            cancel: false
          }
        }
      });

      const colorPanel = document.getElementById('colorPanel');
      const obsoletePickrTrigger = colorPanel ? colorPanel.querySelector('.pickr') : null;
      if (obsoletePickrTrigger) {
        obsoletePickrTrigger.remove();
      }

      accentPickr.on('change', function (color) {
        const hex = pickrColorToHex(color);
        if (!hex) return;
        if (!setPendingAccentColor(hex)) return;
        applyAccentColor(hex, false);
      });

      accentPickr.on('init', function () {
        const current = getCurrentAccentColor();
        setPendingAccentColor(current);
      });

      return accentPickr;
    }

    function applyAccentColor(value, persist = true) {
      const normalized = normalizeHexColor(value);
      if (!normalized) return false;

      root.style.setProperty('--accent', normalized);
      setPendingAccentColor(normalized);

      if (persist) {
        localStorage.setItem(ACCENT_STORE, normalized);
      }
      return true;
    }

    function restoreAccentColor() {
      const fallback = getComputedStyle(root).getPropertyValue('--accent').trim() || DEFAULT_ACCENT;
      const initial = getStoredAccentColor() || normalizeHexColor(fallback) || DEFAULT_ACCENT;
      applyAccentColor(initial, false);
    }

    function getCurrentAccentColor() {
      const current = getComputedStyle(root).getPropertyValue('--accent').trim();
      return normalizeHexColor(current) || DEFAULT_ACCENT;
    }

    function openColorPanel() {
      const modal = document.getElementById('colorModal');
      if (!modal) return;

      const pickr = ensureAccentPickr();
      openingAccentColor = getCurrentAccentColor();
      setPendingAccentColor(openingAccentColor);

      if (pickr) {
        pickr.setColor(openingAccentColor);
      }

      modal.classList.add('color-modal--open');
      modal.setAttribute('aria-hidden', 'false');
    }

    function toggleColorPanel() {
      const modal = document.getElementById('colorModal');
      if (!modal) return;
      if (modal.classList.contains('color-modal--open')) {
        closeColorPanel(false);
        return;
      }
      openColorPanel();
    }

    function closeColorPanel(commit = false) {
      const modal = document.getElementById('colorModal');
      if (!modal) return;

      if (!commit) {
        applyAccentColor(openingAccentColor, false);
      }

      modal.classList.remove('color-modal--open');
      modal.setAttribute('aria-hidden', 'true');
    }

    function acceptColorPanel() {
      applyAccentColor(pendingAccentColor, true);
      closeColorPanel(true);
    }

    async function runEyedropper() {
      if (!window.EyeDropper) return;

      const eyedropper = new window.EyeDropper();
      try {
        const result = await eyedropper.open();
        const hex = normalizeHexColor(result && result.sRGBHex);
        if (!hex) return;

        const pickr = ensureAccentPickr();
        if (pickr) pickr.setColor(hex);
        applyAccentColor(hex, false);
        setPendingAccentColor(hex);
      } catch (err) {
        // User can cancel eyedropper selection; ignore silently.
      }
    }

    function applyFont(input) {
      const v = parseFloat(input.value);
      const varName = input.dataset.var;
      root.style.setProperty(varName, v + 'px');
      input.closest('.font-row').querySelector('.font-val').textContent = v + 'px';
      const saved = JSON.parse(localStorage.getItem('cv-fonts') || '{}');
      saved[varName] = v;
      localStorage.setItem('cv-fonts', JSON.stringify(saved));
      clearTimeout(window._fitTimer);
      window._fitTimer = setTimeout(autoFitA4, 80);
    }

    function syncSliders() {
      document.querySelectorAll('.font-panel input[type=range]').forEach(input => {
        const varName = input.dataset.var;
        const saved = JSON.parse(localStorage.getItem('cv-fonts') || '{}');
        const target = saved[varName] ?? DEFAULTS[varName];
        input.value = target;
        input.closest('.font-row').querySelector('.font-val').textContent = target + 'px';
      });
    }

    function toggleFontPanel() {
      const panel = document.getElementById('fontPanel');
      panel.classList.toggle('font-panel--open');
      if (panel.classList.contains('font-panel--open')) syncSliders();
    }

    (function () {
      const panel = document.getElementById('fontPanel');
      const header = panel.querySelector('.font-panel__header');
      let dragging = false, startX, startY, startLeft, startTop;

      header.addEventListener('mousedown', function (e) {
        if (e.target.closest('.font-panel__close')) return;
        dragging = true;
        const rect = panel.getBoundingClientRect();
        // Switch from right-based to left-based positioning
        panel.style.right  = 'auto';
        panel.style.left   = rect.left + 'px';
        panel.style.top    = rect.top  + 'px';
        startX    = e.clientX;
        startY    = e.clientY;
        startLeft = rect.left;
        startTop  = rect.top;
        e.preventDefault();
      });

      document.addEventListener('mousemove', function (e) {
        if (!dragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        panel.style.left = (startLeft + dx) + 'px';
        panel.style.top  = (startTop  + dy) + 'px';
      });

      document.addEventListener('mouseup', function () {
        dragging = false;
      });
    })();

    function resetFonts() {
      localStorage.removeItem('cv-fonts');
      Object.entries(DEFAULTS).forEach(([k, v]) => root.style.setProperty(k, v + 'px'));
      syncSliders();
      setTimeout(autoFitA4, 80);
    }

    function setHidden(el, hidden) {
      if (!el) return;
      el.classList.toggle('is-hidden', hidden);
    }

    function handlePhotoUpload(input) {
      const file = input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function (e) {
        localStorage.setItem('cv-photo', e.target.result);
        showPhoto(e.target.result);
      };
      reader.readAsDataURL(file);
      input.value = '';
    }

    function showPhoto(src) {
      const img = document.getElementById('profileImg');
      const ph  = document.getElementById('photoPlaceholder');
      img.src = src;
      setHidden(img, false);
      setHidden(ph, true);
    }

    function showPhotoPlaceholder() {
      const img = document.getElementById('profileImg');
      const ph  = document.getElementById('photoPlaceholder');
      setHidden(img, true);
      setHidden(ph, false);
      localStorage.removeItem('cv-photo');
    }

    function resetAll() {
      if (!confirm('¿Resetear todo? Se borrará el contenido y quedará una plantilla en blanco lista para rellenar.')) return;

      // 1 · Limpiar localStorage
      ['cv-fonts', 'cv-content-' + CONTENT_VER,
       'cv-content', 'cv-content-v1', 'cv-content-v2',
        'cv-contact-order', SECTION_STORE, 'cv-sections', 'cv-tags', 'cv-photo', ACCENT_STORE
      ].forEach(k => localStorage.removeItem(k));

      // 2 · Fuentes y espaciado al valor por defecto
      Object.entries(DEFAULTS).forEach(([k, v]) => root.style.setProperty(k, v + 'px'));
      applyAccentColor(DEFAULT_ACCENT, false);
      syncSliders();

      // 3 · Foto -> placeholder
      showPhotoPlaceholder();

      // 4 · Cabecera
      document.querySelector('.header-name').textContent     = 'Tu Nombre Apellidos';
      document.querySelector('.header-subtitle').textContent = 'TU CARGO O PROFESIÓN';
      document.querySelector('.header-bio').textContent      = 'Escribe aquí tu descripción personal: quién eres, qué te diferencia y qué valor aportas. Mantén un tono profesional y conciso, entre 2 y 4 líneas.';

      // 5 · Barra de contacto
      document.querySelector('.contact-bar').innerHTML =
        '<a href="#" class="contact-item"><i class="fa-regular fa-envelope"></i><span>tucorreo@email.com</span></a>' +
        '<div class="contact-item"><i class="fa-solid fa-phone"></i><span>000 000 000</span></div>' +
        '<div class="contact-item"><i class="fa-solid fa-location-dot"></i><span>Ciudad, País</span></div>' +
        '<a href="#" class="contact-item"><i class="fa-brands fa-linkedin"></i><span>linkedin.com/in/tu-perfil</span></a>' +
        '<a href="#" class="contact-item"><i class="fa-brands fa-github"></i><span>github.com/tu-usuario</span></a>';

      // 6 · Secciones con contenido genérico
      const _lang = (name, val, label) =>
        '<div class="language" data-lang-value="' + val + '"><span class="language-name">' + name + '</span>' +
        '<div class="lang-bar-col"><div class="lang-dots">' +
        [1,2,3,4,5].map(i => '<span class="lang-dot' + (i<=val?' lang-dot--filled':'') + '" data-dot="' + i + '"></span>').join('') +
        '</div><span class="lang-bar-label">' + label + '</span></div></div>';

      const gs = {
        educacion:
          '<h2 class="section-title">Educación</h2>' +
          '<div class="cv-item"><h3 class="item-title">Título de la formación</h3>' +
          '<p class="item-institution">Institución</p>' +
          '<div class="item-meta"><span class="item-date">MM/AAAA – MM/AAAA</span><span class="item-location">Ubicación</span></div>' +
          '<p class="item-label">Enfoque del programa</p>' +
          '<ul class="item-list"><li>Describe qué estudiaste y qué aprendiste.</li></ul></div>',

        experiencia:
          '<h2 class="section-title">Experiencia Laboral</h2>' +
          '<div class="cv-item"><h3 class="item-title">Cargo / Puesto</h3>' +
          '<p class="item-institution">Empresa</p>' +
          '<div class="item-meta"><span class="item-date">MM/AAAA – MM/AAAA</span><span class="item-location">Ubicación</span></div>' +
          '<p class="item-desc">Descripción breve de la empresa.</p>' +
          '<p class="item-label">Logros / Tareas</p>' +
          '<ul class="item-list"><li>Describe tus responsabilidades y logros principales.</li></ul></div>',

        proyectos:
          '<h2 class="section-title">Proyectos Personales</h2>' +
          '<div class="cv-item"><h3 class="item-title">Nombre del proyecto</h3>' +
          '<div class="item-meta"><span class="item-date">MM/AAAA – MM/AAAA</span></div>' +
          '<ul class="item-list"><li>Describe el proyecto, tecnologías usadas y tu contribución.</li></ul></div>',

        formacion:
          '<h2 class="section-title">Formación Complementaria</h2>' +
          '<div class="cv-item"><h3 class="item-title">Nombre del curso – Plataforma / Centro</h3>' +
          '<div class="item-meta"><span class="item-date">MM/AAAA – MM/AAAA</span></div>' +
          '<p class="item-desc item-desc--italic">Descripción del curso, horas y calificación obtenida.</p></div>',

        idiomas:
          '<h2 class="section-title">Idiomas</h2><div class="languages">' +
          _lang('Idioma 1', 5, 'Nivel nativo / experto') +
          _lang('Idioma 2', 3, 'Nivel intermedio') +
          '</div>'
      };

      document.querySelectorAll('.cv-section[data-section]').forEach(sec => {
        if (gs[sec.dataset.section]) sec.innerHTML = gs[sec.dataset.section];
      });

      // 7 · Etiquetas genéricas
      function _setTags(id, tags) {
        const c = document.getElementById(id);
        if (!c) return;
        c.innerHTML = '';
        tags.forEach(t => { const s = document.createElement('span'); s.className = 'tag'; s.textContent = t; c.appendChild(s); });
      }
      _setTags('tags-skills',     ['Habilidad técnica 1', 'Habilidad técnica 2', 'Herramienta / software']);
      _setTags('tags-softskills', ['Trabajo en equipo', 'Comunicación clara', 'Resolución de problemas']);
      _setTags('tags-intereses',  ['Interés 1', 'Interés 2', 'Interés 3']);

      // 8 · Re-inicializar
      initLangDots();
      assignKeys();
      if (editMode) {
        editMode = false;
        const btn = document.getElementById('editBtn');
        btn.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Editar CV';
        btn.classList.remove('edit-mode-btn--active');
        document.body.classList.remove('editing-mode');
      }
      // Clear cached removed sections so add-buttons rebuild from scratch
      Object.keys(_removedSections).forEach(k => delete _removedSections[k]);
      SectionDragger.clearLayout();
      setTimeout(autoFitA4, 80);
    }

    // Restore saved sizes on load
    (function () {
      const saved = JSON.parse(localStorage.getItem('cv-fonts') || '{}');
      Object.entries(DEFAULTS).forEach(([k, v]) => {
        root.style.setProperty(k, (saved[k] ?? v) + 'px');
      });
    })();

    const EDIT_SEL = [
      '.header-name', '.header-subtitle', '.header-bio',
      '.section-title', '.item-title', '.item-institution',
      '.item-date', '.item-location', '.item-desc', '.item-label',
      '.item-list li', '.language-name',
      '.contact-item span'
    ].join(', ');

    // Version key - bump this to auto-discard stale localStorage data
    const CONTENT_VER = 'v3';

    let editMode = false;

    function getEditables() {
      return Array.from(document.querySelectorAll(EDIT_SEL));
    }

    function sanitizeHTML(str) {
      return str
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '')
        .replace(/javascript\s*:/gi, '');
    }

    // Assign stable data-key to every editable element (based on selector + sibling index)
    function assignKeys() {
      const counts = {};
      getEditables().forEach(el => {
        // Build a key from the first matching class + its position among siblings of same class
        const cls = Array.from(el.classList).find(c =>
          ['header-name','header-subtitle','header-bio','section-title','item-title',
           'item-institution','item-date','item-location','item-desc','item-label',
           'language-name'].includes(c)
        ) || (el.closest('.contact-item') ? 'contact-span' : el.tagName.toLowerCase());
        counts[cls] = (counts[cls] || 0);
        const key = cls + '__' + counts[cls];
        counts[cls]++;
        if (!el.dataset.key) el.dataset.key = key;
      });
    }

    function persistContent() {
      const data = {};
      getEditables().forEach(el => {
        if (el.dataset.key) data[el.dataset.key] = el.innerHTML;
      });
      localStorage.setItem('cv-content-' + CONTENT_VER, JSON.stringify(data));
    }

    function toggleEditMode() {
      editMode = !editMode;
      const btn = document.getElementById('editBtn');
      document.body.classList.toggle('editing-mode', editMode);

      getEditables().forEach((el) => {
        if (editMode) {
          el.setAttribute('contenteditable', 'true');
        } else {
          el.removeAttribute('contenteditable');
        }
      });

      if (editMode) {
        enableTagEditing();
        enableSectionEditing();
        enableContactDrag();
        SectionDragger.enable();
        btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar';
        btn.classList.add('edit-mode-btn--active');
      } else {
        disableTagEditing();
        disableSectionEditing();
        disableContactDrag();
        SectionDragger.disable();
        btn.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Editar CV';
        btn.classList.remove('edit-mode-btn--active');
        persistContent();
        setTimeout(autoFitA4, 80);
      }
    }

    let _dragSrc = null;

    function enableContactDrag() {
      const bar = document.querySelector('.contact-bar');
      if (!bar) return;
      bar.querySelectorAll('.contact-item').forEach(item => {
        // inject handle if missing
        if (!item.querySelector('.contact-drag-handle')) {
          const handle = document.createElement('span');
          handle.className = 'contact-drag-handle';
          handle.innerHTML = '<i class="fa-solid fa-grip-vertical"></i>';
          item.insertBefore(handle, item.firstChild);
        }
        item.setAttribute('draggable', 'true');
        item.addEventListener('dragstart',  _cdDragStart);
        item.addEventListener('dragend',    _cdDragEnd);
        item.addEventListener('dragover',   _cdDragOver);
        item.addEventListener('dragleave',  _cdDragLeave);
        item.addEventListener('drop',       _cdDrop);
      });
    }

    function disableContactDrag() {
      const bar = document.querySelector('.contact-bar');
      if (!bar) return;
      bar.querySelectorAll('.contact-item').forEach(item => {
        item.removeAttribute('draggable');
        item.removeEventListener('dragstart',  _cdDragStart);
        item.removeEventListener('dragend',    _cdDragEnd);
        item.removeEventListener('dragover',   _cdDragOver);
        item.removeEventListener('dragleave',  _cdDragLeave);
        item.removeEventListener('drop',       _cdDrop);
        const handle = item.querySelector('.contact-drag-handle');
        if (handle) handle.remove();
      });
      persistContactOrder();
    }

    function _cdDragStart(e) {
      _dragSrc = this;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', '');
      setTimeout(() => this.classList.add('contact-item--dragging'), 0);
    }

    function _cdDragEnd() {
      this.classList.remove('contact-item--dragging');
      document.querySelectorAll('.contact-item--drag-over').forEach(el =>
        el.classList.remove('contact-item--drag-over')
      );
      _dragSrc = null;
    }

    function _cdDragOver(e) {
      if (!_dragSrc || _dragSrc === this) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      this.classList.add('contact-item--drag-over');
    }

    function _cdDragLeave() {
      this.classList.remove('contact-item--drag-over');
    }

    function _cdDrop(e) {
      e.preventDefault();
      this.classList.remove('contact-item--drag-over');
      if (!_dragSrc || _dragSrc === this) return;
      const bar   = this.closest('.contact-bar');
      const items = Array.from(bar.querySelectorAll('.contact-item'));
      const srcIdx  = items.indexOf(_dragSrc);
      const destIdx = items.indexOf(this);
      if (srcIdx < destIdx) {
        bar.insertBefore(_dragSrc, this.nextSibling);
      } else {
        bar.insertBefore(_dragSrc, this);
      }
      persistContactOrder();
    }

    function persistContactOrder() {
      const bar = document.querySelector('.contact-bar');
      if (!bar) return;
      const order = Array.from(bar.querySelectorAll('.contact-item')).map(item => {
        // store a copy of outerHTML without the handle and without draggable
        const clone = item.cloneNode(true);
        clone.removeAttribute('draggable');
        clone.querySelectorAll('.contact-drag-handle').forEach(h => h.remove());
        return clone.outerHTML;
      });
      localStorage.setItem('cv-contact-order', JSON.stringify(order));
    }

    function restoreContactOrder() {
      const saved = JSON.parse(localStorage.getItem('cv-contact-order') || 'null');
      if (!saved) return;
      const bar = document.querySelector('.contact-bar');
      if (!bar) return;
      bar.innerHTML = '';
      saved.forEach(html => {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        const el = tmp.firstElementChild;
        if (el) bar.appendChild(el);
      });
    }

    const TAG_GROUP_IDS = ['tags-skills', 'tags-softskills', 'tags-intereses'];

    function prepareTagForEdit(tag) {
      if (tag.querySelector('.tag-text')) return;
      const text = tag.textContent.trim();
      tag.textContent = '';
      const textSpan = document.createElement('span');
      textSpan.className = 'tag-text';
      textSpan.setAttribute('contenteditable', 'true');
      textSpan.textContent = text;
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'tag-del';
      del.innerHTML = '&times;';
      del.onclick = function (e) {
        e.stopPropagation();
        tag.remove();
        persistTags();
      };
      tag.appendChild(textSpan);
      tag.appendChild(del);
    }

    function enableTagEditing() {
      TAG_GROUP_IDS.forEach(id => {
        const container = document.getElementById(id);
        if (!container) return;
        container.querySelectorAll('.tag').forEach(prepareTagForEdit);
        if (container.querySelector('.tag-add-btn')) return;
        const addBtn = document.createElement('button');
        addBtn.type = 'button';
        addBtn.className = 'tag-add-btn';
        addBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Añadir';
        addBtn.onclick = () => addTag(id);
        container.appendChild(addBtn);
      });
    }

    function disableTagEditing() {
      TAG_GROUP_IDS.forEach(id => {
        const container = document.getElementById(id);
        if (!container) return;
        container.querySelectorAll('.tag').forEach(tag => {
          const textEl = tag.querySelector('.tag-text');
          const text = textEl ? textEl.textContent.trim() : tag.textContent.trim();
          tag.textContent = text; // strips children, leaves clean text
        });
        container.querySelectorAll('.tag-add-btn').forEach(b => b.remove());
      });
      persistTags();
      setTimeout(autoFitA4, 80);
    }

    function addTag(groupId) {
      const container = document.getElementById(groupId);
      if (!container) return;
      const tag = document.createElement('span');
      tag.className = 'tag';
      const textSpan = document.createElement('span');
      textSpan.className = 'tag-text';
      textSpan.setAttribute('contenteditable', 'true');
      textSpan.textContent = 'Nueva entrada';
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'tag-del';
      del.innerHTML = '&times;';
      del.onclick = function (e) {
        e.stopPropagation();
        tag.remove();
        persistTags();
      };
      tag.appendChild(textSpan);
      tag.appendChild(del);
      const addBtn = container.querySelector('.tag-add-btn');
      container.insertBefore(tag, addBtn);
      // Select all text so user can type immediately
      textSpan.focus();
      const range = document.createRange();
      range.selectNodeContents(textSpan);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }

    function persistTags() {
      const tagsData = {};
      TAG_GROUP_IDS.forEach(id => {
        const container = document.getElementById(id);
        if (!container) return;
        tagsData[id] = Array.from(container.querySelectorAll('.tag')).map(tag => {
          const textEl = tag.querySelector('.tag-text');
          return (textEl ? textEl.textContent : tag.textContent).trim();
        }).filter(t => t.length > 0);
      });
      localStorage.setItem('cv-tags', JSON.stringify(tagsData));
    }

    function restoreTags() {
      const tagsData = JSON.parse(localStorage.getItem('cv-tags') || 'null');
      if (!tagsData) return;
      TAG_GROUP_IDS.forEach(id => {
        const container = document.getElementById(id);
        if (!container || !tagsData[id]) return;
        container.querySelectorAll('.tag').forEach(t => t.remove());
        tagsData[id].forEach(text => {
          const tag = document.createElement('span');
          tag.className = 'tag';
          tag.textContent = text;
          container.appendChild(tag);
        });
      });
    }

    const SECTION_STORE = 'cv-sections-v1';

    function enableSectionEditing() {
      document.querySelectorAll('.cv-section[data-section]').forEach(sec => {
        const type = sec.dataset.itemType;
        const items = type === 'language'
          ? sec.querySelectorAll('.language')
          : sec.querySelectorAll('.cv-item');
        items.forEach(item => injectItemDelBtn(item));
        if (sec.querySelector('.item-add-btn')) return;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'item-add-btn';
        btn.innerHTML = '<i class="fa-solid fa-plus"></i> Añadir entrada';
        btn.onclick = () => addCvItem(sec);
        sec.appendChild(btn);
      });
      enableLanguageBarEditing();
    }

    function disableSectionEditing() {
      document.querySelectorAll('.cv-section[data-section]').forEach(sec => {
        sec.querySelectorAll('.item-add-btn, .item-del-btn').forEach(b => b.remove());
      });
      disableLanguageBarEditing();
      persistSections();
    }

    function injectItemDelBtn(item) {
      if (item.querySelector('.item-del-btn')) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'item-del-btn';
      btn.title = 'Eliminar entrada';
      btn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
      btn.onclick = function (e) {
        e.stopPropagation();
        item.remove();
        persistSections();
      };
      item.appendChild(btn);
    }

    function getLanguageLabel(val) {
      val = Math.round(val);
      if (val === 0) return 'Sin conocimiento';
      if (val === 1) return 'Conocimientos básicos';
      if (val === 2) return 'Conversación básica';
      if (val === 3) return 'Nivel intermedio';
      if (val === 4) return 'Nivel avanzado';
      return 'Nivel nativo / experto';
    }

    function updateLangDots(langEl, val) {
      val = Math.max(0, Math.min(5, Math.round(val)));
      langEl.dataset.langValue = val;
      langEl.querySelectorAll('.lang-dot').forEach((dot, i) => {
        dot.classList.toggle('lang-dot--filled', i < val);
      });
      const label = langEl.querySelector('.lang-bar-label');
      if (label) label.textContent = getLanguageLabel(val);
    }

    function initLangDots() {
      document.querySelectorAll('.language[data-lang-value]').forEach(langEl => {
        updateLangDots(langEl, parseInt(langEl.dataset.langValue) || 0);
      });
    }

    function langDotClickHandler(e) {
      const dot    = e.currentTarget;
      const langEl = dot.closest('.language');
      updateLangDots(langEl, parseInt(dot.dataset.dot));
      persistSections();
    }

    function enableLanguageBarEditing() {
      document.querySelectorAll('.language .lang-dots').forEach(dotsEl => {
        dotsEl.classList.add('lang-dots--editable');
        dotsEl.querySelectorAll('.lang-dot').forEach(dot => {
          dot.removeEventListener('click', langDotClickHandler);
          dot.addEventListener('click', langDotClickHandler);
        });
      });
    }

    function disableLanguageBarEditing() {
      document.querySelectorAll('.language .lang-dots').forEach(dotsEl => {
        dotsEl.classList.remove('lang-dots--editable');
        dotsEl.querySelectorAll('.lang-dot').forEach(dot => {
          dot.removeEventListener('click', langDotClickHandler);
        });
      });
    }

    // Migrate old language format (`.language-level` -> bar) without losing other section data
    function migrateLangBars() {
      const sec = document.querySelector('.cv-section[data-section="idiomas"]');
      if (!sec) return;
      const langs = sec.querySelector('.languages');
      if (!langs) return;
      const needsMigration = Array.from(langs.querySelectorAll('.language')).some(
        l => (l.querySelector('.language-level') || l.querySelector('.lang-bar-track')) && !l.querySelector('.lang-dots')
      );
      if (!needsMigration) return;
      const oldItems = Array.from(langs.querySelectorAll('.language'));
      langs.innerHTML = '';
      oldItems.forEach(old => {
        const nameText = old.querySelector('.language-name')?.textContent?.trim() || 'Idioma';
        const newLang  = buildCvItem('language');
        newLang.querySelector('.language-name').textContent = nameText;
        langs.appendChild(newLang);
      });
      persistSections();
      initLangDots();
    }

    function buildCvItem(type) {
      if (type === 'language') {
        const wrap = document.createElement('div');
        wrap.className = 'language';
        wrap.dataset.langValue = '5';
        const name = document.createElement('span');
        name.className = 'language-name';
        name.textContent = 'Idioma';
        const barCol = document.createElement('div');
        barCol.className = 'lang-bar-col';
        const dotsEl = document.createElement('div');
        dotsEl.className = 'lang-dots';
        for (let i = 1; i <= 5; i++) {
          const d = document.createElement('span');
          d.className = 'lang-dot' + (i <= 3 ? ' lang-dot--filled' : '');
          d.dataset.dot = i;
          dotsEl.appendChild(d);
        }
        const label = document.createElement('span');
        label.className = 'lang-bar-label';
        label.textContent = getLanguageLabel(3);
        barCol.appendChild(dotsEl);
        barCol.appendChild(label);
        wrap.appendChild(name);
        wrap.appendChild(barCol);
        return wrap;
      }

      const wrap = document.createElement('div');
      wrap.className = 'cv-item';

      const title = document.createElement('h3');
      title.className = 'item-title';
      title.textContent = type === 'work'     ? 'Cargo / Puesto'        :
                          type === 'project'  ? 'Nombre del proyecto'   :
                          type === 'training' ? 'Nombre del curso'      : 'Título de la formación';
      wrap.appendChild(title);

      if (type === 'full' || type === 'work') {
        const inst = document.createElement('p');
        inst.className = 'item-institution';
        inst.textContent = type === 'work' ? 'Empresa' : 'Institución';
        wrap.appendChild(inst);
      }

      const meta = document.createElement('div');
      meta.className = 'item-meta';
      const date = document.createElement('span');
      date.className = 'item-date';
      date.textContent = 'MM/AAAA – MM/AAAA';
      meta.appendChild(date);
      if (type === 'full' || type === 'work') {
        const loc = document.createElement('span');
        loc.className = 'item-location';
        loc.textContent = 'Ubicación';
        meta.appendChild(loc);
      }
      wrap.appendChild(meta);

      if (type === 'work' || type === 'training') {
        const desc = document.createElement('p');
        desc.className = type === 'training' ? 'item-desc item-desc--italic' : 'item-desc';
        desc.textContent = type === 'training' ? 'Descripción del curso.' : 'Descripción de la empresa.';
        wrap.appendChild(desc);
      }

      if (type === 'full' || type === 'work') {
        const label = document.createElement('p');
        label.className = 'item-label';
        label.textContent = type === 'work' ? 'Logros/Tareas' : 'Enfoque del programa';
        wrap.appendChild(label);
      }

      if (type !== 'training') {
        const ul = document.createElement('ul');
        ul.className = 'item-list';
        const li = document.createElement('li');
        li.textContent = 'Descripción detallada.';
        ul.appendChild(li);
        wrap.appendChild(ul);
      }

      return wrap;
    }

    function addCvItem(sec) {
      const type = sec.dataset.itemType;
      const item = buildCvItem(type);

      if (type === 'language') {
        // Only language-name is contenteditable; dots are click-driven
        const nameEl = item.querySelector('.language-name');
        if (nameEl) nameEl.setAttribute('contenteditable', 'true');
        const dotsEl = item.querySelector('.lang-dots');
        if (dotsEl) {
          dotsEl.classList.add('lang-dots--editable');
          dotsEl.querySelectorAll('.lang-dot').forEach(dot => {
            dot.addEventListener('click', langDotClickHandler);
          });
        }
        injectItemDelBtn(item);
        sec.querySelector('.languages').appendChild(item);
      } else {
        // Make all editable children contenteditable immediately (we're in edit mode)
        item.querySelectorAll('h3, p, span, li').forEach(el => el.setAttribute('contenteditable', 'true'));
        injectItemDelBtn(item);
        sec.insertBefore(item, sec.querySelector('.item-add-btn'));
      }

      assignKeys();
      persistSections();
      setTimeout(autoFitA4, 80);

      // Focus first field and select all
      const first = item.querySelector('[contenteditable]');
      if (first) {
        first.focus();
        const range = document.createRange();
        range.selectNodeContents(first);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }

    function persistSections() {
      const data = {};
      document.querySelectorAll('.cv-section[data-section]').forEach(sec => {
        const clone = sec.cloneNode(true);
        clone.querySelectorAll('.item-add-btn, .item-del-btn').forEach(b => b.remove());
        data[sec.dataset.section] = clone.innerHTML;
      });
      localStorage.setItem(SECTION_STORE, JSON.stringify(data));
    }

    function restoreSections() {
      const data = JSON.parse(localStorage.getItem(SECTION_STORE) || 'null');
      if (!data) return false;
      document.querySelectorAll('.cv-section[data-section]').forEach(sec => {
        if (data[sec.dataset.section] !== undefined) {
          sec.innerHTML = sanitizeHTML(data[sec.dataset.section]);
        }
      });
      return true;
    }

    // Prevent Enter on single-line elements (headings, spans)
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.isContentEditable) {
        const tag = e.target.tagName.toLowerCase();
        if (['h1', 'h2', 'h3', 'span'].includes(tag)) e.preventDefault();
      }
    });

    // Auto-save while typing (debounced)
    document.addEventListener('input', function (e) {
      if (e.target.isContentEditable) {
        clearTimeout(window._saveTimer);
        window._saveTimer = setTimeout(persistContent, 600);
      }
    });

    // Section delete - delegated so it survives sanitizeHTML restores
    document.addEventListener('click', function (e) {
      const btn = e.target.closest('.section-del-btn');
      if (btn) removeSection(btn);
    });

    function bindStaticUIEvents() {
      document.addEventListener('click', function (e) {
        const actionEl = e.target.closest('[data-action]');
        if (actionEl) {
          const action = actionEl.dataset.action;
          if (action === 'toggle-font-panel') toggleFontPanel();
          if (action === 'toggle-color-panel') toggleColorPanel();
          if (action === 'close-color-panel') closeColorPanel(false);
          if (action === 'accept-color-panel') acceptColorPanel();
          if (action === 'toggle-edit-mode') toggleEditMode();
          if (action === 'reset-all') resetAll();
        }

        const addBtn = e.target.closest('[data-add-section]');
        if (addBtn) addRemovedSection(addBtn.dataset.addSection);
      });

      document.querySelectorAll('.font-panel input[type="range"]').forEach(input => {
        input.addEventListener('input', function () {
          applyFont(input);
        });
      });

      const photoUpload = document.getElementById('photoUpload');
      if (photoUpload) {
        photoUpload.addEventListener('change', function () {
          handlePhotoUpload(photoUpload);
        });
      }

      const headerPhoto = document.getElementById('headerPhoto');
      if (headerPhoto && photoUpload) {
        headerPhoto.addEventListener('click', function () {
          photoUpload.click();
        });
      }

      const pdfBtn = document.getElementById('pdfBtn');
      if (pdfBtn) {
        pdfBtn.addEventListener('click', function () {
          window.print();
        });
      }

      const pngBtn = document.getElementById('pngBtn');
      if (pngBtn) pngBtn.addEventListener('click', downloadPNG);

      const resetFontsBtn = document.getElementById('resetFontsBtn');
      if (resetFontsBtn) resetFontsBtn.addEventListener('click', resetFonts);

      const colorModal = document.getElementById('colorModal');
      if (colorModal) {
        colorModal.addEventListener('mousedown', function (e) {
          if (e.target === colorModal) {
            closeColorPanel(false);
          }
        });
      }

      const eyedropperBtn = document.getElementById('eyedropperBtn');
      if (eyedropperBtn) {
        if (!window.EyeDropper) {
          eyedropperBtn.disabled = true;
          eyedropperBtn.title = 'Cuentagotas no disponible en este navegador';
        } else {
          eyedropperBtn.addEventListener('click', runEyedropper);
        }
      }

      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeColorPanel(false);
      });
    }

    // Restore saved text on page load
    document.addEventListener('DOMContentLoaded', function () {
      const downloadBar = document.querySelector('.cv-download-bar');
      if (downloadBar) downloadBar.style.visibility = '';

      bindStaticUIEvents();
      restoreAccentColor();

      // Restore photo if user uploaded one
      const savedPhoto = localStorage.getItem('cv-photo');
      if (savedPhoto) showPhoto(savedPhoto);

      restoreContactOrder();
      SectionDragger.restoreLayout();
      restoreSections();
      migrateLangBars();
      initLangDots();
      restoreTags();
      assignKeys();
      ['cv-content', 'cv-content-v1', 'cv-content-v2'].forEach(k => localStorage.removeItem(k));
      const data = JSON.parse(localStorage.getItem('cv-content-' + CONTENT_VER) || 'null');
      if (data) {
        getEditables().forEach(el => {
          if (el.dataset.key && data[el.dataset.key] !== undefined) {
            el.innerHTML = sanitizeHTML(data[el.dataset.key]);
          }
        });
      }
      // Auto-fit on load once fonts are ready
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => autoFitA4());
      }
      setTimeout(autoFitA4, 300);
    });

    const A4_H = 1123; // A4 height at 96 dpi

    // Font vars - always rendered at exactly the user's target value
    const FONT_VARS = [
      '--fs-name','--fs-subtitle','--fs-bio','--fs-section','--fs-item-title',
      '--fs-institution','--fs-body','--fs-meta','--fs-tag','--fs-contact'
    ];
    // Spacing vars - auto-reduced when content overflows A4
    const SPACING_VARS = [
      '--sp-header-pt','--sp-header-pb','--sp-header-gap','--sp-contact-py',
      '--sp-subtitle-mt','--sp-subtitle-mb',
      '--sp-body-pt','--sp-body-pb','--sp-col-gap',
      '--sp-section-mb','--sp-section-title-mb','--sp-item-mb'
    ];

    function getTargetSize(varName) {
      const saved = JSON.parse(localStorage.getItem('cv-fonts') || '{}');
      return saved[varName] ?? DEFAULTS[varName];
    }

    function renderA4Pages() {
      const container = document.querySelector('.cv-container');
      if (!container) return;

      // Remove previously generated guides before recalculating
      container.querySelectorAll('.a4-indicator, .a4-page-label').forEach(el => el.remove());

      const contentHeight = Math.max(container.scrollHeight, container.offsetHeight);
      const pageCount = Math.max(1, Math.ceil(contentHeight / A4_H));
      container.style.minHeight = (pageCount * A4_H) + 'px';

      // Draw one A4 boundary line for each page end (1123, 2246, ...)
      for (let page = 1; page <= pageCount; page++) {
        const top = page * A4_H;

        const line = document.createElement('div');
        line.className = 'a4-indicator';
        line.style.top = top + 'px';
        line.title = 'Límite A4';
        line.innerHTML = '<span class="a4-indicator__text">Tamaño A4</span>';
        container.appendChild(line);

        // Label the beginning of extra pages (Hoja 2, Hoja 3, ...)
        if (page < pageCount) {
          const label = document.createElement('div');
          label.className = 'a4-page-label';
          label.style.top = (top + 8) + 'px';
          label.textContent = 'Hoja ' + (page + 1);
          container.appendChild(label);
        }
      }
    }

    function autoFitA4() {
      // Apply user's saved values - fonts and spacing exactly as set
      // Container now grows freely beyond A4; the red .a4-indicator line marks the boundary
      FONT_VARS.forEach(v => root.style.setProperty(v, getTargetSize(v) + 'px'));
      SPACING_VARS.forEach(v => root.style.setProperty(v, getTargetSize(v) + 'px'));
      renderA4Pages();
    }

    function downloadPNG() {
      if (typeof domtoimage === 'undefined') {
        alert('dom-to-image no está disponible. Verifica tu conexión a internet.');
        return;
      }
      const btn = document.getElementById('pngBtn');
      const container = document.querySelector('.cv-container');

      // Hide UI chrome
      const hidden = document.querySelectorAll('.sidebar, .hero-title, .cv-download-bar, .font-panel, .tag-del, .tag-add-btn, .a4-indicator, .a4-page-label, .section-drag-handle');
      hidden.forEach(el => el.style.visibility = 'hidden');
      document.body.classList.add('capturing-png');

      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generando...';

      const scale = 2;
      const w = container.offsetWidth;
      const h = container.offsetHeight;

      domtoimage.toPng(container, {
        width:  w * scale,
        height: h * scale,
        style: {
          transform: 'scale(' + scale + ')',
          transformOrigin: 'top left',
          width:  w + 'px',
          height: h + 'px'
        }
      }).then(dataUrl => {
        const link = document.createElement('a');
        link.download = 'CV-Ismael-Pallol.png';
        link.href = dataUrl;
        link.click();
      }).catch(err => {
        alert('Error al generar PNG: ' + err.message);
      }).finally(() => {
        hidden.forEach(el => el.style.visibility = '');
        document.body.classList.remove('capturing-png');
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-image"></i> Descargar PNG';
      });
    }

    function toggleSidebar() {
      const sb = document.getElementById('sidebar');
      sb.classList.toggle('sidebar--open');
    }

    (function () {
      const words = [
        { text: 'Profesional', color: '#1a7ba7' },
        { text: 'Moderno',     color: '#8e44ad' },
        { text: 'Creativo',    color: '#e67e22' },
        { text: 'Único',       color: '#27ae60' },
        { text: 'Potente',     color: '#c0392b' },
        { text: 'Dinámico',    color: '#2980b9' },
        { text: 'Elegante',    color: '#d35400' },
        { text: 'Visual',      color: '#16a085' },
        { text: 'Efectivo',    color: '#8e44ad' },
        { text: 'Personalizable', color: '#1a7ba7' },
      ];
      const el = document.getElementById('heroDynamic');
      if (!el) return;
      let wi = 0, ci = 0, deleting = false;
      const TYPING_SPEED  = 90;
      const DELETING_SPEED = 50;
      const PAUSE_END     = 1600;
      const PAUSE_START   = 300;

      function tick() {
        const word  = words[wi];
        el.style.color = word.color;
        if (!deleting) {
          el.textContent = word.text.slice(0, ++ci);
          if (ci === word.text.length) {
            deleting = true;
            return setTimeout(tick, PAUSE_END);
          }
          setTimeout(tick, TYPING_SPEED);
        } else {
          el.textContent = word.text.slice(0, --ci);
          if (ci === 0) {
            deleting = false;
            wi = (wi + 1) % words.length;
            return setTimeout(tick, PAUSE_START);
          }
          setTimeout(tick, DELETING_SPEED);
        }
      }
      setTimeout(tick, 800);
    })();

    // Store removed sections so they can be restored
    const _removedSections = {};

    function removeSection(btn) {
      const sec = btn.closest('.cv-section--removable');
      if (!sec) return;
      const id = sec.dataset.section;
      _removedSections[id] = sec.cloneNode(true);
      // Remove delete btn from clone to avoid duplicates when re-added
      _removedSections[id].querySelectorAll('.section-del-btn').forEach(b => b.remove());
      sec.remove();
      persistSections();
    }

    function addRemovedSection(id) {
      // If already present, do nothing
      if (document.querySelector('.cv-section--removable[data-section="' + id + '"]')) return;

      const aside = document.querySelector('.cv-col--right');
      if (!aside) return;

      let sec;
      if (_removedSections[id]) {
        sec = _removedSections[id].cloneNode(true);
      } else {
        // Build a fresh empty section
        sec = document.createElement('section');
        sec.className = 'cv-section cv-section--removable';
        sec.dataset.section = id;

        const delBtn = document.createElement('button');
        delBtn.className = 'section-del-btn';
        delBtn.title = 'Eliminar sección';
        delBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        // no onclick - handled by delegated listener
        sec.appendChild(delBtn);

        const h2 = document.createElement('h2');
        h2.className = 'section-title';

        if (id === 'skills' || id === 'softskills') {
          h2.textContent = id === 'skills' ? 'Skills' : 'Soft Skills';
          sec.appendChild(h2);
          const container = document.createElement('div');
          container.className = 'tags';
          container.id = 'tags-' + id;
          ['Habilidad 1', 'Habilidad 2'].forEach(t => {
            const tag = document.createElement('span');
            tag.className = 'tag'; tag.textContent = t;
            container.appendChild(tag);
          });
          sec.appendChild(container);
        } else if (id === 'proyectos') {
          h2.textContent = 'Proyectos Personales';
          sec.dataset.itemType = 'project';
          sec.appendChild(h2);
          const item = buildCvItem('project');
          sec.appendChild(item);
        } else if (id === 'formacion') {
          h2.textContent = 'Formación Complementaria';
          sec.dataset.itemType = 'training';
          sec.appendChild(h2);
          const item = buildCvItem('training');
          sec.appendChild(item);
        }
      }

      // Re-attach: no longer needed, using delegation
      sec.querySelectorAll('.section-del-btn').forEach(b => {
        b.removeAttribute('onclick');
      });

      aside.appendChild(sec);

      // If in edit mode, wire up immediately
      if (editMode) {
        sec.querySelectorAll('h3, p, span.language-name, li').forEach(el2 => el2.setAttribute('contenteditable', 'true'));
        injectItemDelBtn && sec.querySelectorAll('.cv-item, .language').forEach(item => injectItemDelBtn(item));
        if (!sec.querySelector('.item-add-btn') && sec.dataset.itemType) {
          const addBtn = document.createElement('button');
          addBtn.type = 'button';
          addBtn.className = 'item-add-btn';
          addBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Añadir entrada';
          addBtn.onclick = () => addCvItem(sec);
          sec.appendChild(addBtn);
        }
        if (id === 'skills' || id === 'softskills') enableTagEditing();
      }

      assignKeys();
      persistSections();
      setTimeout(autoFitA4, 80);
    }

