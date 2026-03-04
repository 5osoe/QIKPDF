// Safety check: Prevent crash if library isn't loaded yet
if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
} else {
    console.warn("PDF Lib not loaded. Check internet connection.");
}

// --- STEP 1: ROUTE MAP ---
const ROUTES = {
  "/merge": "merge",
  "/rotate": "rotate",
  "/split": "split",
  "/pdf2img": "pdf2img",
  "/img2pdf": "img2pdf",   
  "/pdfinfo": "pdfinfo",   
  "/metadata": "metadata"
};

// INTRO SCREEN REMOVAL & THEME INIT
document.addEventListener("DOMContentLoaded", () => {
    initTheme(); 
    updateUIText(); 
    setupGlobalModals();
    
    // --- STEP 3: CALL ROUTER ON LOAD ---
    handleRouting();
});

// --- UI STRINGS (ENGLISH ONLY) ---
const UI_STRINGS = {
    pdfinfo: "PDF INFO",
    metadata: "METADATA",
    pdf2img: "PDF → IMG",
    img2pdf: "IMG → PDF",
    merge: "MERGE",
    split: "SPLIT",
    rotate: "ROTATE",
    dropText: "DROP FILE(S) HERE<br>OR CLICK TO SELECT",
    toolTitle: "TOOL",
    metaTitle: "TITLE",
    metaAuthor: "AUTHOR",
    metaSubject: "SUBJECT",
    metaKeywords: "KEYWORDS",
    metaCreator: "CREATOR",
    clearMeta: "CLEAR ALL METADATA",
    selectAll: "SELECT ALL",
    selectNone: "NONE",
    searchPage: "SEARCH PAGE #",
    rotateLeft: "LEFT",
    rotateFlip: "FLIP",
    rotateRight: "RIGHT",
    ccw: "90° CCW",
    d180: "180°",
    cw: "90° CW",
    selected: "SELECTED",
    file: "FILE",
    pages: "PAGES",
    splitModeAll: "ALL (SEPARATE FILES)",
    splitModeCustom: "CUSTOM RANGES",
    outputFiles: "NUMBER OF OUTPUT FILES",
    from: "FROM",
    to: "TO",
    filename: "FILENAME",
    process: "PROCESS PDF",
    processing: "PROCESSING...",
    download: "DOWNLOAD",
    clear: "CLEAR",
    success: "SUCCESS!",
    ready: "Your file is ready.",
    applyChanges: "APPLY CHANGES",
    exportSettings: "EXPORT SETTINGS",
    exportFilename: "FILENAME (OPTIONAL)",
    pageSize: "PAGE SIZE",
    originalSize: "ORIGINAL (NO CHANGE)",
    customSize: "CUSTOM SIZE...",
    docRotation: "DOCUMENT ROTATION",
    none: "NONE (0°)",
    cancel: "CANCEL",
    confirm: "CONFIRM",
    width: "WIDTH",
    height: "HEIGHT",
    unit: "UNIT",
    infoTitle: "INFO",
    viewPdf: "VIEW PDF",
    properties: "FILE PROPERTIES",
    metaHeader: "METADATA",
    fileNameLabel: "FILE NAME",
    fileSizeLabel: "FILE SIZE",
    pagesLabel: "PAGES",
    dimensionsLabel: "DIMENSIONS (P1)",
    error: "ERROR",
    errorGeneric: "An unexpected error occurred.",
    mmUnit: "mm",
    customDim: "Custom",
    iso_A4: "A4",
    iso_A3: "A3",
    iso_A5: "A5",
    iso_Letter: "Letter",
    iso_Legal: "Legal"
};

const DOM = {
    btnAbout: document.getElementById('btn-about'),
    btnTheme: document.getElementById('btn-theme'),
    btnInfo: document.getElementById('btn-info'),
    led: document.querySelector('.led'),
    
    // Modals
    infoModal: document.getElementById('info-modal'),
    modalTitle: document.getElementById('modal-title'),
    modalBody: document.getElementById('modal-body'),
    btnModalClose: document.getElementById('btn-modal-close'),
    
    // Export Modal
    exportModal: document.getElementById('export-modal'),
    exportFilename: document.getElementById('export-filename'),
    exportSize: document.getElementById('export-size'),
    exportSizeGroup: document.getElementById('export-size-group'), 
    exportRotation: document.getElementById('export-rotation'),
    exportRotationGroup: document.getElementById('export-rotation-group'),
    customSizeInputs: document.getElementById('custom-size-inputs'),
    customWidth: document.getElementById('custom-width'),
    customHeight: document.getElementById('custom-height'),
    customUnit: document.getElementById('custom-unit'),
    btnExportClose: document.getElementById('btn-export-close'),
    btnExportCancel: document.getElementById('btn-export-cancel'),
    btnExportConfirm: document.getElementById('btn-export-confirm'),

    // Edit Preview Modal
    editPreviewModal: document.getElementById('edit-preview-modal'),
    previewClose: document.getElementById('preview-close'),
    previewBody: document.getElementById('preview-body'),

    // Main UI
    logoHome: document.getElementById('logo-home'),
    mainView: document.getElementById('main-view'),
    toolView: document.getElementById('tool-view'),
    toolCards: document.querySelectorAll('.tool-card'),
    toolTitleText: document.getElementById('tool-title-text'),
    toolTitleIcon: document.getElementById('tool-title-icon'),
    btnBack: document.getElementById('btn-back'),
    dropZone: document.getElementById('drop-zone'),
    dropText: document.getElementById('drop-text'),
    fileInput: document.getElementById('file-input'),
    reorderContainer: document.getElementById('reorder-container'),
    progressContainer: document.getElementById('progress-container'),
    asciiProgress: document.getElementById('ascii-progress'),
    statusText: document.getElementById('status-text'),
    
    // Result Container
    resultContainer: document.getElementById('result-container'),
    
    // Global Actions
    globalActions: document.getElementById('global-actions'),
    btnProcess: document.getElementById('btn-process'),
    btnDownloadAction: document.getElementById('btn-download-action'),
    btnClearResult: document.getElementById('btn-clear-result'),

    // Tools UI
    pdfInfoUi: document.getElementById('pdf-info-ui'),
    pdfInfoContent: document.getElementById('pdf-info-content'),
    metadataUi: document.getElementById('metadata-ui'),
    metaTitle: document.getElementById('meta-title'),
    metaAuthor: document.getElementById('meta-author'),
    metaSubject: document.getElementById('meta-subject'),
    metaKeywords: document.getElementById('meta-keywords'),
    metaCreator: document.getElementById('meta-creator'),
    btnMetaClear: document.getElementById('btn-meta-clear'),
    rotateUi: document.getElementById('rotate-ui'),
    rotateFilename: document.getElementById('rotate-filename'),
    rotateBtns: document.querySelectorAll('.rotate-btn'),
    splitUi: document.getElementById('split-ui'),
    splitFilename: document.getElementById('split-filename'),
    splitPageCount: document.getElementById('split-pagecount'),
    splitModeRadios: document.querySelectorAll('input[name="split-mode"]'),
    splitCustomOptions: document.getElementById('split-custom-options'),
    splitRangeCount: document.getElementById('split-range-count'),
    splitRangesContainer: document.getElementById('split-ranges-container'),
    splitAllNames: document.getElementById('split-all-names'),
    splitAllCount: document.getElementById('split-all-count'),
    splitAllList: document.getElementById('split-all-list'),
    pdf2ImgUi: document.getElementById('pdf2img-ui'),
    pdfGrid: document.getElementById('pdf-grid'),
    btnSelectAll: document.getElementById('btn-select-all'),
    btnSelectNone: document.getElementById('btn-select-none'),
    pdfImgSearch: document.getElementById('pdf2img-search') 
};

