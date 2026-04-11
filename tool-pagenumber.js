/**
 * tool-pagenumber.js — Advanced Page Numbering Generator for QikPDF
 *
 * Architecture:
 *  - State is stored in `pageNumberState` (isolated from global `state`)
 *  - `initPageNumberUI(file)` is called by app.js after file load
 *  - `execPageNumber(file)` is called by app.js processFiles()
 *  - All PDF operations use pdf-lib (PDFLib), matching the existing engine
 */

// ─── Module State ──────────────────────────────────────────────────────────────

const pageNumberState = {
    file:       null,   // loaded File object
    pageCount:  0,      // total pages in the PDF
    layers:     [],     // array of layer config objects
    duplicateN: 1,      // for single-page PDFs: how many times to duplicate
};

let _pnLayerCounter = 0; // unique layer ID counter

// ─── Roman Numeral Converter ───────────────────────────────────────────────────

function toRoman(num) {
    if (num <= 0) return String(num);
    const vals = [1000,900,500,400,100,90,50,40,10,9,5,4,1];
    const syms = ['M','CM','D','CD','C','XC','L','XL','X','IX','V','IV','I'];
    let result = '';
    for (let i = 0; i < vals.length; i++) {
        while (num >= vals[i]) { result += syms[i]; num -= vals[i]; }
    }
    return result;
}

// ─── Number Formatter ─────────────────────────────────────────────────────────

/**
 * Format a number value into a display string based on format template.
 * Templates:
 *   "{n}"          → raw number
 *   "Page {n}"     → "Page 3"
 *   "{n} / {total}"→ "3 / 10"
 *   "01"           → zero-padded (width = template length)
 *   "roman"        → Roman numerals
 *   "ROMAN"        → uppercase Roman numerals
 *   "alpha"        → a, b, c … z, aa, ab…
 */
function formatNumber(n, template, totalPages) {
    if (template === 'roman') return toRoman(n).toLowerCase();
    if (template === 'ROMAN') return toRoman(n);
    if (template === 'alpha') {
        let s = ''; let x = n;
        while (x > 0) { x--; s = String.fromCharCode(97 + (x % 26)) + s; x = Math.floor(x / 26); }
        return s;
    }
    // Zero-pad pattern: all digits e.g. "001"
    if (/^\d+$/.test(template)) {
        return String(n).padStart(template.length, '0');
    }
    // Template substitution: {n} and {total}
    return template
        .replace(/\{n\}/gi, n)
        .replace(/\{total\}/gi, totalPages || '?');
}

// ─── Color Parser ─────────────────────────────────────────────────────────────

/** Convert CSS hex color (#rrggbb) to PDFLib RGB object (0–1 range). */
function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return PDFLib.rgb(r, g, b);
}

// ─── Position Calculator ──────────────────────────────────────────────────────

/**
 * Calculate the final (x, y) drawing coordinates in PDF points.
 * PDF-lib origin is bottom-left. y increases upward.
 *
 * preset positions (relative to page with margin):
 *   top-left, top-center, top-right,
 *   center-left, center, center-right,
 *   bottom-left, bottom-center, bottom-right
 */
function calcPosition(preset, customX, customY, pageWidth, pageHeight, fontSize, margin) {
    if (preset === 'custom') {
        // customX/Y are percentages (0–100) from top-left in CSS convention
        // Convert to PDF points (origin bottom-left)
        const x = (customX / 100) * pageWidth;
        const y = pageHeight - (customY / 100) * pageHeight - fontSize;
        return { x, y };
    }

    const m = margin || 24; // default margin in points
    const positions = {
        'top-left':       { x: m,                        y: pageHeight - m - fontSize },
        'top-center':     { x: pageWidth / 2,             y: pageHeight - m - fontSize },
        'top-right':      { x: pageWidth - m,             y: pageHeight - m - fontSize },
        'center-left':    { x: m,                         y: (pageHeight - fontSize) / 2 },
        'center':         { x: pageWidth / 2,             y: (pageHeight - fontSize) / 2 },
        'center-right':   { x: pageWidth - m,             y: (pageHeight - fontSize) / 2 },
        'bottom-left':    { x: m,                         y: m },
        'bottom-center':  { x: pageWidth / 2,             y: m },
        'bottom-right':   { x: pageWidth - m,             y: m },
    };
    return positions[preset] || positions['bottom-center'];
}

