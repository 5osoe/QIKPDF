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
    const intro = document.getElementById("intro-screen");
    if (intro) {
        intro.remove();
    }
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
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
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
        splitLabels[0].childNodes[2].nodeValue = " " + getT('splitModeAll');
        splitLabels[1].childNodes[2].nodeValue = " " + getT('splitModeCustom');
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
            // Render specific page once (Thumbnail view zoom)
            const page = await data.getPage(pageNum);
            // Just fit to container logic
            const container = DOM.previewBody;
            const rect = container.getBoundingClientRect();
            // We use padding 40px safe area
            const availW = rect.width - 40;
            const availH = rect.height - 40;
            
            const viewportUnscaled = page.getViewport({ scale: 1 });
            const scale = Math.min(availW / viewportUnscaled.width, availH / viewportUnscaled.height);
            const viewport = page.getViewport({ scale: scale });

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
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
        
        // 3. AUTO-FIT LOGIC
        const container = DOM.previewBody;
        const rect = container.getBoundingClientRect();
        
        // Subtract Safe Area (Padding + Bottom Nav Space)
        const availW = rect.width - 40; 
        const availH = rect.height - 100; // Extra space for nav bar
        
        const viewportUnscaled = page.getViewport({ scale: 1 });
        
        // Calculate "Contain" Scale
        const scaleX = availW / viewportUnscaled.width;
        const scaleY = availH / viewportUnscaled.height;
        const scale = Math.min(scaleX, scaleY);
        
        const viewport = page.getViewport({ scale: scale });
        const ctx = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
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
        // If it was a temp load, we might want to destroy it. 
        // For now, we assume if it came from state object we leave it, 
        // if we created it from file we should ideally destroy it but PDF.js handles caching well.
        // To be safe and adhere to "Clean up" rule:
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
    
    const iconHTML = card.querySelector('.pixel-icon').outerHTML;
    state.currentTool = toolName;
    DOM.toolTitleIcon.innerHTML = iconHTML;
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
    
    if(DOM.led) DOM.led.classList.remove('animating');
    UrlManager.revokeAll();

    state.resultBlob = null; state.resultName = ''; state.imgFiles = []; state.mergeFiles =[];
    state.rotateFile = null; state.rotateAngle = 90; state.splitFile = null; state.splitMode = 'all';
    state.splitRanges =[]; state.sourceFile = null;
    state.exportSettings = { size: 'default', filename: '', customWidth:0, customHeight:0, exportRotation: 0 };
    
    state.pdfImgNames.clear(); state.splitNames.clear();

    if (state.splitDoc) { state.splitDoc.destroy(); state.splitDoc = null; }
    if (state.pdfImgDoc) { state.pdfImgDoc.destroy(); state.pdfImgDoc = null; }
    if (state.pdfImgObserver) { state.pdfImgObserver.disconnect(); state.pdfImgObserver = null; }
    state.pdfImgSelectedPages.clear();
    
    DOM.pdfGrid.innerHTML = '';
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
        } else {
            DOM.splitCustomOptions.classList.add('hidden');
        }
    });
});

DOM.splitRangeCount.addEventListener('input', (e) => {
    if (processingLock) return;
    const val = parseInt(e.target.value) || 1;
    if(val > 0 && val <= 50) renderSplitRanges(val);
});

