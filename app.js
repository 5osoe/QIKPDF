if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

const ROUTES = {
  "/merge":    "merge",
  "/rotate":   "rotate",
  "/split":    "split",
  "/pdf2img":  "pdf2img",
  "/img2pdf":  "img2pdf",
  "/pdfinfo":  "pdfinfo",
  "/metadata": "metadata"
};

document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    setupGlobalModals();
    handleRouting();
});

const DOM = {
    btnAbout:   document.getElementById('btn-about'),
    btnTheme:   document.getElementById('btn-theme'),
    btnInfo:    document.getElementById('btn-info'),
    led:        document.querySelector('.led'),
    infoModal:  document.getElementById('info-modal'),
    modalTitle: document.getElementById('modal-title'),
    modalBody:  document.getElementById('modal-body'),
    btnModalClose: document.getElementById('btn-modal-close'),
    exportModal:      document.getElementById('export-modal'),
    exportFilename:   document.getElementById('export-filename'),
    exportSize:       document.getElementById('export-size'),
    exportSizeGroup:  document.getElementById('export-size-group'),
    exportRotation:   document.getElementById('export-rotation'),
    exportRotationGroup: document.getElementById('export-rotation-group'),
    customSizeInputs: document.getElementById('custom-size-inputs'),
    customWidth:  document.getElementById('custom-width'),
    customHeight: document.getElementById('custom-height'),
    customUnit:   document.getElementById('custom-unit'),
    btnExportClose:   document.getElementById('btn-export-close'),
    btnExportCancel:  document.getElementById('btn-export-cancel'),
    btnExportConfirm: document.getElementById('btn-export-confirm'),
    editPreviewModal: document.getElementById('edit-preview-modal'),
    previewClose: document.getElementById('preview-close'),
    previewBody:  document.getElementById('preview-body'),
    logoHome:   document.getElementById('logo-home'),
    mainView:   document.getElementById('main-view'),
    toolView:   document.getElementById('tool-view'),
    toolCards:  document.querySelectorAll('.tool-card'),
    toolTitleText: document.getElementById('tool-title-text'),
    toolTitleIcon: document.getElementById('tool-title-icon'),
    btnBack:    document.getElementById('btn-back'),
    dropZone:   document.getElementById('drop-zone'),
    dropText:   document.getElementById('drop-text'),
    fileInput:  document.getElementById('file-input'),
    reorderContainer:  document.getElementById('reorder-container'),
    progressContainer: document.getElementById('progress-container'),
    asciiProgress: document.getElementById('ascii-progress'),
    statusText:    document.getElementById('status-text'),
    resultContainer: document.getElementById('result-container'),
    globalActions:    document.getElementById('global-actions'),
    btnProcess:       document.getElementById('btn-process'),
    btnDownloadAction: document.getElementById('btn-download-action'),
    btnClearResult:   document.getElementById('btn-clear-result'),
    pdfInfoUi:      document.getElementById('pdf-info-ui'),
    pdfInfoContent: document.getElementById('pdf-info-content'),
    metadataUi:  document.getElementById('metadata-ui'),
    metaTitle:   document.getElementById('meta-title'),
    metaAuthor:  document.getElementById('meta-author'),
    metaSubject: document.getElementById('meta-subject'),
    metaKeywords: document.getElementById('meta-keywords'),
    metaCreator: document.getElementById('meta-creator'),
    btnMetaClear: document.getElementById('btn-meta-clear'),
    rotateUi:       document.getElementById('rotate-ui'),
    rotateFilename: document.getElementById('rotate-filename'),
    rotateBtns:     document.querySelectorAll('.rotate-btn'),
    splitUi:            document.getElementById('split-ui'),
    splitFilename:      document.getElementById('split-filename'),
    splitPageCount:     document.getElementById('split-pagecount'),
    splitModeRadios:    document.querySelectorAll('input[name="split-mode"]'),
    splitCustomOptions: document.getElementById('split-custom-options'),
    splitRangeCount:    document.getElementById('split-range-count'),
    splitRangesContainer: document.getElementById('split-ranges-container'),
    splitAllNames: document.getElementById('split-all-names'),
    splitAllCount: document.getElementById('split-all-count'),
    splitAllList:  document.getElementById('split-all-list'),
    pdf2ImgUi:     document.getElementById('pdf2img-ui'),
    pdfGrid:       document.getElementById('pdf-grid'),
    btnSelectAll:  document.getElementById('btn-select-all'),
    btnSelectNone: document.getElementById('btn-select-none'),
    pdfImgSearch:  document.getElementById('pdf2img-search')
};

let processingLock = false;