// ─── Page Target Filter ───────────────────────────────────────────────────────

/**
 * Determine if a given 1-based page index should receive this layer.
 * targeting modes: 'all' | 'range' | 'odd' | 'even'
 */
function pageIsTargeted(pageIdx1, targeting) {
    if (targeting.mode === 'all') return true;
    if (targeting.mode === 'odd') return pageIdx1 % 2 !== 0;
    if (targeting.mode === 'even') return pageIdx1 % 2 === 0;
    if (targeting.mode === 'range') {
        return pageIdx1 >= (targeting.rangeFrom || 1) &&
               pageIdx1 <= (targeting.rangeTo || Infinity);
    }
    return true;
}

// ─── UI Builder ───────────────────────────────────────────────────────────────

/** Create a new default layer config object. */
function createDefaultLayer() {
    _pnLayerCounter++;
    return {
        id:        _pnLayerCounter,
        enabled:   true,
        startNum:  1,
        step:      1,
        format:    'Page {n}',
        position:  'bottom-center',
        customX:   50,   // % from left
        customY:   95,   // % from top
        align:     'center',
        fontSize:  11,
        fontFamily:'Helvetica',
        color:     '#000000',
        opacity:   1.0,
        rotation:  0,
        targeting: { mode: 'all', rangeFrom: 1, rangeTo: 1 },
        margin:    28,
    };
}