function renderSplitRanges(count) {
    DOM.splitRangesContainer.innerHTML = '';
    const baseName = state.sourceFile ? getBaseName(state.sourceFile.name) : 'split';

    for (let i = 0; i < count; i++) {
        const block = document.createElement('div');
        block.className = 'range-block';
        const defaultName = `${baseName}_part_${i+1}`;
        const storedName = state.splitNames.get(i) || defaultName;
        if (!state.splitNames.has(i)) state.splitNames.set(i, storedName);

        block.innerHTML = `
            <div class="range-header">${getT('file')} #${i+1}</div>
            <div class="range-inputs">
                <input type="number" class="input-num range-start" placeholder="${getT('from')}" data-idx="${i}">
                <span>${getT('to')}</span>
                <input type="number" class="input-num range-end" placeholder="${getT('to')}" data-idx="${i}">
            </div>
            <input type="text" class="range-name-input input-text" placeholder="${getT('filename')}" data-idx="${i}">
            <div class="range-previews">
                <canvas class="preview-canvas start-canvas clickable-canvas" data-idx="${i}"></canvas>
                <canvas class="preview-canvas end-canvas clickable-canvas" data-idx="${i}"></canvas>
            </div>
        `;
        DOM.splitRangesContainer.appendChild(block);
        
        const startInput = block.querySelector('.range-start');
        const endInput = block.querySelector('.range-end');
        const nameInput = block.querySelector('.range-name-input');
        const startCanvas = block.querySelector('.start-canvas');
        const endCanvas = block.querySelector('.end-canvas');
        
        nameInput.value = storedName; 

        startInput.addEventListener('change', (e) => updateRangePreview(i, 'start', e.target.value));
        endInput.addEventListener('change', (e) => updateRangePreview(i, 'end', e.target.value));
        nameInput.addEventListener('input', debounce((e) => state.splitNames.set(i, e.target.value.trim()), 150));
        
        startCanvas.addEventListener('click', () => {
            const val = parseInt(startInput.value);
            if (val && !processingLock) openEditPreview(state.splitDoc, 'pdf-single', val);
        });
        endCanvas.addEventListener('click', () => {
            const val = parseInt(endInput.value);
            if (val && !processingLock) openEditPreview(state.splitDoc, 'pdf-single', val);
        });
    }
}

async function updateRangePreview(idx, type, pageVal) {
    if (!state.splitDoc) return;
    const pageNum = parseInt(pageVal);
    if (isNaN(pageNum) || pageNum < 1 || pageNum > state.splitDoc.numPages) return;
    try {
        const page = await state.splitDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 0.2 });
        const blocks = document.querySelectorAll('.range-block');
        const canvas = blocks[idx].querySelector(type === 'start' ? '.start-canvas' : '.end-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: ctx, viewport }).promise;
        page.cleanup();
    } catch (e) {}
}

async function initSplitUI(file) {
    DOM.splitFilename.innerText = file.name;
    DOM.splitPageCount.innerText = "LOADING...";
    try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        state.splitDoc = await loadingTask.promise;
        DOM.splitPageCount.innerText = state.splitDoc.numPages + " " + getT('pages');
        DOM.splitRangeCount.value = 1;
        state.splitMode = 'all';
        DOM.splitModeRadios[0].checked = true;
        DOM.splitCustomOptions.classList.add('hidden');
    } catch (e) {
        DOM.splitPageCount.innerText = "ERROR";
    }
}

async function initPdfToImgUI(file) {
    DOM.pdfGrid.innerHTML = '';
    DOM.pdf2ImgUi.classList.remove('hidden');
    DOM.statusText.innerText = getT('processing');
    try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        state.pdfImgDoc = await loadingTask.promise;
        const total = state.pdfImgDoc.numPages;
        const baseName = getBaseName(file.name);
        const fragment = document.createDocumentFragment();
        
        for (let i = 1; i <= total; i++) {
            const card = document.createElement('div');
            card.className = 'page-card selected';
            card.dataset.page = i;
            card.id = `pdf-page-${i}`;
            const defaultName = `${baseName}_page_${i.toString().padStart(3, '0')}`;
            if (!state.pdfImgNames.has(i)) state.pdfImgNames.set(i, defaultName);
            const storedName = state.pdfImgNames.get(i);
            
            card.innerHTML = `
                <div class="page-check">
                    <svg class="check-icon" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                </div>
                <div class="page-preview-box">
                    <span class="page-loading">...</span>
                </div>
                <div class="page-info">${i}</div>
                <input type="text" class="card-name-input" data-page="${i}">
            `;
            const input = card.querySelector('.card-name-input');
            input.value = storedName; 
            
            input.addEventListener('click', (e) => e.stopPropagation()); 
            input.addEventListener('input', debounce((e) => state.pdfImgNames.set(i, e.target.value.trim()), 150));
            card.addEventListener('click', (e) => {
                if (processingLock) return;
                if(e.target.closest('.page-preview-box')) {
                   openEditPreview(state.pdfImgDoc, 'pdf-single', i);
                   return;
                }
                if(e.target === input) return;
                if (state.pdfImgSelectedPages.has(i)) {
                    state.pdfImgSelectedPages.delete(i);
                    card.classList.remove('selected');
                } else {
                    state.pdfImgSelectedPages.add(i);
                    card.classList.add('selected');
                }
            });
            state.pdfImgSelectedPages.add(i);
            fragment.appendChild(card);
        }
        DOM.pdfGrid.appendChild(fragment);
        if (state.pdfImgObserver) state.pdfImgObserver.disconnect();
        state.pdfImgObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const card = entry.target;
                    const pageNum = parseInt(card.dataset.page);
                    loadPdfThumbnail(card, pageNum);
                    observer.unobserve(card);
                }
            });
        }, { root: DOM.pdfGrid, threshold: 0.1 });
        const cards = document.querySelectorAll('.page-card');
        cards.forEach(card => state.pdfImgObserver.observe(card));
    } catch (e) { alert("Failed to load PDF."); }
}

