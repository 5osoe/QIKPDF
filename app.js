// Safety check: Prevent crash if library isn't loaded yet
if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
} else {
    console.warn("PDF Lib not loaded. Check internet connection.");
}

// INTRO SCREEN REMOVAL
document.addEventListener("DOMContentLoaded", () => {
    const intro = document.getElementById("intro-screen");
    if (intro) {
        intro.remove();
    }
    setupGlobalModals();
});

const DOM = {
    btnAbout: document.getElementById('btn-about'),
    btnInfo: document.getElementById('btn-info'),
    
    // Modals (Generic)
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

    // Main UI
    logoHome: document.getElementById('logo-home'),
    mainView: document.getElementById('main-view'),
    toolView: document.getElementById('tool-view'),
    toolCards: document.querySelectorAll('.tool-card'),
    toolTitleText: document.getElementById('tool-title-text'),
    toolTitleIcon: document.getElementById('tool-title-icon'),
    btnBack: document.getElementById('btn-back'),
    dropZone: document.getElementById('drop-zone'),
    fileInput: document.getElementById('file-input'),
    reorderContainer: document.getElementById('reorder-container'),
    progressContainer: document.getElementById('progress-container'),
    asciiProgress: document.getElementById('ascii-progress'),
    statusText: document.getElementById('status-text'),
    
    // Result Container (Minimal)
    resultContainer: document.getElementById('result-container'),
    
    // Global Actions
    globalActions: document.getElementById('global-actions'),
    btnProcess: document.getElementById('btn-process'),
    btnDownloadAction: document.getElementById('btn-download-action'),
    btnClearResult: document.getElementById('btn-clear-result'),

    // Rotate UI
    rotateUi: document.getElementById('rotate-ui'),
    rotateFilename: document.getElementById('rotate-filename'),
    rotateBtns: document.querySelectorAll('.rotate-btn'),

    // Split UI
    splitUi: document.getElementById('split-ui'),
    splitFilename: document.getElementById('split-filename'),
    splitPageCount: document.getElementById('split-pagecount'),
    splitModeRadios: document.querySelectorAll('input[name="split-mode"]'),
    splitCustomOptions: document.getElementById('split-custom-options'),
    splitRangeCount: document.getElementById('split-range-count'),
    splitRangesContainer: document.getElementById('split-ranges-container'),

    // PDF 2 IMG UI
    pdf2ImgUi: document.getElementById('pdf2img-ui'),
    pdfGrid: document.getElementById('pdf-grid'),
    btnSelectAll: document.getElementById('btn-select-all'),
    btnSelectNone: document.getElementById('btn-select-none'),
    pageJumpInput: document.getElementById('page-jump-input')
};

// --- MEMORY MANAGEMENT SYSTEM ---
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
    imgFiles: [],
    mergeFiles: [],
    rotateFile: null,
    rotateAngle: 90,
    splitFile: null,
    splitDoc: null, 
    splitMode: 'all', 
    splitRanges: [],
    // Rename Maps
    pdfImgNames: new Map(),
    splitNames: new Map(),
    
    exportSettings: {
        size: 'default',
        filename: '',
        customWidth: 0,
        customHeight: 0,
        exportRotation: 0
    },
    // PDF2IMG Specific
    sourceFile: null,
    pdfImgDoc: null,
    pdfImgSelectedPages: new Set(),
    pdfImgObserver: null
};

const PAGE_SIZES = {
    a0: [2383.94, 3370.39],
    a1: [1683.78, 2383.94],
    a2: [1190.55, 1683.78],
    a3: [841.89, 1190.55],
    a4: [595.28, 841.89],
    a5: [419.53, 595.28],
    a6: [297.64, 419.53],
    b3: [1000.62, 1417.32],
    b4: [708.66, 1000.62],
    b5: [498.90, 708.66],
    letter: [612, 792],
    legal: [612, 1008]
};

let appContent = null;

const toolConfig = {
    'pdf2img': { title: 'PDF \u2192 IMG', accept: 'application/pdf', multiple: false },
    'img2pdf': { title: 'IMG \u2192 PDF', accept: 'image/png, image/jpeg', multiple: true },
    'merge': { title: 'MERGE', accept: 'application/pdf', multiple: true },
    'split': { title: 'SPLIT', accept: 'application/pdf', multiple: false },
    'rotate': { title: 'ROTATE', accept: 'application/pdf', multiple: false }
};