/** Render all layers into the #pn-layers-list container. */
function renderLayerList() {
    const container = document.getElementById('pn-layers-list');
    if (!container) return;
    container.innerHTML = '';

    if (pageNumberState.layers.length === 0) {
        container.innerHTML = '<div class="pn-no-layers">No layers yet. Click "ADD LAYER" to begin.</div>';
        return;
    }

    pageNumberState.layers.forEach((layer, idx) => {
        const card = document.createElement('div');
        card.className = 'pn-layer-card' + (layer.enabled ? '' : ' pn-layer-disabled');
        card.dataset.layerId = layer.id;

        card.innerHTML = `
<div class="pn-layer-header">
    <div class="pn-layer-title">
        <span class="pn-layer-index">[${String(idx + 1).padStart(2,'0')}]</span>
        <span class="pn-layer-format-preview">${escapeHtml(layer.format)}</span>
        <span class="pn-layer-pos-badge">${layer.position}</span>
    </div>
    <div class="pn-layer-actions">
        <button class="btn-sm pn-btn-toggle" data-id="${layer.id}" title="${layer.enabled ? 'Disable' : 'Enable'}">
            ${layer.enabled ? 'ON' : 'OFF'}
        </button>
        <button class="btn-sm pn-btn-remove" data-id="${layer.id}" title="Remove Layer">✕</button>
    </div>
</div>
<div class="pn-layer-body">
    <!-- Row 1: Format & Numbering -->
    <div class="pn-row">
        <div class="pn-field pn-field-lg">
            <label>FORMAT</label>
            <input class="input-text pn-input" type="text" data-key="format" data-id="${layer.id}"
                value="${escapeHtml(layer.format)}"
                placeholder="Page {n}, {n}/{total}, roman, ROMAN, alpha, 001">
        </div>
        <div class="pn-field pn-field-sm">
            <label>START #</label>
            <input class="input-text pn-input" type="number" data-key="startNum" data-id="${layer.id}"
                value="${layer.startNum}" min="0" step="1">
        </div>
        <div class="pn-field pn-field-sm">
            <label>STEP</label>
            <input class="input-text pn-input" type="number" data-key="step" data-id="${layer.id}"
                value="${layer.step}" min="1" step="1">
        </div>
    </div>
    <!-- Row 2: Position & Alignment -->
    <div class="pn-row">
        <div class="pn-field">
            <label>POSITION</label>
            <div class="select-wrapper">
                <select class="input-select pn-input" data-key="position" data-id="${layer.id}">
                    ${['top-left','top-center','top-right','center-left','center','center-right','bottom-left','bottom-center','bottom-right','custom']
                      .map(p => `<option value="${p}"${layer.position===p?' selected':''}>${p.replace('-',' ').toUpperCase()}</option>`).join('')}
                </select>
            </div>
        </div>
        <div class="pn-field">
            <label>ALIGN</label>
            <div class="select-wrapper">
                <select class="input-select pn-input" data-key="align" data-id="${layer.id}">
                    ${['left','center','right'].map(a=>`<option value="${a}"${layer.align===a?' selected':''}>${a.toUpperCase()}</option>`).join('')}
                </select>
            </div>
        </div>
    </div>
    <!-- Custom X/Y (only shown when position=custom) -->
    <div class="pn-row pn-custom-pos${layer.position==='custom'?'':' hidden'}" data-layer-id="${layer.id}">
        <div class="pn-field pn-field-sm">
            <label>X %</label>
            <input class="input-text pn-input" type="number" data-key="customX" data-id="${layer.id}"
                value="${layer.customX}" min="0" max="100" step="0.5">
        </div>
        <div class="pn-field pn-field-sm">
            <label>Y %</label>
            <input class="input-text pn-input" type="number" data-key="customY" data-id="${layer.id}"
                value="${layer.customY}" min="0" max="100" step="0.5">
        </div>
    </div>
    <!-- Row 3: Style -->
    <div class="pn-row">
        <div class="pn-field pn-field-sm">
            <label>SIZE (PT)</label>
            <input class="input-text pn-input" type="number" data-key="fontSize" data-id="${layer.id}"
                value="${layer.fontSize}" min="6" max="200" step="1">
        </div>
        <div class="pn-field">
            <label>FONT</label>
            <div class="select-wrapper">
                <select class="input-select pn-input" data-key="fontFamily" data-id="${layer.id}">
                    ${['Helvetica','Helvetica-Bold','Courier','Courier-Bold','Times-Roman','Times-Bold']
                      .map(f=>`<option value="${f}"${layer.fontFamily===f?' selected':''}>${f}</option>`).join('')}
                </select>
            </div>
        </div>
        <div class="pn-field pn-field-color">
            <label>COLOR</label>
            <input class="pn-color-input pn-input" type="color" data-key="color" data-id="${layer.id}"
                value="${layer.color}">
        </div>
    </div>
    <!-- Row 4: Opacity, Rotation, Margin -->
    <div class="pn-row">
        <div class="pn-field pn-field-sm">
            <label>OPACITY</label>
            <input class="input-text pn-input" type="number" data-key="opacity" data-id="${layer.id}"
                value="${layer.opacity}" min="0.05" max="1" step="0.05">
        </div>
        <div class="pn-field pn-field-sm">
            <label>ROTATION°</label>
            <input class="input-text pn-input" type="number" data-key="rotation" data-id="${layer.id}"
                value="${layer.rotation}" min="-360" max="360" step="1">
        </div>
        <div class="pn-field pn-field-sm">
            <label>MARGIN (PT)</label>
            <input class="input-text pn-input" type="number" data-key="margin" data-id="${layer.id}"
                value="${layer.margin}" min="0" max="200" step="1">
        </div>
    </div>
    <!-- Row 5: Page Targeting -->
    <div class="pn-row pn-targeting-row">
        <div class="pn-field">
            <label>TARGET PAGES</label>
            <div class="select-wrapper">
                <select class="input-select pn-input pn-targeting-mode" data-key="targeting.mode" data-id="${layer.id}">
                    <option value="all"  ${layer.targeting.mode==='all'  ?'selected':''}>ALL PAGES</option>
                    <option value="odd"  ${layer.targeting.mode==='odd'  ?'selected':''}>ODD PAGES</option>
                    <option value="even" ${layer.targeting.mode==='even' ?'selected':''}>EVEN PAGES</option>
                    <option value="range"${layer.targeting.mode==='range'?'selected':''}>PAGE RANGE</option>
                </select>
            </div>
        </div>
        <div class="pn-range-inputs${layer.targeting.mode==='range'?'':' hidden'}" data-layer-id="${layer.id}">
            <div class="pn-field pn-field-sm">
                <label>FROM</label>
                <input class="input-text pn-input" type="number" data-key="targeting.rangeFrom" data-id="${layer.id}"
                    value="${layer.targeting.rangeFrom}" min="1" step="1">
            </div>
            <div class="pn-field pn-field-sm">
                <label>TO</label>
                <input class="input-text pn-input" type="number" data-key="targeting.rangeTo" data-id="${layer.id}"
                    value="${layer.targeting.rangeTo}" min="1" step="1">
            </div>
        </div>
    </div>
</div>
        `;
        container.appendChild(card);
    });

    // Bind events after DOM insertion
    bindLayerCardEvents(container);
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g,'&amp;').replace(/</g,'&lt;')
        .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/** Bind all interactive events for layer cards. */