async function loadPdfThumbnail(card, pageNum) {
    if (!state.pdfImgDoc) return;
    try {
        const page = await state.pdfImgDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 0.3 }); 
        const canvas = document.createElement('canvas');
        canvas.className = 'page-canvas';
        const ctx = canvas.getContext('2d', { alpha: false });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: ctx, viewport }).promise;
        const previewBox = card.querySelector('.page-preview-box');
        previewBox.innerHTML = '';
        previewBox.appendChild(canvas);
        page.cleanup();
    } catch (e) {}
}

async function initPdfInfoUI(file) {
    DOM.pdfInfoUi.classList.remove('hidden');
    DOM.globalActions.classList.add('hidden'); 
    DOM.pdfInfoContent.innerHTML = '<div class="loading-spinner">...</div>';

    try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({data: arrayBuffer});
        const doc = await loadingTask.promise;
        const metadata = await doc.getMetadata();
        const info = metadata.info || {};
        const page = await doc.getPage(1);
        const viewport = page.getViewport({scale: 1});
        const widthPt = viewport.width;
        const heightPt = viewport.height;

        let html = `
            <div class="info-panel">
                <div class="info-header-block">
                    <div class="info-filename" id="info-filename-el"></div>
                    <div class="info-filesize" id="info-filesize-el"></div>
                </div>
                
                <h4 style="margin-bottom:12px; color:var(--accent); font-size:14px; letter-spacing:1px;">${getT('properties')}</h4>
                <div class="info-grid">
                    <div class="info-item"><label>${getT('pagesLabel')}</label><span id="info-pages-el"></span></div>
                    <div class="info-item"><label>${getT('dimensionsLabel')}</label><span id="info-dim-el"></span></div>
                </div>
                
                <h4 style="margin-bottom:12px; color:var(--accent); font-size:14px; letter-spacing:1px;">${getT('metaHeader')}</h4>
                <div class="info-grid" id="meta-grid-el"></div>

                <div class="info-actions">
                    <button id="btn-view-pdf-info" class="btn-primary" style="width:100%">${getT('viewPdf')}</button>
                </div>
            </div>
        `;
        DOM.pdfInfoContent.innerHTML = html;
        
        document.getElementById('info-filename-el').textContent = file.name;
        document.getElementById('info-filesize-el').textContent = formatFileSize(file.size);
        document.getElementById('info-pages-el').textContent = doc.numPages;
        document.getElementById('info-dim-el').textContent = formatPageSize(widthPt, heightPt);

        const metaGrid = document.getElementById('meta-grid-el');
        const appendMeta = (label, val) => {
            const div = document.createElement('div');
            div.className = 'info-item';
            const lbl = document.createElement('label');
            lbl.textContent = getT(label);
            const spn = document.createElement('span');
            spn.textContent = val || '-';
            div.appendChild(lbl);
            div.appendChild(spn);
            metaGrid.appendChild(div);
        };
        appendMeta('metaTitle', info.Title);
        appendMeta('metaAuthor', info.Author);
        appendMeta('metaSubject', info.Subject);
        appendMeta('metaKeywords', info.Keywords);
        appendMeta('metaCreator', info.Creator);

        document.getElementById('btn-view-pdf-info').addEventListener('click', () => {
             if(!processingLock) openEditPreview(file, 'pdf-full');
        });

        page.cleanup();
        doc.destroy();
    } catch(e) {
        DOM.pdfInfoContent.innerHTML = '';
        const errDiv = document.createElement('div');
        errDiv.className = 'error-text';
        errDiv.textContent = getT('errorGeneric');
        DOM.pdfInfoContent.appendChild(errDiv);
    }
}