// --- GLOBAL STATE & LOCK ---
let processingLock = false; 

// --- SMART SAFETY ENGINE (PHASE 1) ---
const SAFETY_ENGINE = {
    // Limits in MB
    LIMITS: {
        MOBILE: 350,
        DESKTOP: 900
    },
    
    // Heuristic Multipliers (Est. RAM per MB of file)
    MULTIPLIERS: {
        'pdf2img': 6.0,   // Canvas rendering is very heavy
        'img2pdf': 3.5,   // Raw images in memory
        'merge': 2.5,     // Loading multiple docs
        'split': 2.0,
        'rotate': 2.0,
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
        
        let totalSizeMB = 0;
        // Handle array or single file
        const fileList = Array.isArray(files) ? files : [files];
        
        fileList.forEach(f => {
            if(f && f.size) totalSizeMB += f.size / (1024 * 1024);
        });

        const factor = this.MULTIPLIERS[tool] || 2.0;
        return totalSizeMB * factor;
    }
};

/**
 * Safety Gate: Checks if operation is safe to proceed.
 * @param {string} tool - Current tool name
 * @param {Array|File} files - Files to process
 * @returns {Promise<boolean>} - True if safe/user confirmed, False if blocked/cancelled
 */
async function safetyGate(tool, files) {
    const estMemory = SAFETY_ENGINE.estimateMemory(tool, files);
    const limit = SAFETY_ENGINE.getSafetyLimit();
    
    // 1. Safe Zone
    if (estMemory < limit) {
        return true;
    }

    // 2. Risk Zone (User Confirmation)
    if (estMemory < (limit * 1.5)) {
        return confirm(
            `⚠️ PERFORMANCE WARNING\n\n` +
            `This operation requires approx. ${Math.round(estMemory)}MB of memory.\n` +
            `It might cause your browser to freeze momentarily.\n\n` +
            `Do you want to continue?`
        );
    }

    // 3. Danger Zone (Block)
    alert(
        `⛔ OPERATION BLOCKED\n\n` +
        `The selected files are too large for this device.\n` +
        `Estimated Memory: ${Math.round(estMemory)}MB\n` +
        `Safe Limit: ${limit}MB\n\n` +
        `Please try smaller files or use a Desktop computer.`
    );
    return false;
}
// --- END SAFETY ENGINE ---

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const preferredTheme = savedTheme || 'light';
    document.documentElement.setAttribute('data-theme', preferredTheme);
}

function toggleTheme() {
    const overlay = document.getElementById('theme-overlay');
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';

    // Apply the new theme immediately (hidden behind overlay)
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);

    // Flash the overlay so the color change is smooth, not jarring
    if (overlay) {
        overlay.classList.remove('transitioning');
        // Force reflow so animation restarts cleanly
        void overlay.offsetWidth;
        overlay.classList.add('transitioning');
        overlay.addEventListener('animationend', () => {
            overlay.classList.remove('transitioning');
        }, { once: true });
    }
}

if (DOM.btnTheme) {
    DOM.btnTheme.addEventListener('click', toggleTheme);
}

function getT(key) {
    return UI_STRINGS[key] || key;
}