const SAFETY_ENGINE = {
    LIMITS: { MOBILE: 350, DESKTOP: 900 },
    MULTIPLIERS: {
        'pdf2img':  6.0,
        'img2pdf':  3.5,
        'merge':    2.5,
        'split':    2.0,
        'rotate':   2.0,
        'metadata': 1.2
    },
    isMobile: function() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1);
    },
    getSafetyLimit: function() {
        return this.isMobile() ? this.LIMITS.MOBILE : this.LIMITS.DESKTOP;
    },
    estimateMemory: function(tool, files) {
        if (!files || files.length === 0) return 0;
        let total = 0;
        const list = Array.isArray(files) ? files : [files];
        list.forEach(f => { if (f && f.size) total += f.size / (1024 * 1024); });
        return total * (this.MULTIPLIERS[tool] || 2.0);
    }
};

async function safetyGate(tool, files) {
    const est   = SAFETY_ENGINE.estimateMemory(tool, files);
    const limit = SAFETY_ENGINE.getSafetyLimit();
    if (est < limit) return true;
    if (est < limit * 1.5) {
        return confirm(
            `⚠️ تحذير الأداء\n\n` +
            `تتطلب هذه العملية حوالي ${Math.round(est)} ميغابايت من الذاكرة.\n` +
            `قد يتجمد المتصفح لفترة مؤقتة.\n\n` +
            `هل تريد المتابعة؟`
        );
    }
    alert(
        `⛔ العملية محظورة\n\n` +
        `الملفات المحددة كبيرة جداً لهذا الجهاز.\n` +
        `الذاكرة المقدرة: ${Math.round(est)} ميغابايت\n` +
        `الحد الآمن: ${limit} ميغابايت\n\n` +
        `يرجى استخدام ملفات أصغر أو جهاز مكتبي.`
    );
    return false;
}

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

function initTheme() {
    const saved = localStorage.getItem('theme');
    document.documentElement.setAttribute('data-theme', saved || 'light');
}

function toggleTheme() {
    const overlay = document.getElementById('theme-overlay');
    const current = document.documentElement.getAttribute('data-theme');
    const next    = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    if (overlay) {
        overlay.classList.remove('transitioning');
        void overlay.offsetWidth;
        overlay.classList.add('transitioning');
        overlay.addEventListener('animationend', () => overlay.classList.remove('transitioning'), { once: true });
    }
}

if (DOM.btnTheme) DOM.btnTheme.addEventListener('click', toggleTheme);

const UrlManager = {
    urls: new Set(),
    create:    function(obj) { const u = URL.createObjectURL(obj); this.urls.add(u); return u; },
    revokeAll: function()    { this.urls.forEach(u => URL.revokeObjectURL(u)); this.urls.clear(); }
};

let state = {
    currentTool: null,
    resultBlob:  null,
    resultName:  '',
    imgFiles:    [],
    mergeFiles:  [],
    rotateFile:  null,
    rotateAngle: 90,
    splitFile:   null,
    splitDoc:    null,
    splitMode:   'all',
    splitRanges: [],
    pdfImgNames:       new Map(),
    splitNames:        new Map(),
    splitAllPageNames: new Map(),
    exportSettings: { size: 'default', filename: '', customWidth: 0, customHeight: 0, exportRotation: 0 },
    sourceFile:          null,
    pdfImgDoc:           null,
    pdfImgSelectedPages: new Set(),
    pdfImgObserver:      null
};

let previewState = { doc: null, page: 1, total: 0, type: null };

const PAGE_SIZES = {
    a0: [2383.94, 3370.39], a1: [1683.78, 2383.94], a2: [1190.55, 1683.78],
    a3: [841.89,  1190.55], a4: [595.28,   841.89],  a5: [419.53,   595.28],
    a6: [297.64,   419.53], b3: [1000.62, 1417.32],  b4: [708.66,  1000.62],
    b5: [498.90,   708.66], letter: [612, 792],        legal: [612,  1008]
};

let appContent = null;

const toolConfig = {
    'pdfinfo':  { title: 'PDF INFO',       accept: 'application/pdf',       multiple: false },
    'metadata': { title: 'METADATA',       accept: 'application/pdf',       multiple: false },
    'pdf2img':  { title: 'PDF \u2192 IMG', accept: 'application/pdf',       multiple: false },
    'img2pdf':  { title: 'IMG \u2192 PDF', accept: 'image/png, image/jpeg', multiple: true  },
    'merge':    { title: 'MERGE',          accept: 'application/pdf',       multiple: true  },
    'split':    { title: 'SPLIT',          accept: 'application/pdf',       multiple: false },
    'rotate':   { title: 'ROTATE',         accept: 'application/pdf',       multiple: false }
};

const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 0));

function getBaseName(filename) { return filename.replace(/\.[^/.]+$/, ''); }

function formatFileSize(bytes) {
    if (bytes < 1024)    return bytes + ' Bytes';
    if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
}