function bindLayerCardEvents(container) {
    // Toggle enabled
    container.querySelectorAll('.pn-btn-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            if (typeof processingLock !== 'undefined' && processingLock) return;
            const id = parseInt(btn.dataset.id);
            const layer = pageNumberState.layers.find(l => l.id === id);
            if (layer) { layer.enabled = !layer.enabled; renderLayerList(); }
        });
    });

    // Remove layer
    container.querySelectorAll('.pn-btn-remove').forEach(btn => {
        btn.addEventListener('click', () => {
            if (typeof processingLock !== 'undefined' && processingLock) return;
            const id = parseInt(btn.dataset.id);
            pageNumberState.layers = pageNumberState.layers.filter(l => l.id !== id);
            renderLayerList();
        });
    });

    // Input changes
    container.querySelectorAll('.pn-input').forEach(input => {
        input.addEventListener('change', handleLayerInputChange);
        input.addEventListener('input',  handleLayerInputChange);
    });
}

/** Handle any input/select change in a layer card, updating pageNumberState. */
function handleLayerInputChange(e) {
    const el    = e.target;
    const id    = parseInt(el.dataset.id);
    const key   = el.dataset.key;
    const layer = pageNumberState.layers.find(l => l.id === id);
    if (!layer || !key) return;

    let value = el.type === 'number' ? parseFloat(el.value) : el.value;
    if (el.type === 'checkbox') value = el.checked;

    // Handle nested keys like "targeting.mode"
    if (key.includes('.')) {
        const [parent, child] = key.split('.');
        if (!layer[parent]) layer[parent] = {};
        layer[parent][child] = el.type === 'number' ? parseFloat(el.value) : el.value;

        // Show/hide range inputs when targeting mode changes
        if (key === 'targeting.mode') {
            const rangeInputs = document.querySelector(`.pn-range-inputs[data-layer-id="${id}"]`);
            if (rangeInputs) rangeInputs.classList.toggle('hidden', el.value !== 'range');
            // Update TO default to page count
            if (el.value === 'range') {
                layer.targeting.rangeTo = pageNumberState.pageCount || 1;
                const toInput = rangeInputs && rangeInputs.querySelector('[data-key="targeting.rangeTo"]');
                if (toInput) toInput.value = layer.targeting.rangeTo;
            }
        }
    } else {
        layer[key] = value;

        // Show/hide custom position fields
        if (key === 'position') {
            const customRow = document.querySelector(`.pn-custom-pos[data-layer-id="${id}"]`);
            if (customRow) customRow.classList.toggle('hidden', value !== 'custom');
            // Update badge
            const badge = el.closest('.pn-layer-card').querySelector('.pn-layer-pos-badge');
            if (badge) badge.textContent = value;
        }

        // Update format preview live
        if (key === 'format') {
            const preview = el.closest('.pn-layer-card').querySelector('.pn-layer-format-preview');
            if (preview) preview.textContent = el.value;
        }
    }
}

// ─── UI Init ──────────────────────────────────────────────────────────────────

/**
 * Called by app.js handleFiles() after a file is selected for the pagenumber tool.
 * Reads the page count and shows the UI panel.
 */
async function initPageNumberUI(file) {
    pageNumberState.file      = file;
    pageNumberState.layers    = [];
    pageNumberState.duplicateN = 1;
    _pnLayerCounter = 0;

    // Read page count using pdf-lib (already loaded globally)
    try {
        const ab  = await file.arrayBuffer();
        const pdf = await PDFLib.PDFDocument.load(ab);
        pageNumberState.pageCount = pdf.getPageCount();
    } catch (err) {
        console.error('PageNumber: failed to load PDF', err);
        pageNumberState.pageCount = 1;
    }

    const panel = document.getElementById('pagenumber-ui');
    if (!panel) return;

    // Update file info
    const fnEl = document.getElementById('pn-filename');
    const pcEl = document.getElementById('pn-pagecount');
    if (fnEl) fnEl.textContent = file.name;
    if (pcEl) pcEl.textContent = `${pageNumberState.pageCount} page${pageNumberState.pageCount !== 1 ? 's' : ''}`;

    // Show/hide single-page duplicate section
    const singleSection = document.getElementById('pn-single-page-section');
    if (singleSection) {
        singleSection.classList.toggle('hidden', pageNumberState.pageCount !== 1);
    }
    // Update range default for range inputs
    pageNumberState.layers.forEach(l => { l.targeting.rangeTo = pageNumberState.pageCount; });

    renderLayerList();
    panel.classList.remove('hidden');
}