function updateUIText() {
    DOM.toolCards.forEach(card => {
        const tool = card.getAttribute('data-tool');
        const span = card.querySelector('span');
        if (span) span.innerText = getT(tool);
    });

    if (DOM.dropText) DOM.dropText.innerHTML = getT('dropText');
    DOM.btnProcess.innerText = getT('process');
    DOM.btnDownloadAction.innerText = getT('download');
    DOM.btnClearResult.innerText = getT('clear');
    DOM.btnMetaClear.innerText = getT('clearMeta');
    DOM.btnSelectAll.innerText = getT('selectAll');
    DOM.btnSelectNone.innerText = getT('selectNone');
    DOM.btnExportCancel.innerText = getT('cancel');
    DOM.btnExportConfirm.innerText = getT('confirm');
    DOM.pdfImgSearch.placeholder = getT('searchPage');
    DOM.exportFilename.placeholder = getT('filename');

    const updateTextById = (id, key) => {
        const el = document.getElementById(id);
        if (el) el.innerText = getT(key);
    };

    updateTextById('tool-title-text', state.currentTool ? state.currentTool : 'toolTitle');
    updateTextById('modal-title', 'infoTitle');
    
    document.querySelectorAll('.rotate-btn').forEach(btn => {
        const angle = btn.getAttribute('data-angle');
        const span = btn.querySelector('span');
        const small = btn.querySelector('small');
        if (angle === '-90') { span.innerHTML = `&#8634; ${getT('rotateLeft')}`; small.innerText = getT('ccw'); }
        if (angle === '180') { span.innerHTML = `&#8644; ${getT('rotateFlip')}`; small.innerText = getT('d180'); }
        if (angle === '90') { span.innerHTML = `&#8635; ${getT('rotateRight')}`; small.innerText = getT('cw'); }
    });
    
    document.querySelectorAll('label').forEach(lbl => {
        const nextInput = lbl.nextElementSibling;
        if(nextInput && nextInput.id) {
             if(nextInput.id === 'meta-title') lbl.innerText = getT('metaTitle');
             if(nextInput.id === 'meta-author') lbl.innerText = getT('metaAuthor');
             if(nextInput.id === 'meta-subject') lbl.innerText = getT('metaSubject');
             if(nextInput.id === 'meta-keywords') lbl.innerText = getT('metaKeywords');
             if(nextInput.id === 'meta-creator') lbl.innerText = getT('metaCreator');
             if(nextInput.id === 'export-filename') lbl.innerText = getT('exportFilename');
             if(nextInput.id === 'custom-width') lbl.innerText = getT('width');
             if(nextInput.id === 'custom-height') lbl.innerText = getT('height');
        }
    });

    const splitLabels = document.querySelectorAll('.radio-container');
    if(splitLabels.length >= 2) {
        // Updated logic for new HTML structure (span vs text node)
        const label1 = splitLabels[0].querySelector('.radio-label');
        if(label1) label1.innerText = getT('splitModeAll');
        
        const label2 = splitLabels[1].querySelector('.radio-label');
        if(label2) label2.innerText = getT('splitModeCustom');
    }
}

// Memory Management
const UrlManager = {
    urls: new Set(),
    create: function(obj) {
        const url = URL.createObjectURL(obj);
        this.urls.add(url);
        return url;
    },
    revokeAll: function() {
        this.urls.forEach(url => URL.revokeObjectURL(url));
        this.urls.clear();
    }
};

let state = {
    currentTool: null,
    resultBlob: null,
    resultName: '',
    imgFiles:[],
    mergeFiles:[],
    rotateFile: null,
    rotateAngle: 90,
    splitFile: null,
    splitDoc: null, 
    splitMode: 'all', 
    splitRanges:[],
    pdfImgNames: new Map(),
    splitNames: new Map(),
    splitAllPageNames: new Map(),
    exportSettings: {
        size: 'default',
        filename: '',
        customWidth: 0,
        customHeight: 0,
        exportRotation: 0
    },
    sourceFile: null,
    pdfImgDoc: null,
    pdfImgSelectedPages: new Set(),
    pdfImgObserver: null
};

// PREVIEW STATE (Phase 2)
let previewState = { doc: null, page: 1, total: 0, type: null };

const PAGE_SIZES = {
    a0:[2383.94, 3370.39], a1:[1683.78, 2383.94], a2:[1190.55, 1683.78],
    a3:[841.89, 1190.55], a4:[595.28, 841.89], a5:[419.53, 595.28],
    a6:[297.64, 419.53], b3: [1000.62, 1417.32], b4:[708.66, 1000.62],
    b5:[498.90, 708.66], letter:[612, 792], legal: [612, 1008]
};

let appContent = null;

const toolConfig = {
    'pdfinfo': { title: 'PDF INFO', accept: 'application/pdf', multiple: false },
    'metadata': { title: 'METADATA', accept: 'application/pdf', multiple: false },
    'pdf2img': { title: 'PDF \u2192 IMG', accept: 'application/pdf', multiple: false },
    'img2pdf': { title: 'IMG \u2192 PDF', accept: 'image/png, image/jpeg', multiple: true },
    'merge': { title: 'MERGE', accept: 'application/pdf', multiple: true },
    'split': { title: 'SPLIT', accept: 'application/pdf', multiple: false },
    'rotate': { title: 'ROTATE', accept: 'application/pdf', multiple: false }
};

const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 0));

function getBaseName(filename) { return filename.replace(/\.[^/.]+$/, ""); }

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + " Bytes";
    if (bytes < 1048576) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / 1048576).toFixed(2) + " MB";
}

function formatPageSize(widthPt, heightPt) {
    const ptToMm = 0.352778;
    const wMm = Math.round(widthPt * ptToMm);
    const hMm = Math.round(heightPt * ptToMm);
    const check = (w, h, standardW, standardH) => {
        return (Math.abs(w - standardW) <= 2 && Math.abs(h - standardH) <= 2) || 
               (Math.abs(w - standardH) <= 2 && Math.abs(h - standardW) <= 2);
    };
    let name = getT('customDim');
    if (check(wMm, hMm, 210, 297)) name = getT('iso_A4');
    else if (check(wMm, hMm, 297, 420)) name = getT('iso_A3');
    else if (check(wMm, hMm, 148, 210)) name = getT('iso_A5');
    else if (check(wMm, hMm, 216, 279)) name = getT('iso_Letter');
    else if (check(wMm, hMm, 216, 356)) name = getT('iso_Legal');
    return `${name} — ${wMm} × ${hMm} ${getT('mmUnit')}`;
}

async function init() {
    try {
        const response = await fetch('content.json');
        appContent = await response.json();
    } catch (error) { console.error("Failed to load content.json"); }
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js').catch(console.error);
    }
}