function formatPageSize(widthPt, heightPt) {
    const p = 0.352778;
    const w = Math.round(widthPt  * p);
    const h = Math.round(heightPt * p);
    const eq = (a, b, c, d) => (Math.abs(a-c)<=2 && Math.abs(b-d)<=2) || (Math.abs(a-d)<=2 && Math.abs(b-c)<=2);
    let name = 'Custom';
    if      (eq(w, h, 210, 297)) name = 'A4';
    else if (eq(w, h, 297, 420)) name = 'A3';
    else if (eq(w, h, 148, 210)) name = 'A5';
    else if (eq(w, h, 216, 279)) name = 'Letter';
    else if (eq(w, h, 216, 356)) name = 'Legal';
    return `${name} \u2014 ${w} \u00d7 ${h} mm`;
}

async function init() {
    try {
        const r = await fetch('content.json');
        appContent = await r.json();
    } catch (e) { console.error('Failed to load content.json'); }
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js').catch(console.error);
    }
}

function handleRouting() {
    const path = window.location.pathname.toLowerCase();
    if (path === '/' || path === '') { goHome(true); return; }
    const toolKey = ROUTES[path];
    if (toolKey) openTool(toolKey, true);
    else { history.replaceState({}, '', '/'); goHome(true); }
}

window.addEventListener('popstate', handleRouting);

function setupGlobalModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', e => { if (e.target === modal) closeModal(modal); });
    });
    if (DOM.editPreviewModal) {
        DOM.editPreviewModal.addEventListener('click', e => {
            if (e.target === DOM.editPreviewModal) closeEditPreview();
        });
        DOM.previewClose.addEventListener('click', closeEditPreview);
    }
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            const open = document.querySelector('.modal:not(.hidden)');
            if (open) closeModal(open);
            if (!DOM.editPreviewModal.classList.contains('hidden')) closeEditPreview();
        }
    });
}

function openModal(el)  { if (!el) return; el.classList.remove('hidden'); document.body.classList.add('modal-open'); }
function closeModal(el) {
    if (!el) return;
    el.classList.add('hidden');
    if (!document.querySelectorAll('.modal:not(.hidden)').length) document.body.classList.remove('modal-open');
}

function showInfoModal(title, text) {
    DOM.modalTitle.innerText = title;
    DOM.modalBody.innerText  = text;
    openModal(DOM.infoModal);
}

DOM.btnModalClose.addEventListener('click', () => closeModal(DOM.infoModal));

DOM.btnAbout.addEventListener('click', () => {
    if (appContent) showInfoModal('حول QikPDF', appContent.about);
});

DOM.btnInfo.addEventListener('click', () => {
    if (!appContent || !state.currentTool) return;
    const map = {
        'pdfinfo': 'pdfInfo', 'metadata': 'metadata',
        'pdf2img': 'pdfToImages', 'img2pdf': 'imageToPdf',
        'merge': 'merge', 'split': 'split', 'rotate': 'rotate'
    };
    const text = appContent.tools[map[state.currentTool]] || 'المعلومات غير متاحة.';
    showInfoModal(toolConfig[state.currentTool].title, text);
});

window.addEventListener('resize', debounce(() => {
    if (!DOM.editPreviewModal.classList.contains('hidden') && previewState.type === 'pdf-full') {
        renderFullPdfPreviewPage();
    }
}, 200));

async function openEditPreview(data, type, pageNum = 1) {
    DOM.previewBody.innerHTML = '';
    DOM.editPreviewModal.classList.remove('hidden');
    previewState.type = type;
    const oldNav = document.querySelector('.preview-nav');
    if (oldNav) oldNav.remove();

    if (type === 'image') {
        const img = document.createElement('img');
        img.src = UrlManager.create(data);
        DOM.previewBody.appendChild(img);
    } else if (type === 'pdf-single') {
        try {
            const page     = await data.getPage(pageNum);
            const rect     = DOM.previewBody.getBoundingClientRect();
            const dpr      = window.devicePixelRatio || 1;
            const rotation = page.rotate || 0;
            const vu       = page.getViewport({ scale: 1, rotation });
            const scale    = Math.min((rect.width - 40) / vu.width, (rect.height - 40) / vu.height) * dpr;
            const viewport = page.getViewport({ scale, rotation });
            const canvas   = document.createElement('canvas');
            canvas.width   = viewport.width;
            canvas.height  = viewport.height;
            canvas.style.width  = (viewport.width  / dpr) + 'px';
            canvas.style.height = (viewport.height / dpr) + 'px';
            DOM.previewBody.appendChild(canvas);
            await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
            page.cleanup();
        } catch (e) { DOM.previewBody.innerText = 'Preview Error'; }
    } else if (type === 'pdf-full') {
        try {
            DOM.previewBody.innerHTML = '<div class="loading-spinner">Loading...</div>';
            let doc;
            if (data instanceof File) {
                doc = await pdfjsLib.getDocument(await data.arrayBuffer()).promise;
            } else if (data instanceof ArrayBuffer) {
                doc = await pdfjsLib.getDocument(data).promise;
            } else {
                doc = data;
            }
            previewState.doc   = doc;
            previewState.total = doc.numPages;
            previewState.page  = 1;
            await renderFullPdfPreviewPage();
        } catch (e) { DOM.previewBody.innerText = 'Preview Error'; }
    }
}