async function initMetadataUI(file) {
    DOM.metadataUi.classList.remove('hidden');
    DOM.btnProcess.innerText = getT('applyChanges');
    DOM.metaTitle.value = "...";
    DOM.metaAuthor.value = "...";
    
    try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({data: arrayBuffer});
        const doc = await loadingTask.promise;
        const metadata = await doc.getMetadata();
        const info = metadata.info || {};

        DOM.metaTitle.value = info.Title || '';
        DOM.metaAuthor.value = info.Author || '';
        DOM.metaSubject.value = info.Subject || '';
        DOM.metaKeywords.value = info.Keywords || '';
        DOM.metaCreator.value = info.Creator || '';
        
        doc.destroy();
    } catch(e) { alert(getT('errorGeneric')); }
}

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

// --- CORE PROCESSING LOGIC ---
async function execMetadata(file) {
    const { PDFDocument } = PDFLib;
    setProgress(0, "LOADING PDF...");
    await yieldToMain();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    
    setProgress(50, "UPDATING METADATA...");
    pdf.setTitle(DOM.metaTitle.value);
    pdf.setAuthor(DOM.metaAuthor.value);
    pdf.setSubject(DOM.metaSubject.value);
    pdf.setKeywords(DOM.metaKeywords.value.split(','));
    pdf.setCreator(DOM.metaCreator.value);
    
    setProgress(100, "SAVING...");
    await yieldToMain();
    const pdfBytes = await pdf.save();
    state.resultBlob = new Blob([pdfBytes], { type: 'application/pdf' });
    state.resultName = state.exportSettings.filename ? `${state.exportSettings.filename}.pdf` : file.name.replace(/\.pdf$/i, '_metadata.pdf');
}

async function execPdfToImg(file) {
    if (typeof pdfjsLib === 'undefined') throw new Error("PDF Lib not loaded.");
    let pdf = state.pdfImgDoc;
    if (!pdf) {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({data: arrayBuffer});
        pdf = await loadingTask.promise;
    }
    const zip = new JSZip();
    const scale = Math.max(3, window.devicePixelRatio || 1);
    const pagesToProcess = Array.from(state.pdfImgSelectedPages).sort((a,b) => a - b);
    const total = pagesToProcess.length;

    for (let i = 0; i < total; i++) {
        await yieldToMain();
        const pageNum = pagesToProcess[i];
        setProgress((i / total) * 100, `EXTRACTING PAGE ${pageNum} (${i+1}/${total})...`);
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({scale});
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { alpha: false }); 
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: ctx, viewport, intent: 'print' }).promise;
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        let fileName = state.pdfImgNames.get(pageNum);
        if(!fileName) fileName = `page_${String(pageNum).padStart(3, '0')}`;
        if (!fileName.toLowerCase().endsWith('.png')) fileName += '.png';
        zip.file(fileName, blob);
        page.cleanup();
        canvas.width = 0; canvas.height = 0;
    }
    setProgress(100, "COMPRESSING ZIP...");
    await yieldToMain();
    state.resultBlob = await zip.generateAsync({type: 'blob'});
    state.resultName = state.exportSettings.filename ? `${state.exportSettings.filename}.zip` : file.name.replace(/\.pdf$/i, '_images.zip');
}

function getTargetSize() {
    const s = state.exportSettings.size;
    if (s === 'custom') return[state.exportSettings.customWidth, state.exportSettings.customHeight];
    return PAGE_SIZES[s];
}

async function execImgToPdf(files) {
    const { PDFDocument, degrees } = PDFLib;
    const pdfDoc = await PDFDocument.create();
    const total = files.length;
    const sizeSetting = state.exportSettings.size;
    const exportRotation = state.exportSettings.exportRotation || 0; 
    
    for (let i = 0; i < total; i++) {
        await yieldToMain();
        setProgress((i / total) * 100, `ADDING IMAGE ${i+1}/${total}...`);
        const file = files[i];
        const arrayBuffer = await file.arrayBuffer();
        let image;
        try {
            if (file.type === 'image/jpeg' || file.name.match(/\.(jpg|jpeg)$/i)) image = await pdfDoc.embedJpg(arrayBuffer);
            else if (file.type === 'image/png' || file.name.match(/\.png$/i)) image = await pdfDoc.embedPng(arrayBuffer);
            else continue; 
            
            let dims = { width: image.width, height: image.height };
            let page;
            if (sizeSetting !== 'default') {
                const target = getTargetSize();
                page = pdfDoc.addPage(target);
                const scale = Math.min(target[0] / dims.width, target[1] / dims.height);
                const w = dims.width * scale;
                const h = dims.height * scale;
                page.drawImage(image, { x: (target[0]-w)/2, y: (target[1]-h)/2, width: w, height: h });
            } else {
                page = pdfDoc.addPage([dims.width, dims.height]);
                page.drawImage(image, { x: 0, y: 0, width: dims.width, height: dims.height });
            }
            if (exportRotation !== 0) page.setRotation(degrees(exportRotation));
        } catch (e) { console.warn(`Skipping invalid image: ${file.name}`, e); }
    }
    setProgress(100, "SAVING PDF...");
    await yieldToMain();
    const pdfBytes = await pdfDoc.save();
    state.resultBlob = new Blob([pdfBytes], { type: 'application/pdf' });
    state.resultName = state.exportSettings.filename ? `${state.exportSettings.filename}.pdf` : 'images_merged.pdf';
}