// --- STEP 2: SAFE ROUTER FUNCTION ---
function handleRouting() {
  const path = window.location.pathname.toLowerCase();
  
  // Exclude root from tool matching
  if (path === "/" || path === "") {
      goHome(true);
      return;
  }
  
  const toolKey = ROUTES[path];

  if (toolKey) {
    openTool(toolKey, true); // true = skip pushState (since we are already on the URL)
  } else {
    // fallback to home if unknown path
    history.replaceState({}, "", "/");
    goHome(true);
  }
}

// --- STEP 5: HANDLE BACK/FORWARD NAVIGATION ---
window.addEventListener("popstate", () => {
  handleRouting();
});

function setupGlobalModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal(modal);
        });
    });
    if(DOM.editPreviewModal) {
        DOM.editPreviewModal.addEventListener('click', (e) => {
            if (e.target.classList.contains('preview-overlay') || e.target === DOM.editPreviewModal) closeEditPreview();
        });
        DOM.previewClose.addEventListener('click', closeEditPreview);
    }
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal:not(.hidden)');
            if (openModal) closeModal(openModal);
            if (!DOM.editPreviewModal.classList.contains('hidden')) closeEditPreview();
        }
    });
}

function openModal(modalElement) {
    if (!modalElement) return;
    modalElement.classList.remove('hidden');
    document.body.classList.add('modal-open');
}

function closeModal(modalElement) {
    if (!modalElement) return;
    modalElement.classList.add('hidden');
    const anyOpen = document.querySelectorAll('.modal:not(.hidden)').length > 0;
    if (!anyOpen) document.body.classList.remove('modal-open');
}

function showInfoModal(title, text) {
    DOM.modalTitle.innerText = title;
    DOM.modalBody.innerText = text;
    openModal(DOM.infoModal);
}

DOM.btnModalClose.addEventListener('click', () => closeModal(DOM.infoModal));
DOM.btnAbout.addEventListener('click', () => {
    if (appContent) showInfoModal('ABOUT QIKPDF', appContent.about);
});
DOM.btnInfo.addEventListener('click', () => {
    if (!appContent || !state.currentTool) return;
    const toolKeyMap = {
        'pdfinfo': 'pdfInfo', 'metadata': 'metadata',
        'pdf2img': 'pdfToImages', 'img2pdf': 'imageToPdf',
        'merge': 'merge', 'split': 'split', 'rotate': 'rotate'
    };
    const jsonKey = toolKeyMap[state.currentTool] || state.currentTool;
    const infoText = appContent.tools[jsonKey] || "Information not available.";
    showInfoModal(`${toolConfig[state.currentTool].title} INFO`, infoText);
});

// --- REBUILT PREVIEW ENGINE (PHASE 2) ---

/**
 * Handles resize events to auto-scale active PDF preview
 */
window.addEventListener('resize', debounce(() => {
    if (!DOM.editPreviewModal.classList.contains('hidden') && previewState.type === 'pdf-full') {
        renderFullPdfPreviewPage();
    }
}, 200));

async function openEditPreview(data, type, pageNum = 1) {
    DOM.previewBody.innerHTML = '';
    DOM.editPreviewModal.classList.remove('hidden');
    previewState.type = type;
    
    // Clear any previous nav
    const oldNav = document.querySelector('.preview-nav');
    if (oldNav) oldNav.remove();

    if (type === 'image') {
        const img = document.createElement('img');
        img.src = UrlManager.create(data);
        DOM.previewBody.appendChild(img);
    } 
    else if (type === 'pdf-single') {
        try {
            const page = await data.getPage(pageNum);
            const container = DOM.previewBody;
            const rect = container.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            const availW = (rect.width - 40);
            const availH = (rect.height - 40);
            const viewportUnscaled = page.getViewport({ scale: 1 });
            // Fit to container then multiply by DPR for sharpness
            const fitScale = Math.min(availW / viewportUnscaled.width, availH / viewportUnscaled.height);
            const scale = fitScale * dpr;
            const viewport = page.getViewport({ scale });
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            // CSS display size = fit size (not DPR-scaled)
            canvas.style.width  = (viewport.width  / dpr) + 'px';
            canvas.style.height = (viewport.height / dpr) + 'px';
            DOM.previewBody.appendChild(canvas);
            await page.render({ canvasContext: ctx, viewport }).promise;
            page.cleanup();
        } catch (e) {
            DOM.previewBody.innerText = "Preview Error";
        }
    }
    else if (type === 'pdf-full') {
        try {
            DOM.previewBody.innerHTML = '<div class="loading-spinner">Loading...</div>';
            let loadingTask;
            if (data instanceof File) {
                const arrayBuffer = await data.arrayBuffer();
                loadingTask = pdfjsLib.getDocument(arrayBuffer);
            } else if (data instanceof ArrayBuffer) {
                loadingTask = pdfjsLib.getDocument(data);
            } else {
                 // Document already loaded
                 previewState.doc = data;
                 previewState.total = data.numPages;
                 previewState.page = 1;
                 await renderFullPdfPreviewPage();
                 return;
            }
            const doc = await loadingTask.promise;
            previewState.doc = doc;
            previewState.total = doc.numPages;
            previewState.page = 1;
            await renderFullPdfPreviewPage();
        } catch(e) {
            DOM.previewBody.innerText = "Preview Error";
        }
    }
}