async function renderFullPdfPreviewPage() {
    if (!document.querySelector('.preview-nav')) {
        const nav = document.createElement('div');
        nav.className = 'preview-nav';
        nav.innerHTML = `
            <button id="prev-btn" class="btn-outline">&lt;</button>
            <span id="preview-page-indicator">${previewState.page} / ${previewState.total}</span>
            <button id="next-btn" class="btn-outline">&gt;</button>
        `;
        DOM.editPreviewModal.querySelector('.preview-content').appendChild(nav);
        nav.querySelector('#prev-btn').onclick = () => { if (previewState.page > 1) { previewState.page--; renderFullPdfPreviewPage(); } };
        nav.querySelector('#next-btn').onclick = () => { if (previewState.page < previewState.total) { previewState.page++; renderFullPdfPreviewPage(); } };
    } else {
        document.getElementById('preview-page-indicator').innerText = `${previewState.page} / ${previewState.total}`;
    }
    DOM.previewBody.innerHTML = '';
    const canvas = document.createElement('canvas');
    DOM.previewBody.appendChild(canvas);
    try {
        const page     = await previewState.doc.getPage(previewState.page);
        const dpr      = window.devicePixelRatio || 1;
        const rect     = DOM.previewBody.getBoundingClientRect();
        const rotation = page.rotate || 0;
        const vu       = page.getViewport({ scale: 1, rotation });
        const scale    = Math.min((rect.width - 40) / vu.width, (rect.height - 100) / vu.height) * dpr;
        const viewport = page.getViewport({ scale, rotation });
        canvas.width   = viewport.width;
        canvas.height  = viewport.height;
        canvas.style.width  = (viewport.width  / dpr) + 'px';
        canvas.style.height = (viewport.height / dpr) + 'px';
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        page.cleanup();
    } catch (e) { console.error(e); }
}

function closeEditPreview() {
    DOM.editPreviewModal.classList.add('hidden');
    DOM.previewBody.innerHTML = '';
    const nav = document.querySelector('.preview-nav');
    if (nav) nav.remove();
    if (previewState.doc && previewState.type === 'pdf-full') {
        if (previewState.doc.destroy) previewState.doc.destroy();
        previewState.doc = null;
    }
}

let exportResolve = null;
function openExportModal() {
    return new Promise(resolve => {
        exportResolve = resolve;
        DOM.exportFilename.value = '';
        DOM.exportSize.value     = 'default';
        DOM.exportRotation.value = '0';
        DOM.customSizeInputs.classList.add('hidden');
        DOM.customWidth.value  = '';
        DOM.customHeight.value = '';
        if (DOM.exportSizeGroup)     DOM.exportSizeGroup.classList.add('hidden');
        if (DOM.exportRotationGroup) DOM.exportRotationGroup.classList.add('hidden');
        if (state.currentTool === 'img2pdf' || state.currentTool === 'merge') {
            if (DOM.exportSizeGroup) DOM.exportSizeGroup.classList.remove('hidden');
        }
        openModal(DOM.exportModal);
    });
}

DOM.exportSize.addEventListener('change', e => {
    DOM.customSizeInputs.classList.toggle('hidden', e.target.value !== 'custom');
});

function finishExportModal(confirmed) {
    if (confirmed) {
        state.exportSettings.size           = DOM.exportSize.value;
        state.exportSettings.filename       = DOM.exportFilename.value.trim();
        state.exportSettings.exportRotation = parseInt(DOM.exportRotation.value) || 0;
        if (state.exportSettings.size === 'custom') {
            const w = parseFloat(DOM.customWidth.value);
            const h = parseFloat(DOM.customHeight.value);
            if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) { alert('يرجى إدخال أبعاد صحيحة.'); return; }
            const factors = { mm: 2.83465, cm: 28.3465, inch: 72 };
            const f = factors[DOM.customUnit.value] || 1;
            state.exportSettings.customWidth  = w * f;
            state.exportSettings.customHeight = h * f;
        }
    }
    closeModal(DOM.exportModal);
    if (exportResolve) exportResolve(confirmed);
    exportResolve = null;
}