async function execMerge(files) {
    const { PDFDocument, degrees } = PDFLib;
    const mergedPdf = await PDFDocument.create();
    const total = files.length;
    const sizeSetting = state.exportSettings.size;
    const exportRotation = state.exportSettings.exportRotation || 0; 
    
    for (let i = 0; i < total; i++) {
        await yieldToMain();
        setProgress((i / total) * 100, `MERGING FILE ${i+1}/${total}...`);
        let arrayBuffer = null;
        let pdf = null;
        
        try {
            arrayBuffer = await files[i].arrayBuffer();
            pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
            
            if (sizeSetting === 'default') {
                const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                copiedPages.forEach(page => {
                    const newPage = mergedPdf.addPage(page);
                    if (exportRotation !== 0) {
                        const currentRot = newPage.getRotation().angle;
                        newPage.setRotation(degrees(currentRot + exportRotation));
                    }
                });
            } else {
                const embeddedPages = await mergedPdf.embedPages(pdf.getPages());
                const target = getTargetSize();
                embeddedPages.forEach(embPage => {
                    const page = mergedPdf.addPage(target);
                    const { width, height } = embPage.scale(1);
                    const scale = Math.min(target[0] / width, target[1] / height);
                    page.drawPage(embPage, { x: (target[0]-width*scale)/2, y: (target[1]-height*scale)/2, xScale: scale, yScale: scale });
                    if (exportRotation !== 0) page.setRotation(degrees(exportRotation));
                });
            }
        } finally {
            arrayBuffer = null;
            pdf = null;
        }
    }
    setProgress(100, "SAVING MERGED PDF...");
    await yieldToMain();
    const pdfBytes = await mergedPdf.save();
    state.resultBlob = new Blob([pdfBytes], { type: 'application/pdf' });
    state.resultName = state.exportSettings.filename ? `${state.exportSettings.filename}.pdf` : 'merged_document.pdf';
}

async function execSplit(file) {
    const { PDFDocument } = PDFLib;
    const arrayBuffer = await file.arrayBuffer();
    setProgress(0, "LOADING PDF...");
    await yieldToMain();
    const pdf = await PDFDocument.load(arrayBuffer);
    const zip = new JSZip();
    const sizeSetting = state.exportSettings.size;

    const processPages = async (doc, indices) => {
        const newPdf = await PDFDocument.create();
        if (sizeSetting === 'default') {
            const copied = await newPdf.copyPages(doc, indices);
            copied.forEach(p => newPdf.addPage(p));
        } else {
            const pagesToEmbed = indices.map(i => doc.getPage(i));
            const embedded = await newPdf.embedPages(pagesToEmbed);
            const target = getTargetSize();
            embedded.forEach(embPage => {
                const page = newPdf.addPage(target);
                const { width, height } = embPage.scale(1);
                const scale = Math.min(target[0] / width, target[1] / height);
                page.drawPage(embPage, { x: (target[0]-width*scale)/2, y: (target[1]-height*scale)/2, xScale: scale, yScale: scale });
            });
        }
        return await newPdf.save();
    };
    
    if (state.splitMode === 'all') {
        const numPages = pdf.getPageCount();
        for (let i = 0; i < numPages; i++) {
            await yieldToMain();
            setProgress((i / numPages) * 100, `SPLITTING PAGE ${i+1}/${numPages}...`);
            const pdfBytes = await processPages(pdf, [i]);
            zip.file(`page_${String(i + 1).padStart(3, '0')}.pdf`, pdfBytes);
        }
        state.resultName = state.exportSettings.filename ? `${state.exportSettings.filename}.zip` : file.name.replace(/\.pdf$/i, '_split.zip');
    } else if (state.splitMode === 'custom') {
        const ranges = state.splitRanges;
        const total = ranges.length;
        for (let i = 0; i < total; i++) {
            await yieldToMain();
            setProgress((i / total) * 100, `PROCESSING RANGE ${i+1}/${total}...`);
            const range = ranges[i];
            const indices =[];
            for (let j = range.start - 1; j <= range.end - 1; j++) indices.push(j);
            const pdfBytes = await processPages(pdf, indices);
            let fileName = state.splitNames.get(i);
            if(!fileName) fileName = `range_${String(i + 1).padStart(2, '0')}_p${range.start}-${range.end}`;
            if (!fileName.toLowerCase().endsWith('.pdf')) fileName += '.pdf';
            zip.file(fileName, pdfBytes);
        }
        state.resultName = state.exportSettings.filename ? `${state.exportSettings.filename}.zip` : file.name.replace(/\.pdf$/i, '_ranges.zip');
    }
    setProgress(100, "ZIPPING FILES...");
    await yieldToMain();
    state.resultBlob = await zip.generateAsync({type: 'blob'});
}