// ─── PDF Processing Engine ────────────────────────────────────────────────────

/**
 * Main entry point called by app.js processFiles().
 * 1. Loads the PDF
 * 2. Duplicates pages if single-page mode
 * 3. Applies all enabled layers to each relevant page
 * 4. Saves and stores result in state.resultBlob
 */
async function execPageNumber(file) {
    const { PDFDocument, rgb, degrees, StandardFonts } = PDFLib;

    setProgress(0, 'LOADING PDF...');
    await yieldToMain();

    const ab        = await file.arrayBuffer();
    const srcPdf    = await PDFDocument.load(ab);
    const srcPages  = srcPdf.getPages();
    const isSingle  = srcPages.length === 1;

    // ── Step 1: Build target PDF (with page duplication if needed) ──────────
    const outPdf    = await PDFDocument.create();
    let   totalPages;

    if (isSingle && pageNumberState.duplicateN > 1) {
        // Duplicate single page N times
        const n = Math.min(pageNumberState.duplicateN, 2000); // safety cap
        totalPages = n;
        setProgress(5, `DUPLICATING PAGE × ${n}...`);

        // Embed the single source page once, reuse embedding
        const [embPage] = await outPdf.embedPages(srcPages);
        const { width, height } = embPage;

        for (let i = 0; i < n; i++) {
            if (i % 50 === 0) {
                await yieldToMain();
                setProgress(5 + (i / n) * 20, `DUPLICATING ${i + 1}/${n}...`);
            }
            const pg = outPdf.addPage([width, height]);
            pg.drawPage(embPage, { x: 0, y: 0, width, height });
        }
    } else {
        // Copy all source pages
        totalPages = srcPages.length;
        setProgress(5, 'COPYING PAGES...');
        const embedded = await outPdf.embedPages(srcPages);

        for (let i = 0; i < srcPages.length; i++) {
            if (i % 20 === 0) {
                await yieldToMain();
                setProgress(5 + (i / srcPages.length) * 20, `COPYING PAGE ${i+1}/${srcPages.length}...`);
            }
            const { width, height } = embedded[i];
            const pg = outPdf.addPage([width, height]);
            pg.drawPage(embedded[i], { x: 0, y: 0, width, height });
        }
    }

    const outPages = outPdf.getPages();

    // ── Step 2: Build font cache ────────────────────────────────────────────
    // pdf-lib supports only 14 standard fonts; map our font names to them
    const FONT_MAP = {
        'Helvetica':       StandardFonts.Helvetica,
        'Helvetica-Bold':  StandardFonts.HelveticaBold,
        'Courier':         StandardFonts.Courier,
        'Courier-Bold':    StandardFonts.CourierBold,
        'Times-Roman':     StandardFonts.TimesRoman,
        'Times-Bold':      StandardFonts.TimesRomanBold,
    };

    const fontCache = {};
    const activeLayers = pageNumberState.layers.filter(l => l.enabled);

    for (const layer of activeLayers) {
        const key = layer.fontFamily;
        if (!fontCache[key]) {
            const stdFont = FONT_MAP[key] || StandardFonts.Helvetica;
            fontCache[key] = await outPdf.embedFont(stdFont);
        }
    }

    // ── Step 3: Apply layers to each page ───────────────────────────────────
    setProgress(30, 'APPLYING NUMBERING...');

    for (let pageIdx = 0; pageIdx < outPages.length; pageIdx++) {
        const page1based = pageIdx + 1; // 1-based page number

        if (pageIdx % 10 === 0) {
            await yieldToMain();
            setProgress(30 + (pageIdx / outPages.length) * 65,
                        `NUMBERING PAGE ${page1based}/${outPages.length}...`);
        }

        const page       = outPages[pageIdx];
        const { width: pgW, height: pgH } = page.getSize();

        for (const layer of activeLayers) {
            // Check if this page is targeted by the layer
            if (!pageIsTargeted(page1based, layer.targeting)) continue;

            // Calculate the number value for this page/layer
            // The counter increments only for targeted pages; we pre-compute this.
            // Use a helper we build below after knowing the page order.
            const numberValue = getLayerNumberForPage(layer, pageIdx, outPages.length);

            const labelText  = formatNumber(numberValue, layer.format, outPages.length);
            const font        = fontCache[layer.fontFamily] || fontCache['Helvetica'];
            const fontSize    = layer.fontSize || 11;
            const color       = hexToRgb(layer.color || '#000000');
            const opacity     = Math.max(0, Math.min(1, layer.opacity || 1));
            const rotDeg      = layer.rotation || 0;

            // Calculate position
            let { x, y } = calcPosition(
                layer.position, layer.customX, layer.customY,
                pgW, pgH, fontSize, layer.margin
            );

            // Adjust x based on text alignment
            if (layer.align !== 'left') {
                const textWidth = font.widthOfTextAtSize(labelText, fontSize);
                if (layer.align === 'center') x -= textWidth / 2;
                if (layer.align === 'right')  x -= textWidth;
            }

            // Draw the text
            page.drawText(labelText, {
                x,
                y,
                size:     fontSize,
                font,
                color,
                opacity,
                rotate:   degrees(rotDeg),
            });
        }
    }

    // ── Step 4: Save and store result ───────────────────────────────────────
    setProgress(97, 'SAVING PDF...');
    await yieldToMain();

    const finalBytes = await outPdf.save();
    state.resultBlob = new Blob([finalBytes], { type: 'application/pdf' });
    state.resultName = state.exportSettings.filename
        ? `${state.exportSettings.filename}.pdf`
        : file.name.replace(/\.pdf$/i, '_numbered.pdf');

    setProgress(100, 'DONE!');
}