DOM.btnExportClose.addEventListener('click',   () => { if (!processingLock) finishExportModal(false); });
DOM.btnExportCancel.addEventListener('click',  () => { if (!processingLock) finishExportModal(false); });
DOM.btnExportConfirm.addEventListener('click', () => { if (!processingLock) finishExportModal(true);  });

DOM.btnProcess.addEventListener('click', async () => {
    if (processingLock) return;
    try {
        const tool = state.currentTool;
        let files  = [];
        if (tool === 'img2pdf') {
            files = state.imgFiles;
            if (!files.length) return alert('يرجى اختيار صور.');
        } else if (tool === 'merge') {
            files = state.mergeFiles;
            if (!files.length) return alert('يرجى اختيار ملفات PDF.');
        } else {
            if (state.sourceFile) files = [state.sourceFile];
        }
        if (tool === 'pdf2img') {
            if (!state.pdfImgDoc) return alert('لم يتم تحميل ملف PDF.');
            if (!state.pdfImgSelectedPages.size) return alert('حدد صفحة واحدة على الأقل.');
        }
        if (!(await safetyGate(tool, files))) return;
        if (tool === 'split' && state.splitMode === 'custom' && !state.splitRanges.length) {
            const blocks = document.querySelectorAll('.range-block');
            state.splitRanges = [];
            let valid = true;
            blocks.forEach(b => {
                const s = parseInt(b.querySelector('.range-start').value);
                const e = parseInt(b.querySelector('.range-end').value);
                if (isNaN(s) || isNaN(e) || s > e || s < 1 || e > state.splitDoc.numPages) valid = false;
                else state.splitRanges.push({ start: s, end: e });
            });
            if (!valid || !state.splitRanges.length) return alert('نطاقات التقسيم غير صحيحة.');
        }
        const confirmed = await openExportModal();
        if (!confirmed) return;
        processingLock = true;
        DOM.globalActions.classList.add('disabled-ui');
        DOM.btnProcess.disabled  = true;
        DOM.btnProcess.innerText = 'جارٍ المعالجة...';
        if (DOM.led) DOM.led.classList.add('animating');
        DOM.dropZone.classList.add('hidden');
        DOM.reorderContainer.classList.add('hidden');
        DOM.rotateUi.classList.add('hidden');
        DOM.splitUi.classList.add('hidden');
        DOM.pdf2ImgUi.classList.add('hidden');
        DOM.metadataUi.classList.add('hidden');
        DOM.resultContainer.classList.add('hidden');
        DOM.progressContainer.classList.remove('hidden');
        await processFiles();
    } catch (e) {
        handleError(e);
        UrlManager.revokeAll();
    } finally {
        processingLock = false;
        DOM.globalActions.classList.remove('disabled-ui');
    }
});

DOM.btnDownloadAction.addEventListener('click', () => {
    if (processingLock || !state.resultBlob) return;
    processingLock = true;
    DOM.btnDownloadAction.disabled = true;
    try {
        const url = URL.createObjectURL(state.resultBlob);
        const a   = document.createElement('a');
        a.href = url; a.download = state.resultName;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) { console.error(e); }
    finally { setTimeout(() => { processingLock = false; DOM.btnDownloadAction.disabled = false; }, 500); }
});

DOM.btnClearResult.addEventListener('click', () => { if (!processingLock) resetToolUI(); });
DOM.btnMetaClear.addEventListener('click', () => {
    if (processingLock) return;
    DOM.metaTitle.value = ''; DOM.metaAuthor.value = ''; DOM.metaSubject.value = '';
    DOM.metaKeywords.value = ''; DOM.metaCreator.value = '';
});

DOM.logoHome.addEventListener('click', () => { if (!processingLock) goHome(); });
DOM.btnBack.addEventListener('click',  () => { if (!processingLock) goHome(); });

function goHome(skipPushState = false) {
    DOM.toolView.classList.add('hidden');
    DOM.mainView.classList.remove('hidden');
    resetToolUI();
    if (!skipPushState) history.pushState({}, '', '/');
}

function openTool(toolName, skipPushState = false) {
    if (processingLock) return;
    const card = document.querySelector(`.tool-card[data-tool="${toolName}"]`);
    if (!card) return;
    const iconEl = card.querySelector('.card-icon svg') || card.querySelector('svg');
    if (iconEl) DOM.toolTitleIcon.innerHTML = iconEl.outerHTML;
    state.currentTool      = toolName;
    DOM.toolTitleText.innerText = toolConfig[toolName].title;
    DOM.fileInput.accept   = toolConfig[toolName].accept;
    DOM.fileInput.multiple = toolConfig[toolName].multiple;
    DOM.mainView.classList.add('hidden');
    DOM.toolView.classList.remove('hidden');
    resetToolUI();
    if (!skipPushState) {
        const entry = Object.entries(ROUTES).find(([, k]) => k === toolName);
        if (entry) history.pushState({}, '', entry[0]);
    }
}