async function renderFullPdfPreviewPage() {
    // 1. Setup UI Structure if missing
    if (!document.querySelector('.preview-nav')) {
        const navDiv = document.createElement('div');
        navDiv.className = 'preview-nav';
        navDiv.innerHTML = `
            <button id="prev-btn" class="btn-outline">&lt;</button>
            <span id="preview-page-indicator">${previewState.page} / ${previewState.total}</span>
            <button id="next-btn" class="btn-outline">&gt;</button>
        `;
        // Inject into .preview-content but outside preview-body to overlay
        DOM.editPreviewModal.querySelector('.preview-content').appendChild(navDiv);
        
        // Attach listeners
        navDiv.querySelector('#prev-btn').onclick = () => {
            if(previewState.page > 1) { previewState.page--; renderFullPdfPreviewPage(); }
        };
        navDiv.querySelector('#next-btn').onclick = () => {
            if(previewState.page < previewState.total) { previewState.page++; renderFullPdfPreviewPage(); }
        };
    } else {
        // Update indicator
        document.getElementById('preview-page-indicator').innerText = `${previewState.page} / ${previewState.total}`;
    }

    // 2. Prepare Canvas
    DOM.previewBody.innerHTML = '';
    const canvas = document.createElement('canvas');
    DOM.previewBody.appendChild(canvas);

    try {
        const page = await previewState.doc.getPage(previewState.page);
        const dpr = window.devicePixelRatio || 1;
        
        // 3. AUTO-FIT LOGIC with DPR for sharpness
        const container = DOM.previewBody;
        const rect = container.getBoundingClientRect();
        const availW = rect.width - 40; 
        const availH = rect.height - 100;
        
        const viewportUnscaled = page.getViewport({ scale: 1 });
        const fitScale = Math.min(availW / viewportUnscaled.width, availH / viewportUnscaled.height);
        const scale = fitScale * dpr;
        
        const viewport = page.getViewport({ scale });
        const ctx = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width  = (viewport.width  / dpr) + 'px';
        canvas.style.height = (viewport.height / dpr) + 'px';
        
        await page.render({ canvasContext: ctx, viewport }).promise;
        page.cleanup();
    } catch(e) {
        console.error(e);
    }
}

function closeEditPreview() {
    DOM.editPreviewModal.classList.add('hidden');
    DOM.previewBody.innerHTML = '';
    // Clean up Nav
    const nav = document.querySelector('.preview-nav');
    if (nav) nav.remove();
    
    // Clean up doc if we created it locally (not implemented fully for generic reuse but safe to just nullify refs)
    if(previewState.doc && previewState.type === 'pdf-full') {
        if (previewState.doc.destroy) previewState.doc.destroy(); 
        previewState.doc = null;
    }
}

let exportResolve = null;
function openExportModal() {
    return new Promise((resolve) => {
        exportResolve = resolve;
        DOM.exportFilename.value = '';
        DOM.exportSize.value = 'default';
        DOM.exportRotation.value = '0'; 
        DOM.customSizeInputs.classList.add('hidden');
        DOM.customWidth.value = '';
        DOM.customHeight.value = '';
        
        if(DOM.exportSizeGroup) DOM.exportSizeGroup.classList.add('hidden');
        if(DOM.exportRotationGroup) DOM.exportRotationGroup.classList.add('hidden');

        if (state.currentTool === 'img2pdf' || state.currentTool === 'merge') {
            if(DOM.exportSizeGroup) DOM.exportSizeGroup.classList.remove('hidden');
        } 
        openModal(DOM.exportModal);
    });
}

DOM.exportSize.addEventListener('change', (e) => {
    if (e.target.value === 'custom') DOM.customSizeInputs.classList.remove('hidden');
    else DOM.customSizeInputs.classList.add('hidden');
});

function finishExportModal(confirmed) {
    if (confirmed) {
        state.exportSettings.size = DOM.exportSize.value;
        state.exportSettings.filename = DOM.exportFilename.value.trim();
        state.exportSettings.exportRotation = parseInt(DOM.exportRotation.value) || 0;
        if (state.exportSettings.size === 'custom') {
            const w = parseFloat(DOM.customWidth.value);
            const h = parseFloat(DOM.customHeight.value);
            const unit = DOM.customUnit.value;
            if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) {
                alert("Please enter valid positive dimensions.");
                return;
            }
            let factor = 1;
            if (unit === 'mm') factor = 2.83465;
            else if (unit === 'cm') factor = 28.3465;
            else if (unit === 'inch') factor = 72;
            state.exportSettings.customWidth = w * factor;
            state.exportSettings.customHeight = h * factor;
        }
    }
    closeModal(DOM.exportModal);
    if (exportResolve) exportResolve(confirmed);
    exportResolve = null;
}

DOM.btnExportClose.addEventListener('click', () => { if(!processingLock) finishExportModal(false); });
DOM.btnExportCancel.addEventListener('click', () => { if(!processingLock) finishExportModal(false); });
DOM.btnExportConfirm.addEventListener('click', () => { if(!processingLock) finishExportModal(true); });

// --- MODIFIED PROCESS LISTENER WITH SAFETY GATE ---
DOM.btnProcess.addEventListener('click', async () => {
    // 1. Check Lock
    if (processingLock) return;

    try {
        const tool = state.currentTool;
        
        // 2. Identify Active Files for Safety Check
        let activeFiles = [];
        if (tool === 'img2pdf') {
            activeFiles = state.imgFiles;
            if (activeFiles.length === 0) return alert("Please select images.");
        } else if (tool === 'merge') {
            activeFiles = state.mergeFiles;
            if (activeFiles.length === 0) return alert("Please select PDF files.");
        } else {
            // Tools working on single source file
            if (state.sourceFile) activeFiles = [state.sourceFile];
        }

        if (tool === 'pdf2img') {
            if (!state.pdfImgDoc) return alert("No PDF loaded.");
            if (state.pdfImgSelectedPages.size === 0) return alert("Select at least one page.");
        }

        // 3. EXECUTE SAFETY GATE
        // This runs before any UI blocking or export modal
        const isSafe = await safetyGate(tool, activeFiles);
        if (!isSafe) {
            // User cancelled or blocked
            return;
        }

        if (tool === 'split' && state.splitMode === 'custom') {
            if (state.splitRanges.length === 0) {
                 const blocks = document.querySelectorAll('.range-block');
                 state.splitRanges =[];
                 let valid = true;
                 blocks.forEach(block => {
                     const start = parseInt(block.querySelector('.range-start').value);
                     const end = parseInt(block.querySelector('.range-end').value);
                     if (isNaN(start) || isNaN(end) || start > end || start < 1 || end > state.splitDoc.numPages) valid = false;
                     else state.splitRanges.push({ start, end });
                 });
                 if (!valid || state.splitRanges.length === 0) return alert("Invalid split ranges.");
            }
        }

        let confirmed = await openExportModal();
        if (confirmed) {
            // 4. Lock and Start
            processingLock = true;
            DOM.globalActions.classList.add('disabled-ui');
            DOM.btnProcess.disabled = true;
            DOM.btnProcess.innerText = getT('processing');
            if(DOM.led) DOM.led.classList.add('animating');
            DOM.dropZone.classList.add('hidden');
            DOM.reorderContainer.classList.add('hidden');
            DOM.rotateUi.classList.add('hidden');
            DOM.splitUi.classList.add('hidden');
            DOM.pdf2ImgUi.classList.add('hidden');
            DOM.metadataUi.classList.add('hidden'); 
            DOM.resultContainer.classList.add('hidden'); 
            DOM.progressContainer.classList.remove('hidden');
            
            await processFiles();
        }
    } catch (e) {
        handleError(e);
        UrlManager.revokeAll();
    } finally {
        processingLock = false;
        // Ensure UI is re-enabled if error happened inside Modal workflow
        DOM.globalActions.classList.remove('disabled-ui');
    }
});