const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 0));

function getBaseName(filename) {
    return filename.replace(/\.[^/.]+$/, "");
}

async function init() {
    document.documentElement.setAttribute('data-theme', 'dark');
    try {
        const response = await fetch('content.json');
        appContent = await response.json();
    } catch (error) {
        console.error("Failed to load content.json:", error);
    }
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js').catch(console.error);
    }
}

// --- MODAL SYSTEM ---
function setupGlobalModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal(modal);
        });
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal:not(.hidden)');
            if (openModal) closeModal(openModal);
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
        'pdf2img': 'pdfToImages', 'img2pdf': 'imageToPdf',
        'merge': 'merge', 'split': 'split', 'rotate': 'rotate'
    };
    const jsonKey = toolKeyMap[state.currentTool];
    const infoText = appContent.tools[jsonKey] || "Information not available.";
    showInfoModal(`${toolConfig[state.currentTool].title} INFO`, infoText);
});

// --- EXPORT MODAL ---
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
        
        if (state.currentTool === 'pdf2img') {
            if(DOM.exportSizeGroup) DOM.exportSizeGroup.classList.add('hidden');
        } else {
            if(DOM.exportSizeGroup) DOM.exportSizeGroup.classList.remove('hidden');
        }

        if (state.currentTool === 'img2pdf' || state.currentTool === 'merge') {
            DOM.exportRotationGroup.classList.remove('hidden');
        } else {
            DOM.exportRotationGroup.classList.add('hidden');
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

DOM.btnExportClose.addEventListener('click', () => finishExportModal(false));
DOM.btnExportCancel.addEventListener('click', () => finishExportModal(false));
DOM.btnExportConfirm.addEventListener('click', () => finishExportModal(true));

// --- GLOBAL ACTIONS ---
DOM.btnProcess.addEventListener('click', async () => {
    const tool = state.currentTool;
    if (tool === 'img2pdf' && state.imgFiles.length === 0) return alert("Please select images.");
    if (tool === 'merge' && state.mergeFiles.length === 0) return alert("Please select PDF files.");
    
    if (tool === 'pdf2img') {
        if (!state.pdfImgDoc) return alert("No PDF loaded.");
        if (state.pdfImgSelectedPages.size === 0) return alert("Select at least one page.");
    }

    if (tool === 'split') {
        if (state.splitMode === 'custom' && state.splitRanges.length === 0) {
             const blocks = document.querySelectorAll('.range-block');
             state.splitRanges = [];
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
        DOM.globalActions.classList.add('disabled-ui');
        DOM.btnProcess.disabled = true;
        DOM.btnProcess.innerText = "PROCESSING...";
        
        DOM.dropZone.classList.add('hidden');
        DOM.reorderContainer.classList.add('hidden');
        DOM.rotateUi.classList.add('hidden');
        DOM.splitUi.classList.add('hidden');
        DOM.pdf2ImgUi.classList.add('hidden');
        DOM.resultContainer.classList.add('hidden'); 
        DOM.progressContainer.classList.remove('hidden');
        
        try {
            await processFiles();
        } catch (e) {
            handleError(e);
        }
    }
});

DOM.btnDownloadAction.addEventListener('click', () => {
    if (!state.resultBlob) return;
    const url = URL.createObjectURL(state.resultBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = state.resultName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
});

DOM.btnClearResult.addEventListener('click', resetToolUI);

// --- NAVIGATION ---
DOM.logoHome.addEventListener('click', goHome);
DOM.btnBack.addEventListener('click', goHome);

function goHome() {
    DOM.toolView.classList.add('hidden');
    DOM.mainView.classList.remove('hidden');
    resetToolUI();
}

DOM.toolCards.forEach(card => {
    card.addEventListener('click', () => {
        const tool = card.getAttribute('data-tool');
        const iconHTML = card.querySelector('.pixel-icon').outerHTML;
        state.currentTool = tool;
        DOM.toolTitleIcon.innerHTML = iconHTML;
        DOM.toolTitleText.innerText = toolConfig[tool].title;
        DOM.fileInput.accept = toolConfig[tool].accept;
        DOM.fileInput.multiple = toolConfig[tool].multiple;
        DOM.mainView.classList.add('hidden');
        DOM.toolView.classList.remove('hidden');
        resetToolUI();
    });
});

function resetToolUI() {
    DOM.dropZone.classList.remove('hidden');
    DOM.progressContainer.classList.add('hidden');
    DOM.resultContainer.classList.add('hidden');
    DOM.reorderContainer.classList.add('hidden');
    DOM.rotateUi.classList.add('hidden'); 
    DOM.splitUi.classList.add('hidden');
    DOM.pdf2ImgUi.classList.add('hidden');
    DOM.globalActions.classList.add('hidden');
    DOM.fileInput.value = '';
    
    UrlManager.revokeAll();

    state.resultBlob = null;
    state.resultName = '';
    state.imgFiles = [];
    state.mergeFiles = [];
    state.rotateFile = null;
    state.rotateAngle = 90;
    state.splitFile = null;
    state.splitMode = 'all';
    state.splitRanges = [];
    state.sourceFile = null;
    state.exportSettings = { size: 'default', filename: '', customWidth:0, customHeight:0, exportRotation: 0 };
    
    state.pdfImgNames.clear();
    state.splitNames.clear();

    if (state.splitDoc) { state.splitDoc.destroy(); state.splitDoc = null; }
    if (state.pdfImgDoc) { state.pdfImgDoc.destroy(); state.pdfImgDoc = null; }
    if (state.pdfImgObserver) { state.pdfImgObserver.disconnect(); state.pdfImgObserver = null; }
    state.pdfImgSelectedPages.clear();
    
    DOM.pdfGrid.innerHTML = '';
    DOM.btnProcess.innerText = "PROCESS PDF";
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

// --- DRAG & DROP ---
DOM.dropZone.addEventListener('click', () => DOM.fileInput.click());
DOM.dropZone.addEventListener('dragover', (e) => { e.preventDefault(); DOM.dropZone.classList.add('dragover'); });
DOM.dropZone.addEventListener('dragleave', () => DOM.dropZone.classList.remove('dragover'));
DOM.dropZone.addEventListener('drop', (e) => {
    e.preventDefault(); DOM.dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
});
DOM.fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) handleFiles(e.target.files);
});

DOM.rotateBtns.forEach(btn => {
    btn.addEventListener('click', () => {
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
            <div class="range-header">FILE #${i+1}</div>
            <div class="range-inputs">
                <input type="number" class="input-num range-start" placeholder="FROM" data-idx="${i}">
                <span>TO</span>
                <input type="number" class="input-num range-end" placeholder="TO" data-idx="${i}">
            </div>
            <input type="text" class="range-name-input input-text" placeholder="Filename" value="${storedName}" data-idx="${i}">
            <div class="range-previews">
                <canvas class="preview-canvas start-canvas" data-idx="${i}"></canvas>
                <canvas class="preview-canvas end-canvas" data-idx="${i}"></canvas>
            </div>
        `;
        DOM.splitRangesContainer.appendChild(block);
        
        const startInput = block.querySelector('.range-start');
        const endInput = block.querySelector('.range-end');
        const nameInput = block.querySelector('.range-name-input');
        
        startInput.addEventListener('change', (e) => updateRangePreview(i, 'start', e.target.value));
        endInput.addEventListener('change', (e) => updateRangePreview(i, 'end', e.target.value));
        nameInput.addEventListener('input', (e) => state.splitNames.set(i, e.target.value.trim()));
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
    } catch (e) {
        console.warn("Preview render failed", e);
    }
}

async function initSplitUI(file) {
    DOM.splitFilename.innerText = file.name;
    DOM.splitPageCount.innerText = "LOADING...";
    try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        state.splitDoc = await loadingTask.promise;
        DOM.splitPageCount.innerText = state.splitDoc.numPages + " PAGES";
        DOM.splitRangeCount.value = 1;
        state.splitMode = 'all';
        DOM.splitModeRadios[0].checked = true;
        DOM.splitCustomOptions.classList.add('hidden');
    } catch (e) {
        console.error("Failed to load PDF for split UI", e);
        DOM.splitPageCount.innerText = "ERROR";
    }
}

async function initPdfToImgUI(file) {
    DOM.pdfGrid.innerHTML = '';
    DOM.pdf2ImgUi.classList.remove('hidden');
    DOM.statusText.innerText = "ANALYZING PDF...";
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
                <div class="page-info">PAGE ${i}</div>
                <input type="text" class="card-name-input" value="${storedName}" data-page="${i}">
            `;
            const input = card.querySelector('.card-name-input');
            input.addEventListener('click', (e) => e.stopPropagation()); 
            input.addEventListener('input', (e) => state.pdfImgNames.set(i, e.target.value.trim()));
            card.addEventListener('click', (e) => {
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
    } catch (e) {
        console.error("PDF Init Error", e);
        alert("Failed to load PDF.");
    }
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
    } catch (e) {
        console.warn(`Thumb load failed p${pageNum}`, e);
    }
}

DOM.btnSelectAll.addEventListener('click', () => {
    if (!state.pdfImgDoc) return;
    const cards = document.querySelectorAll('.page-card');
    cards.forEach(c => c.classList.add('selected'));
    for (let i = 1; i <= state.pdfImgDoc.numPages; i++) state.pdfImgSelectedPages.add(i);
});

DOM.btnSelectNone.addEventListener('click', () => {
    if (!state.pdfImgDoc) return;
    const cards = document.querySelectorAll('.page-card');
    cards.forEach(c => c.classList.remove('selected'));
    state.pdfImgSelectedPages.clear();
});

DOM.pageJumpInput.addEventListener('change', (e) => {
    const page = parseInt(e.target.value);
    if (page && state.pdfImgDoc && page >= 1 && page <= state.pdfImgDoc.numPages) {
        const el = document.getElementById(`pdf-page-${page}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('pulse-highlight');
            setTimeout(() => el.classList.remove('pulse-highlight'), 1000);
        }
    }
});

function handleFiles(files) {
    const fileArr = Array.from(files);
    if (!toolConfig[state.currentTool].multiple && fileArr.length > 1) fileArr.length = 1; 
    
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
    if (state.currentTool === 'pdf2img') {
        initPdfToImgUI(fileArr[0]);
        return;
    }
}

function handleError(e) {
    console.error(e);
    DOM.statusText.innerText = `>> ERROR: ${e.message || "UNKNOWN"}`;
    DOM.asciiProgress.innerText = "[!! ERROR !!]";
    DOM.btnProcess.disabled = false;
    DOM.btnProcess.innerText = "PROCESS PDF";
    DOM.globalActions.classList.remove('disabled-ui');
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
            if (dragStartIndex > -1 && dragStartIndex !== index) {
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
            thumbContainer.appendChild(thumb);
        } else {
            const docIcon = document.createElement('div');
            docIcon.className = 'item-thumb doc-icon';
            docIcon.innerText = 'PDF';
            thumbContainer.appendChild(docIcon);
        }

        const name = document.createElement('span');
        name.className = 'item-name';
        name.innerText = file.name;
        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn-remove';
        removeBtn.innerText = 'X';
        removeBtn.onclick = () => {
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
    let files = [];
    
    if(tool === 'pdf2img' || tool === 'split' || tool === 'rotate') {
        if (tool === 'pdf2img') files = [state.sourceFile];
        if (tool === 'split') files = [state.splitFile];
        if (tool === 'rotate') files = [state.rotateFile];
    } else {
        files = tool === 'img2pdf' ? state.imgFiles : state.mergeFiles;
    }

    if (!files[0]) throw new Error("No file loaded.");
    
    if (tool === 'pdf2img') await execPdfToImg(files[0]);
    else if (tool === 'img2pdf') await execImgToPdf(files);
    else if (tool === 'merge') await execMerge(files);
    else if (tool === 'split') await execSplit(files[0]);
    else if (tool === 'rotate') await execRotate(files[0]);
    
    DOM.progressContainer.classList.add('hidden');
    DOM.resultContainer.classList.remove('hidden');
    
    // Final Result Action - Just show success
    UrlManager.revokeAll();

    DOM.btnProcess.classList.add('hidden');
    DOM.btnDownloadAction.classList.remove('hidden');
    DOM.btnClearResult.classList.remove('hidden');
    
    DOM.btnDownloadAction.disabled = false;
    DOM.globalActions.classList.remove('disabled-ui');
}

// --- CORE PROCESSING LOGIC (UNTOUCHED) ---
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
    if (s === 'custom') return [state.exportSettings.customWidth, state.exportSettings.customHeight];
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
        const arrayBuffer = await files[i].arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
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
            const indices = [];
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
            const scale = Math.min(target[0] / contentWidth, target[1] / contentHeight);
            const page = newPdf.addPage(target);
            const drawWidth = embPage.width * scale;
            const drawHeight = embPage.height * scale;
            const centerX = target[0] / 2;
            const centerY = target[1] / 2;
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