/**
 * Calculate the sequential number a layer should show on a given pageIdx.
 * Counts only the pages targeted by the layer, up to and including pageIdx.
 *
 * Example: layer targets odd pages, startNum=1, step=1
 *   Page 1 (idx 0): 1st targeted → 1
 *   Page 2 (idx 1): not targeted → (skipped)
 *   Page 3 (idx 2): 2nd targeted → 2
 */
function getLayerNumberForPage(layer, pageIdx, totalPages) {
    let counter = 0;
    for (let i = 0; i <= pageIdx; i++) {
        if (pageIsTargeted(i + 1, layer.targeting)) counter++;
    }
    return layer.startNum + (counter - 1) * layer.step;
}

// ─── Duplicate Input Binding ──────────────────────────────────────────────────

/** Called from initPageNumberUI and also wired in HTML onchange. */
function bindDuplicateInput() {
    const input = document.getElementById('pn-duplicate-count');
    if (!input) return;
    input.addEventListener('input', () => {
        const val = parseInt(input.value);
        pageNumberState.duplicateN = isNaN(val) || val < 1 ? 1 : val;
    });
    input.addEventListener('change', () => {
        const val = parseInt(input.value);
        pageNumberState.duplicateN = isNaN(val) || val < 1 ? 1 : val;
    });
}

// ─── Public helpers called from app.js ───────────────────────────────────────

/** Reset all module state (called by app.js resetToolUI). */
function resetPageNumberState() {
    pageNumberState.file       = null;
    pageNumberState.pageCount  = 0;
    pageNumberState.layers     = [];
    pageNumberState.duplicateN = 1;
    _pnLayerCounter = 0;

    const panel = document.getElementById('pagenumber-ui');
    if (panel) panel.classList.add('hidden');
}

// ─── DOM Ready: Wire Add Layer Button & Duplicate Input ───────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const addBtn = document.getElementById('pn-btn-add-layer');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            if (typeof processingLock !== 'undefined' && processingLock) return;
            const layer = createDefaultLayer();
            // Default rangeTo = total pages (updated once file loads)
            layer.targeting.rangeTo = pageNumberState.pageCount || 1;
            pageNumberState.layers.push(layer);
            renderLayerList();
        });
    }
    bindDuplicateInput();
});