DOM.toolCards.forEach(card => {
    card.addEventListener('click', () => openTool(card.getAttribute('data-tool')));
});

function resetToolUI() {
    if (processingLock) return;
    DOM.dropZone.classList.remove('hidden');
    DOM.progressContainer.classList.add('hidden');
    DOM.resultContainer.classList.add('hidden');
    DOM.reorderContainer.classList.add('hidden');
    DOM.rotateUi.classList.add('hidden');
    DOM.splitUi.classList.add('hidden');
    DOM.pdf2ImgUi.classList.add('hidden');
    DOM.pdfInfoUi.classList.add('hidden');
    DOM.metadataUi.classList.add('hidden');
    DOM.globalActions.classList.add('hidden');
    DOM.fileInput.value = '';
    const ve = document.getElementById('file-val-error');
    if (ve) ve.remove();
    if (DOM.led) DOM.led.classList.remove('animating');
    UrlManager.revokeAll();
    state.resultBlob = null; state.resultName = ''; state.imgFiles = []; state.mergeFiles = [];
    state.rotateFile = null; state.rotateAngle = 90; state.splitFile = null; state.splitMode = 'all';
    state.splitRanges = []; state.sourceFile = null;
    state.exportSettings = { size: 'default', filename: '', customWidth: 0, customHeight: 0, exportRotation: 0 };
    state.pdfImgNames.clear(); state.splitNames.clear(); state.splitAllPageNames.clear();
    if (state.splitDoc)       { state.splitDoc.destroy();         state.splitDoc = null; }
    if (state.pdfImgDoc)      { state.pdfImgDoc.destroy();        state.pdfImgDoc = null; }
    if (state.pdfImgObserver) { state.pdfImgObserver.disconnect(); state.pdfImgObserver = null; }
    state.pdfImgSelectedPages.clear();
    DOM.pdfGrid.innerHTML = '';
    if (DOM.splitAllList)  DOM.splitAllList.innerHTML = '';
    if (DOM.splitAllNames) DOM.splitAllNames.classList.add('hidden');
    DOM.btnProcess.innerText = 'معالجة PDF';
    DOM.btnProcess.disabled  = false;
    DOM.btnProcess.classList.remove('hidden');
    DOM.btnDownloadAction.classList.add('hidden');
    DOM.btnClearResult.classList.add('hidden');
    DOM.globalActions.classList.remove('disabled-ui');
    DOM.rotateBtns.forEach(b => b.classList.remove('selected'));
    const rightBtn = document.querySelector('.rotate-btn[data-angle="90"]');
    if (rightBtn) rightBtn.classList.add('selected');
    setProgress(0);
}

DOM.dropZone.addEventListener('click',    () => { if (!processingLock) DOM.fileInput.click(); });
DOM.dropZone.addEventListener('dragover', e => { e.preventDefault(); if (!processingLock) DOM.dropZone.classList.add('dragover'); });
DOM.dropZone.addEventListener('dragleave', () => DOM.dropZone.classList.remove('dragover'));
DOM.dropZone.addEventListener('drop', e => {
    e.preventDefault(); DOM.dropZone.classList.remove('dragover');
    if (!processingLock && e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
});
DOM.fileInput.addEventListener('change', e => {
    if (!processingLock && e.target.files.length) handleFiles(e.target.files);
});

DOM.rotateBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        if (processingLock) return;
        const angle = parseInt(btn.getAttribute('data-angle'));
        if (!isNaN(angle)) {
            state.rotateAngle = angle;
            DOM.rotateBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        }
    });
});

DOM.splitModeRadios.forEach(radio => {
    radio.addEventListener('change', e => {
        if (processingLock) return;
        state.splitMode = e.target.value;
        if (state.splitMode === 'custom') {
            DOM.splitCustomOptions.classList.remove('hidden');
            renderSplitRanges(DOM.splitRangeCount.value);
            if (DOM.splitAllNames) DOM.splitAllNames.classList.add('hidden');
        } else {
            DOM.splitCustomOptions.classList.add('hidden');
            if (state.splitDoc) renderSplitAllNames();
        }
    });
});

DOM.splitRangeCount.addEventListener('input', e => {
    if (processingLock) return;
    const v = parseInt(e.target.value) || 1;
    if (v > 0 && v <= 50) renderSplitRanges(v);
});

DOM.btnSelectAll.addEventListener('click', () => {
    if (processingLock || !state.pdfImgDoc) return;
    document.querySelectorAll('.page-card').forEach(c => c.classList.add('selected'));
    for (let i = 1; i <= state.pdfImgDoc.numPages; i++) state.pdfImgSelectedPages.add(i);
});