DOM.btnDownloadAction.addEventListener('click', () => {
    if (processingLock || !state.resultBlob) return;
    processingLock = true;
    DOM.btnDownloadAction.disabled = true;
    try {
        const url = URL.createObjectURL(state.resultBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = state.resultName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
        console.error(e);
    } finally {
        setTimeout(() => {
            processingLock = false;
            DOM.btnDownloadAction.disabled = false;
        }, 500);
    }
});

DOM.btnClearResult.addEventListener('click', () => {
    if (processingLock) return;
    resetToolUI();
});

DOM.btnMetaClear.addEventListener('click', () => {
    if (processingLock) return;
    DOM.metaTitle.value = ''; DOM.metaAuthor.value = ''; DOM.metaSubject.value = '';
    DOM.metaKeywords.value = ''; DOM.metaCreator.value = '';
});

DOM.logoHome.addEventListener('click', () => { if (!processingLock) goHome(); });
DOM.btnBack.addEventListener('click', () => { if (!processingLock) goHome(); });

// --- MODIFIED goHome TO SUPPORT ROUTING ---
function goHome(skipPushState = false) {
    DOM.toolView.classList.add('hidden');
    DOM.mainView.classList.remove('hidden');
    resetToolUI();
    if (!skipPushState) {
        history.pushState({}, "", "/");
    }
}

// --- STEP 4: openTool FUNCTION FOR ROUTING & CLICKS ---
function openTool(toolName, skipPushState = false) {
    if (processingLock) return;
    const card = document.querySelector(`.tool-card[data-tool="${toolName}"]`);
    if (!card) return;
    
    // FIX: Look for .pixel-icon OR .card-icon svg OR just svg to prevent crash
    const iconEl = card.querySelector('.pixel-icon') || card.querySelector('.card-icon svg') || card.querySelector('svg');
    if (iconEl) {
        DOM.toolTitleIcon.innerHTML = iconEl.outerHTML;
    }

    state.currentTool = toolName;
    DOM.toolTitleText.innerText = getT(toolName);
    DOM.fileInput.accept = toolConfig[toolName].accept;
    DOM.fileInput.multiple = toolConfig[toolName].multiple;
    DOM.mainView.classList.add('hidden');
    DOM.toolView.classList.remove('hidden');
    resetToolUI();
    updateUIText();

    // UPDATE URL
    if (!skipPushState) {
        const routeEntry = Object.entries(ROUTES).find(([path, key]) => key === toolName);
        if (routeEntry) {
            history.pushState({}, "", routeEntry[0]);
        }
    }
}

DOM.toolCards.forEach(card => {
    card.addEventListener('click', () => {
        const tool = card.getAttribute('data-tool');
        openTool(tool);
    });
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
    // Clear any file validation error banners
    const valErr = document.getElementById('file-val-error');
    if (valErr) valErr.remove();
    
    if(DOM.led) DOM.led.classList.remove('animating');
    UrlManager.revokeAll();

    state.resultBlob = null; state.resultName = ''; state.imgFiles = []; state.mergeFiles =[];
    state.rotateFile = null; state.rotateAngle = 90; state.splitFile = null; state.splitMode = 'all';
    state.splitRanges =[]; state.sourceFile = null;
    state.exportSettings = { size: 'default', filename: '', customWidth:0, customHeight:0, exportRotation: 0 };
    
    state.pdfImgNames.clear(); state.splitNames.clear(); state.splitAllPageNames.clear();

    if (state.splitDoc) { state.splitDoc.destroy(); state.splitDoc = null; }
    if (state.pdfImgDoc) { state.pdfImgDoc.destroy(); state.pdfImgDoc = null; }
    if (state.pdfImgObserver) { state.pdfImgObserver.disconnect(); state.pdfImgObserver = null; }
    state.pdfImgSelectedPages.clear();
    
    DOM.pdfGrid.innerHTML = '';
    if (DOM.splitAllList) DOM.splitAllList.innerHTML = '';
    if (DOM.splitAllNames) DOM.splitAllNames.classList.add('hidden');
    DOM.btnProcess.innerText = getT('process');
    DOM.btnProcess.disabled = false;
    DOM.btnProcess.classList.remove('hidden');
    DOM.btnDownloadAction.classList.add('hidden');
    DOM.btnClearResult.classList.add('hidden');
    DOM.globalActions.classList.remove('disabled-ui');
    
    DOM.rotateBtns.forEach(b => b.classList.remove('selected'));
    const rightBtn = document.querySelector('.rotate-btn[data-angle="90"]');
    if(rightBtn) rightBtn.classList.add('selected');
    setProgress(0);
}

DOM.dropZone.addEventListener('click', () => { if (!processingLock) DOM.fileInput.click(); });
DOM.dropZone.addEventListener('dragover', (e) => { e.preventDefault(); if (!processingLock) DOM.dropZone.classList.add('dragover'); });
DOM.dropZone.addEventListener('dragleave', () => DOM.dropZone.classList.remove('dragover'));
DOM.dropZone.addEventListener('drop', (e) => {
    e.preventDefault(); DOM.dropZone.classList.remove('dragover');
    if (processingLock) return;
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
});
DOM.fileInput.addEventListener('change', (e) => {
    if (processingLock) return;
    if (e.target.files.length) handleFiles(e.target.files);
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
    radio.addEventListener('change', (e) => {
        if (processingLock) return;
        state.splitMode = e.target.value;
        if (state.splitMode === 'custom') {
            DOM.splitCustomOptions.classList.remove('hidden');
            renderSplitRanges(DOM.splitRangeCount.value);
            if (DOM.splitAllNames) DOM.splitAllNames.classList.add('hidden');
        } else {
            // mode === 'all'
            DOM.splitCustomOptions.classList.add('hidden');
            if (state.splitDoc) renderSplitAllNames();
        }
    });
});

DOM.splitRangeCount.addEventListener('input', (e) => {
    if (processingLock) return;
    const val = parseInt(e.target.value) || 1;
    if(val > 0 && val <= 50) renderSplitRanges(val);
});



// initSplitUI, renderSplitAllNames, renderSplitRanges, updateRangePreview → tool-split.js
// initPdfToImgUI, loadPdfThumbnail → tool-pdf2img.js
// initPdfInfoUI → tool-pdfinfo.js
// initMetadataUI → tool-metadata.js

DOM.btnSelectAll.addEventListener('click', () => {
    if (processingLock || !state.pdfImgDoc) return;
    const cards = document.querySelectorAll('.page-card');
    cards.forEach(c => c.classList.add('selected'));
    for (let i = 1; i <= state.pdfImgDoc.numPages; i++) state.pdfImgSelectedPages.add(i);
});

DOM.btnSelectNone.addEventListener('click', () => {
    if (processingLock || !state.pdfImgDoc) return;
    const cards = document.querySelectorAll('.page-card');
    cards.forEach(c => c.classList.remove('selected'));
    state.pdfImgSelectedPages.clear();
});

DOM.pdfImgSearch.addEventListener('input', debounce((e) => {
    if (processingLock) return;
    const val = parseInt(e.target.value);
    if (!state.pdfImgDoc || isNaN(val) || val < 1 || val > state.pdfImgDoc.numPages) return;
    const el = document.getElementById(`pdf-page-${val}`);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        document.querySelectorAll('.search-highlight').forEach(n => n.classList.remove('search-highlight'));
        el.classList.add('search-highlight');
        setTimeout(() => el.classList.remove('search-highlight'), 1500);
    }
}, 150));

function handleFiles(files) {
    if (processingLock) return;

    // --- SECTION 6: EARLY FILE VALIDATION ---
    // Check immediately after selection, before any parsing or preview.
    const HARD_LIMIT_MB = SAFETY_ENGINE.isMobile() ? 400 : 1000;
    const oversized = Array.from(files).filter(f => f.size / (1024 * 1024) > HARD_LIMIT_MB);
    if (oversized.length > 0) {
        // Remove any previous validation error
        const prev = document.getElementById('file-val-error');
        if (prev) prev.remove();

        const errEl = document.createElement('div');
        errEl.id = 'file-val-error';
        errEl.className = 'file-validation-error';
        errEl.innerHTML = `
            <span class="val-icon">⛔</span>
            <div class="val-msg">
                <strong>FILE TOO LARGE</strong>
                ${oversized.map(f => `${f.name} (${(f.size/1048576).toFixed(1)} MB)`).join(', ')}
                exceeds the ${HARD_LIMIT_MB} MB safe processing limit for this device.
                Please use a smaller file to prevent browser crashes.
            </div>
        `;
        // Insert above the drop zone
        DOM.dropZone.insertAdjacentElement('afterend', errEl);
        DOM.fileInput.value = '';
        // Auto-remove after 6 seconds
        setTimeout(() => { if (errEl.parentNode) errEl.remove(); }, 6000);
        return; // Abort — no preview, no parsing
    }
    // Remove any lingering validation error on valid selection
    const prev = document.getElementById('file-val-error');
    if (prev) prev.remove();
    // --- END EARLY VALIDATION ---
    
    const acceptHeader = toolConfig[state.currentTool].accept;
    const fileArr = Array.from(files).filter(file => {
        if (acceptHeader.includes('image/')) {
            return file.type.startsWith('image/') || file.name.match(/\.(png|jpe?g)$/i);
        }
        if (acceptHeader.includes('application/pdf')) {
            return file.type === 'application/pdf' || file.name.match(/\.pdf$/i);
        }
        return false;
    });

    if (fileArr.length === 0) {
        alert("Invalid file format selected for this tool.");
        return;
    }

    if (!toolConfig[state.currentTool].multiple && fileArr.length > 1) {
        fileArr.length = 1; 
    }
    
    state.resultBlob = null;
    state.resultName = '';
    DOM.resultContainer.classList.add('hidden');
    DOM.globalActions.classList.remove('hidden');

    if (state.currentTool === 'img2pdf') {
        state.imgFiles = state.imgFiles.concat(fileArr);
        renderReorderUI();
        return; 
    }
    if (state.currentTool === 'merge') {
        state.mergeFiles = state.mergeFiles.concat(fileArr);
        renderReorderUI();
        return; 
    }
    
    DOM.dropZone.classList.add('hidden');
    state.sourceFile = fileArr[0];

    if (state.currentTool === 'pdfinfo') { initPdfInfoUI(fileArr[0]); return; }
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
    
    DOM.resultContainer.innerHTML = `
        <div class="success-box error-box">
            <div class="success-icon error-icon">!</div>
            <div class="success-text">
                <h4>${getT('error')}</h4>
                <p id="error-msg-el"></p>
            </div>
        </div>
    `;
    document.getElementById('error-msg-el').textContent = e.message || getT('errorGeneric');

    if(DOM.led) DOM.led.classList.remove('animating');

    DOM.btnProcess.disabled = false;
    DOM.btnProcess.innerText = getT('process');
    DOM.globalActions.classList.remove('disabled-ui');
    DOM.btnProcess.classList.remove('hidden');
}

let dragStartIndex = -1;
function renderReorderUI() {
    UrlManager.revokeAll();
    const container = DOM.reorderContainer;
    container.innerHTML = '';
    const isImg = state.currentTool === 'img2pdf';
    const activeFiles = isImg ? state.imgFiles : state.mergeFiles;
    if (activeFiles.length === 0) {
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
        item.className = 'reorder-item';
        item.draggable = true;
        item.addEventListener('dragstart', (e) => {
            if (processingLock) { e.preventDefault(); return; }
            dragStartIndex = index;
            item.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });
        item.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
        item.addEventListener('dragenter', (e) => { e.preventDefault(); item.classList.add('drag-over'); });
        item.addEventListener('dragleave', () => { item.classList.remove('drag-over'); });
        item.addEventListener('drop', (e) => {
            e.preventDefault();
            item.classList.remove('drag-over');
            if (dragStartIndex > -1 && dragStartIndex !== index && !processingLock) {
                const movedFile = activeFiles.splice(dragStartIndex, 1)[0];
                activeFiles.splice(index, 0, movedFile);
                renderReorderUI();
            }
        });
        item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
            dragStartIndex = -1;
        });

        const dragHandle = document.createElement('div');
        dragHandle.className = 'drag-handle';
        dragHandle.innerText = '::';
        
        const idxStr = String(index + 1).padStart(2, '0');
        const idx = document.createElement('span');
        idx.className = 'item-idx';
        idx.innerText = `[${idxStr}]`;
        const thumbContainer = document.createElement('div');
        thumbContainer.className = 'item-thumb-container';

        if (isImg) {
            const thumb = document.createElement('img');
            thumb.className = 'item-thumb';
            thumb.src = UrlManager.create(file);
            thumb.onclick = () => { if (!processingLock) openEditPreview(file, 'image'); }
            thumbContainer.appendChild(thumb);
        } else {
            const docIcon = document.createElement('div');
            docIcon.className = 'item-thumb doc-icon';
            docIcon.innerText = 'PDF';
            docIcon.onclick = () => { if (!processingLock) openEditPreview(file, 'pdf-full'); }
            thumbContainer.appendChild(docIcon);
        }

        const name = document.createElement('span');
        name.className = 'item-name';
        name.innerText = file.name;
        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn-remove';
        removeBtn.innerText = 'X';
        removeBtn.onclick = () => {
            if (processingLock) return;
            activeFiles.splice(index, 1);
            renderReorderUI();
        };

        item.appendChild(dragHandle);
        item.appendChild(idx);
        item.appendChild(thumbContainer);
        item.appendChild(name);
        item.appendChild(removeBtn);
        list.appendChild(item);
    });
    container.appendChild(list);
}

