/**
 * drag-sections.js
 * Drag & drop reordering of CV sections within and between columns.
 * Activated externally by calling SectionDragger.enable() / .disable().
 */

const SectionDragger = (() => {
  let dragging    = null;
  let placeholder = null;
  let dragAllowed = false;

  const LAYOUT_KEY = 'cv-layout-v1';

  // ── Helpers ──────────────────────────────────────────────────────

  function allSections() {
    return Array.from(document.querySelectorAll('.cv-col .cv-section'));
  }

  function allCols() {
    return Array.from(document.querySelectorAll('.cv-col'));
  }

  function makePlaceholder(height) {
    const el = document.createElement('div');
    el.className = 'section-drop-ph';
    el.style.minHeight = Math.max(40, height * 0.6) + 'px';
    return el;
  }

  function resetDragAllowed() {
    dragAllowed = false;
  }

  // ── Handle injection ─────────────────────────────────────────────

  function injectHandle(sec) {
    if (sec.querySelector('.section-drag-handle')) return;
    const h = document.createElement('div');
    h.className = 'section-drag-handle';
    h.title     = 'Arrastra para reordenar';
    h.innerHTML = '<i class="fa-solid fa-grip-lines"></i>';
    h.addEventListener('mousedown', () => { dragAllowed = true; });
    sec.prepend(h);
  }

  function removeHandle(sec) {
    sec.querySelector('.section-drag-handle')?.remove();
  }

  // ── Drag lifecycle ────────────────────────────────────────────────

  function onDragStart(e) {
    if (!dragAllowed) { e.preventDefault(); return; }

    dragging    = this;
    placeholder = makePlaceholder(dragging.offsetHeight);

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', ''); // required by Firefox

    requestAnimationFrame(() => {
      dragging.classList.add('is-dragging');
      dragging.after(placeholder);
    });
  }

  function onDragOver(e) {
    if (!dragging) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const col = e.currentTarget;
    col.classList.add('col-drag-over');

    // Direct children only: guarantees robust top/bottom placement in each column
    const sections = Array.from(
      col.querySelectorAll(':scope > .cv-section:not(.is-dragging)')
    );

    if (sections.length === 0) {
      col.appendChild(placeholder);
      return;
    }

    // Find nearest section by center distance
    let nearest = sections[0];
    let minDist = Number.POSITIVE_INFINITY;
    sections.forEach(sec => {
      const rect = sec.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      const dist = Math.abs(e.clientY - centerY);
      if (dist < minDist) {
        minDist = dist;
        nearest = sec;
      }
    });

    const rect = nearest.getBoundingClientRect();
    const dropBelow = e.clientY >= rect.top + rect.height / 2;

    if (dropBelow) {
      col.insertBefore(placeholder, nearest.nextSibling);
    } else {
      col.insertBefore(placeholder, nearest);
    }
  }

  function onDragLeave(e) {
    const col = e.currentTarget;
    if (!col.contains(e.relatedTarget)) {
      col.classList.remove('col-drag-over');
    }
  }

  function onDrop(e) {
    e.preventDefault();
    const col = e.currentTarget;
    col.classList.remove('col-drag-over');

    if (dragging && placeholder?.isConnected) {
      placeholder.replaceWith(dragging);
    }

    cleanup();
    persistLayout();
    if (typeof autoFitA4 === 'function') setTimeout(autoFitA4, 30);
  }

  function onDragEnd() {
    // Called on the dragged element — ensures cleanup if dropped outside a valid zone
    if (placeholder?.isConnected) placeholder.replaceWith(dragging);
    cleanup();
    allCols().forEach(c => c.classList.remove('col-drag-over'));
    if (typeof autoFitA4 === 'function') setTimeout(autoFitA4, 30);
  }

  function cleanup() {
    if (dragging)              dragging.classList.remove('is-dragging');
    if (placeholder?.isConnected) placeholder.remove();
    dragging    = null;
    placeholder = null;
    dragAllowed = false;
  }

  // ── Persist / restore layout ─────────────────────────────────────

  function persistLayout() {
    const data = {};
    allCols().forEach(col => {
      const side = col.classList.contains('cv-col--left') ? 'left' : 'right';
      data[side] = Array.from(col.querySelectorAll('.cv-section[data-section]'))
        .map(s => s.dataset.section);
    });
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(data));
  }

  function restoreLayout() {
    let saved;
    try { saved = JSON.parse(localStorage.getItem(LAYOUT_KEY)); } catch { return; }
    if (!saved) return;

    const leftCol  = document.querySelector('.cv-col--left');
    const rightCol = document.querySelector('.cv-col--right');
    if (!leftCol || !rightCol) return;

    const colMap = { left: leftCol, right: rightCol };

    // Process each saved column in order — appendChild reorders within same column
    // and moves across columns
    Object.entries(colMap).forEach(([side, col]) => {
      (saved[side] || []).forEach(id => {
        const sec = document.querySelector(`.cv-section[data-section="${id}"]`);
        if (sec) col.appendChild(sec);
      });
    });
  }

  function clearLayout() {
    localStorage.removeItem(LAYOUT_KEY);
  }

  // ── Public API ───────────────────────────────────────────────────

  function enable() {
    document.addEventListener('mouseup', resetDragAllowed);

    allSections().forEach(sec => {
      injectHandle(sec);
      sec.setAttribute('draggable', 'true');
      sec.addEventListener('dragstart', onDragStart);
      sec.addEventListener('dragend',   onDragEnd);
    });

    allCols().forEach(col => {
      col.addEventListener('dragover',  onDragOver);
      col.addEventListener('dragleave', onDragLeave);
      col.addEventListener('drop',      onDrop);
    });
  }

  function disable() {
    document.removeEventListener('mouseup', resetDragAllowed);

    allSections().forEach(sec => {
      removeHandle(sec);
      sec.removeAttribute('draggable');
      sec.classList.remove('is-dragging');
      sec.removeEventListener('dragstart', onDragStart);
      sec.removeEventListener('dragend',   onDragEnd);
    });

    allCols().forEach(col => {
      col.removeEventListener('dragover',  onDragOver);
      col.removeEventListener('dragleave', onDragLeave);
      col.removeEventListener('drop',      onDrop);
      col.classList.remove('col-drag-over');
    });

    if (placeholder?.isConnected) placeholder.remove();
    placeholder = null;
    dragging    = null;
  }

  return { enable, disable, restoreLayout, persistLayout, clearLayout };
})();