DOM.btnSelectNone.addEventListener('click', () => {
    if (processingLock || !state.pdfImgDoc) return;
    document.querySelectorAll('.page-card').forEach(c => c.classList.remove('selected'));
    state.pdfImgSelectedPages.clear();
});

DOM.pdfImgSearch.addEventListener('input', debounce(e => {
    if (processingLock) return;
    const v = parseInt(e.target.value);
    if (!state.pdfImgDoc || isNaN(v) || v < 1 || v > state.pdfImgDoc.numPages) return;
    const el = document.getElementById(`pdf-page-${v}`);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        document.querySelectorAll('.search-highlight').forEach(n => n.classList.remove('search-highlight'));
        el.classList.add('search-highlight');
        setTimeout(() => el.classList.remove('search-highlight'), 1500);
    }
}, 150));

function handleFiles(files) {
    if (processingLock) return;
    const LIMIT = SAFETY_ENGINE.isMobile() ? 400 : 1000;
    const big   = Array.from(files).filter(f => f.size / 1048576 > LIMIT);
    if (big.length) {
        const prev = document.getElementById('file-val-error');
        if (prev) prev.remove();
        const err = document.createElement('div');
        err.id = 'file-val-error'; err.className = 'file-validation-error';
        err.innerHTML = `<span class="val-icon">⛔</span><div class="val-msg"><strong>الملف كبير جداً</strong> ${big.map(f=>`${f.name} (${(f.size/1048576).toFixed(1)} MB)`).join(', ')} يتجاوز الحد الآمن ${LIMIT} MB.</div>`;
        DOM.dropZone.insertAdjacentElement('afterend', err);
        DOM.fileInput.value = '';
        setTimeout(() => { if (err.parentNode) err.remove(); }, 6000);
        return;
    }
    const prev = document.getElementById('file-val-error');
    if (prev) prev.remove();
    const accept  = toolConfig[state.currentTool].accept;
    const fileArr = Array.from(files).filter(f => {
        if (accept.includes('image/'))        return f.type.startsWith('image/') || f.name.match(/\.(png|jpe?g)$/i);
        if (accept.includes('application/pdf')) return f.type === 'application/pdf' || f.name.match(/\.pdf$/i);
        return false;
    });
    if (!fileArr.length) { alert('صيغة الملف غير مدعومة لهذه الأداة.'); return; }
    if (!toolConfig[state.currentTool].multiple && fileArr.length > 1) fileArr.length = 1;
    state.resultBlob = null; state.resultName = '';
    DOM.resultContainer.classList.add('hidden');
    DOM.globalActions.classList.remove('hidden');
    if (state.currentTool === 'img2pdf') { state.imgFiles   = state.imgFiles.concat(fileArr);   renderReorderUI(); return; }
    if (state.currentTool === 'merge')   { state.mergeFiles = state.mergeFiles.concat(fileArr);  renderReorderUI(); return; }
    DOM.dropZone.classList.add('hidden');
    state.sourceFile = fileArr[0];
    if (state.currentTool === 'pdfinfo')  { initPdfInfoUI(fileArr[0]);  return; }
    if (state.currentTool === 'metadata') { initMetadataUI(fileArr[0]); return; }
    if (state.currentTool === 'rotate') {
        state.rotateFile = fileArr[0];
        DOM.rotateUi.classList.remove('hidden');
        DOM.rotateFilename.innerText = fileArr[0].name;
        return;
    }
    if (state.currentTool === 'split') {
        state.splitFile = fileArr[0];
        DOM.splitUi.classList.remove('hidden');
        initSplitUI(fileArr[0]);
        return;
    }
    if (state.currentTool === 'pdf2img') { initPdfToImgUI(fileArr[0]); return; }
}

function handleError(e) {
    console.error(e);
    DOM.progressContainer.classList.add('hidden');
    DOM.resultContainer.classList.remove('hidden');
    DOM.resultContainer.innerHTML = `<div class="success-box error-box"><div class="success-icon error-icon">!</div><div class="success-text"><h4>خطأ</h4><p id="error-msg-el"></p></div></div>`;
    document.getElementById('error-msg-el').textContent = e.message || 'حدث خطأ غير متوقع.';
    if (DOM.led) DOM.led.classList.remove('animating');
    DOM.btnProcess.disabled  = false;
    DOM.btnProcess.innerText = 'معالجة PDF';
    DOM.globalActions.classList.remove('disabled-ui');
    DOM.btnProcess.classList.remove('hidden');
}