// Shared utility used by tool files
function getTargetSize() {
    const s = state.exportSettings.size;
    if (s === 'custom') return [state.exportSettings.customWidth, state.exportSettings.customHeight];
    return PAGE_SIZES[s];
}

function setProgress(percent, msg = "PROCESSING...") {
    const safePercent = Math.min(100, Math.max(0, Math.round(percent)));
    const totalChars = 14;
    const filled = Math.round((safePercent / 100) * totalChars);
    const empty = totalChars - filled;
    const bar = `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${safePercent}%`;
    DOM.asciiProgress.innerText = bar;
    if (msg) DOM.statusText.innerText = msg;
}

async function processFiles() {
    const tool = state.currentTool;
    let files =[];
    
    if(tool === 'pdf2img' || tool === 'split' || tool === 'rotate' || tool === 'metadata') {
        files =[state.sourceFile];
    } else {
        files = tool === 'img2pdf' ? state.imgFiles : state.mergeFiles;
    }

    if (!files[0]) throw new Error("No file loaded.");
    
    if (tool === 'pdf2img') await execPdfToImg(files[0]);
    else if (tool === 'img2pdf') await execImgToPdf(files);
    else if (tool === 'merge') await execMerge(files);
    else if (tool === 'split') await execSplit(files[0]);
    else if (tool === 'rotate') await execRotate(files[0]);
    else if (tool === 'metadata') await execMetadata(files[0]);
    
    DOM.progressContainer.classList.add('hidden');
    DOM.resultContainer.classList.remove('hidden');
    
    UrlManager.revokeAll();

    DOM.resultContainer.innerHTML = `
        <div class="success-box">
            <div class="success-icon">✓</div>
            <div class="success-text">
                <h4>${getT('success')}</h4>
                <p>${getT('ready')}</p>
                <small id="success-filename-el"></small>
            </div>
        </div>
    `;
    document.getElementById('success-filename-el').textContent = state.resultName;

    if(DOM.led) DOM.led.classList.remove('animating');

    DOM.btnProcess.classList.add('hidden');
    DOM.btnDownloadAction.classList.remove('hidden');
    DOM.btnClearResult.classList.remove('hidden');
    
    DOM.btnDownloadAction.disabled = false;
    DOM.globalActions.classList.remove('disabled-ui');
}

// ============================================================
// CORE PROCESSING DISPATCHER
// Tool logic lives in: tool-pdfinfo.js, tool-metadata.js,
// tool-pdf2img.js, tool-img2pdf.js, tool-merge.js,
// tool-split.js, tool-rotate.js
// ============================================================

init();