async function execRotate(file) {
    const { PDFDocument, degrees } = PDFLib;
    setProgress(0, "LOADING PDF...");
    await yieldToMain();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const pages = pdf.getPages();
    const total = pages.length;
    const angleToAdd = state.rotateAngle || 90;
    const sizeSetting = state.exportSettings.size;
    const rotationState = new Map();
    for (let i = 0; i < total; i++) {
        const page = pages[i];
        const currentRotation = page.getRotation().angle;
        let newRotation = (currentRotation + angleToAdd) % 360;
        if (newRotation < 0) newRotation += 360;
        rotationState.set(i, newRotation);
    }

    let finalBytes;
    if (sizeSetting === 'default') {
        for (let i = 0; i < total; i++) {
            if (i % 10 === 0) {
                await yieldToMain();
                setProgress((i / total) * 100, `ROTATING PAGE ${i+1}/${total}...`);
            }
            pages[i].setRotation(degrees(rotationState.get(i)));
        }
        finalBytes = await pdf.save();
    } else {
        const newPdf = await PDFDocument.create();
        const embedded = await newPdf.embedPages(pages);
        const target = getTargetSize(); 
        for (let i = 0; i < total; i++) {
            if (i % 5 === 0) {
                await yieldToMain();
                setProgress((i / total) * 100, `RESIZING PAGE ${i+1}/${total}...`);
            }
            const embPage = embedded[i];
            const rot = rotationState.get(i);
            const isSideways = rot % 180 !== 0;
            const contentWidth = isSideways ? embPage.height : embPage.width;
            const contentHeight = isSideways ? embPage.width : embPage.height;
            
            const [pgW, pgH] = target;
            const scale = Math.min(pgW / contentWidth, pgH / contentHeight);
            const page = newPdf.addPage([pgW, pgH]);
            const drawWidth = embPage.width * scale;
            const drawHeight = embPage.height * scale;
            
            const centerX = pgW / 2;
            const centerY = pgH / 2;
            
            let x, y;
            if (rot === 0) { x = centerX - drawWidth / 2; y = centerY - drawHeight / 2; } 
            else if (rot === 90) { x = centerX + drawHeight / 2; y = centerY - drawWidth / 2; } 
            else if (rot === 180) { x = centerX + drawWidth / 2; y = centerY + drawHeight / 2; } 
            else if (rot === 270) { x = centerX - drawHeight / 2; y = centerY + drawWidth / 2; } 
            else { x = centerX - drawWidth / 2; y = centerY - drawHeight / 2; }
            page.drawPage(embPage, { x: x, y: y, width: drawWidth, height: drawHeight, rotate: degrees(rot) });
        }
        finalBytes = await newPdf.save();
    }
    state.resultBlob = new Blob([finalBytes], { type: 'application/pdf' });
    state.resultName = state.exportSettings.filename ? `${state.exportSettings.filename}.pdf` : file.name.replace(/\.pdf$/i, '_rotated.pdf');
}

init();