let dragStartIndex = -1;
function renderReorderUI() {
    UrlManager.revokeAll();
    const container   = DOM.reorderContainer;
    container.innerHTML = '';
    const isImg       = state.currentTool === 'img2pdf';
    const activeFiles = isImg ? state.imgFiles : state.mergeFiles;
    if (!activeFiles.length) {
        container.classList.add('hidden');
        DOM.dropZone.classList.remove('hidden');
        return;
    }
    DOM.dropZone.classList.remove('hidden');
    container.classList.remove('hidden');
    const list = document.createElement('div');
    list.className = 'reorder-list';
    activeFiles.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'reorder-item'; item.draggable = true;
        item.addEventListener('dragstart', e => { if (processingLock) { e.preventDefault(); return; } dragStartIndex = index; item.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; });
        item.addEventListener('dragover',  e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
        item.addEventListener('dragenter', e => { e.preventDefault(); item.classList.add('drag-over'); });
        item.addEventListener('dragleave', () => item.classList.remove('drag-over'));
        item.addEventListener('drop', e => {
            e.preventDefault(); item.classList.remove('drag-over');
            if (dragStartIndex > -1 && dragStartIndex !== index && !processingLock) {
                activeFiles.splice(index, 0, activeFiles.splice(dragStartIndex, 1)[0]);
                renderReorderUI();
            }
        });
        item.addEventListener('dragend', () => { item.classList.remove('dragging'); dragStartIndex = -1; });
        const handle = document.createElement('div');
        handle.className = 'drag-handle'; handle.innerText = '::';
        const idx = document.createElement('span');
        idx.className = 'item-idx'; idx.innerText = `[${String(index + 1).padStart(2, '0')}]`;
        const thumbWrap = document.createElement('div');
        thumbWrap.className = 'item-thumb-container';
        if (isImg) {
            const thumb = document.createElement('img');
            thumb.className = 'item-thumb'; thumb.src = UrlManager.create(file);
            thumb.onclick = () => { if (!processingLock) openEditPreview(file, 'image'); };
            thumbWrap.appendChild(thumb);
        } else {
            const icon = document.createElement('div');
            icon.className = 'item-thumb doc-icon'; icon.innerText = 'PDF';
            icon.onclick = () => { if (!processingLock) openEditPreview(file, 'pdf-full'); };
            thumbWrap.appendChild(icon);
        }
        const name = document.createElement('span');
        name.className = 'item-name'; name.innerText = file.name;
        const rm = document.createElement('button');
        rm.className = 'btn-remove'; rm.innerText = 'X';
        rm.onclick = () => { if (!processingLock) { activeFiles.splice(index, 1); renderReorderUI(); } };
        item.appendChild(handle); item.appendChild(idx); item.appendChild(thumbWrap);
        item.appendChild(name); item.appendChild(rm);
        list.appendChild(item);
    });
    container.appendChild(list);
}

function getTargetSize() {
    const s = state.exportSettings.size;
    if (s === 'custom') return [state.exportSettings.customWidth, state.exportSettings.customHeight];
    return PAGE_SIZES[s];
}

function setProgress(percent, msg = 'PROCESSING...') {
    const p    = Math.min(100, Math.max(0, Math.round(percent)));
    const fill = Math.round((p / 100) * 14);
    DOM.asciiProgress.innerText = `[${'█'.repeat(fill)}${'░'.repeat(14 - fill)}] ${p}%`;
    if (msg) DOM.statusText.innerText = msg;
}

async function processFiles() {
    const tool = state.currentTool;
    const files = (tool === 'img2pdf') ? state.imgFiles
                : (tool === 'merge')   ? state.mergeFiles
                : [state.sourceFile];
    if (!files[0]) throw new Error('لم يتم تحميل أي ملف.');
    if      (tool === 'pdf2img')  await execPdfToImg(files[0]);
    else if (tool === 'img2pdf')  await execImgToPdf(files);
    else if (tool === 'merge')    await execMerge(files);
    else if (tool === 'split')    await execSplit(files[0]);
    else if (tool === 'rotate')   await execRotate(files[0]);
    else if (tool === 'metadata') await execMetadata(files[0]);
    DOM.progressContainer.classList.add('hidden');
    DOM.resultContainer.classList.remove('hidden');
    UrlManager.revokeAll();
    DOM.resultContainer.innerHTML = `<div class="success-box"><div class="success-icon">✓</div><div class="success-text"><h4>تمّت بنجاح!</h4><p>ملفك جاهز للتنزيل.</p><small id="success-filename-el"></small></div></div>`;
    document.getElementById('success-filename-el').textContent = state.resultName;
    if (DOM.led) DOM.led.classList.remove('animating');
    DOM.btnProcess.classList.add('hidden');
    DOM.btnDownloadAction.classList.remove('hidden');
    DOM.btnClearResult.classList.remove('hidden');
    DOM.btnDownloadAction.disabled = false;
    DOM.globalActions.classList.remove('disabled-ui');
}

init();
