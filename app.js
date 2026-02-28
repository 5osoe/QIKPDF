// Safety check: Prevent crash if library isn't loaded yet
if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
} else {
    console.warn("PDF Lib not loaded. Check internet connection.");
}

// INTRO SCREEN REMOVAL
document.addEventListener("DOMContentLoaded", () => {
    const intro = document.getElementById("intro-screen");
    if (intro) intro.remove();
});

const DOM = {
    // Nav
    logoHome: document.getElementById('logo-home'),
    btnAbout: document.getElementById('btn-about'),
    btnBack: document.getElementById('btn-back'),
    
    // Tool UI
    btnInfo: document.getElementById('btn-info'),
    btnResetTool: document.getElementById('btn-reset-tool'),
    toolView: document.getElementById('tool-view'),
    mainView: document.getElementById('main-view'),
    toolCards: document.querySelectorAll('.tool-card'),
    toolTitleText: document.getElementById('tool-title-text'),
    toolTitleIcon: document.getElementById('tool-title-icon'),
    dropZone: document.getElementById('drop-zone'),
    fileInput: document.getElementById('file-input'),
    reorderContainer: document.getElementById('reorder-container'),
    progressContainer: document.getElementById('progress-container'),
    asciiProgress: document.getElementById('ascii-progress'),
    statusText: document.getElementById('status-text'),
    
    // Result UI
    resultContainer: document.getElementById('result-container'),
    resultPreviewCanvas: document.getElementById('result-preview-canvas'),
    resultGrid: document.getElementById('result-grid'),
    resultList: document.getElementById('result-list'),
    resultZipInfo: document.getElementById('result-zip-info'),
    resultZipName: document.getElementById('result-zip-name'),

    // Global Actions
    globalActions: document.getElementById('global-actions'),
    btnProcess: document.getElementById('btn-process'),
    btnEditResult: document.getElementById('btn-edit-result'),
    btnReprocess: document.getElementById('btn-reprocess'),
    btnDownloadAction: document.getElementById('btn-download-action'),

    // Specific UIs
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
    pageJumpInput: document.getElementById('page-jump-input'),

    // Modals
    infoModal: document.getElementById('info-modal'),
    modalTitle: document.getElementById('modal-title'),
    modalBody: document.getElementById('modal-body'),
    btnModalClose: document.getElementById('btn-modal-close'),
    
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

    imgPreviewModal: document.getElementById('img-preview-modal'),
    imgPreviewElement: document.getElementById('img-preview-element'),
    btnImgPreviewClose: document.getElementById('btn-img-preview-close'),

    pdfPreviewModal: document.getElementById('pdf-preview-modal'),
    pdfPreviewCanvas: document.getElementById('pdf-preview-canvas'),
    btnPdfPreviewClose: document.getElementById('btn-pdf-preview-close'),
    btnPdfPrev: document.getElementById('btn-pdf-prev'),
    btnPdfNext: document.getElementById('btn-pdf-next'),
    pdfPageCurrent: document.getElementById('pdf-page-current'),
    pdfPageTotal: document.getElementById('pdf-page-total'),
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
    // Rename Maps (Phase 5)
    pdfImgNames: new Map(), // Key: Page Index, Value: String
    splitNames: new Map(),  // Key: Range Index, Value: String
    
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

const toolConfig = {
    'pdf2img': { title: 'PDF \u2192 IMG', accept: 'application/pdf', multiple: false },
    'img2pdf': { title: 'IMG \u2192 PDF', accept: 'image/png, image/jpeg', multiple: true },
    'merge': { title: 'MERGE', accept: 'application/pdf', multiple: true },
    'split': { title: 'SPLIT', accept: 'application/pdf', multiple: false },
    'rotate': { title: 'ROTATE', accept: 'application/pdf', multiple: false }
};

let appContent = null;
const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 0));
function getBaseName(filename) { return filename.replace(/\.[^/.]+$/, ""); }

async function init() {
    try {
        const response = await fetch('content.json');
        appContent = await response.json();
    } catch (e) { console.error("Content load error", e); }
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js').catch(console.error);
}

// --- PHASE 1: UI STATE MACHINE ---
function setViewState(view) {
    // Views: 'home', 'tool', 'processing', 'result'
    
    if (view === 'home') {
        DOM.mainView.classList.remove('hidden');
        DOM.toolView.classList.add('hidden');
        DOM.globalActions.classList.add('hidden');
    } else {
        DOM.mainView.classList.add('hidden');
        DOM.toolView.classList.remove('hidden');
        
        // Sub-states within Tool View
        DOM.dropZone.classList.add('hidden');
        DOM.reorderContainer.classList.add('hidden');
        DOM.rotateUi.classList.add('hidden');
        DOM.splitUi.classList.add('hidden');
        DOM.pdf2ImgUi.classList.add('hidden');
        DOM.resultContainer.classList.add('hidden');
        DOM.progressContainer.classList.add('hidden');
        DOM.globalActions.classList.add('hidden');
        
        if (view === 'tool') {
            // Show Active Tool Inputs
            DOM.globalActions.classList.remove('hidden');
            DOM.btnProcess.classList.remove('hidden');
            DOM.btnEditResult.classList.add('hidden');
            DOM.btnReprocess.classList.add('hidden');
            DOM.btnDownloadAction.classList.add('hidden');
            DOM.btnProcess.disabled = false;
            
            // Show Specific Tool UI if file loaded
            const hasFiles = state.sourceFile || state.imgFiles.length > 0 || state.mergeFiles.length > 0;
            
            if (!hasFiles) {
                DOM.dropZone.classList.remove('hidden');
                DOM.globalActions.classList.add('hidden'); // Hide process btn if no files
            } else {
                if (state.currentTool === 'img2pdf' || state.currentTool === 'merge') {
                    DOM.dropZone.classList.remove('hidden');
                    DOM.reorderContainer.classList.remove('hidden');
                } else if (state.currentTool === 'rotate') {
                    DOM.rotateUi.classList.remove('hidden');
                } else if (state.currentTool === 'split') {
                    DOM.splitUi.classList.remove('hidden');
                } else if (state.currentTool === 'pdf2img') {
                    DOM.pdf2ImgUi.classList.remove('hidden');
                }
            }
        }
        else if (view === 'processing') {
            DOM.progressContainer.classList.remove('hidden');
        }
        else if (view === 'result') {
            DOM.resultContainer.classList.remove('hidden');
            DOM.globalActions.classList.remove('hidden');
            DOM.btnProcess.classList.add('hidden');
            DOM.btnEditResult.classList.remove('hidden');
            DOM.btnReprocess.classList.remove('hidden');
            DOM.btnDownloadAction.classList.remove('hidden');
            DOM.btnDownloadAction.disabled = false;
        }
    }
}

// --- Navigation & Tool Logic ---
DOM.logoHome.addEventListener('click', goHome);
DOM.btnBack.addEventListener('click', goHome);
DOM.btnResetTool.addEventListener('click', () => resetToolUI(true));

function goHome() {
    resetToolUI(true);
    setViewState('home');
}

DOM.toolCards.forEach(card => {
    card.addEventListener('click', () => {
        const tool = card.getAttribute('data-tool');
        state.currentTool = tool;
        DOM.toolTitleIcon.innerHTML = card.querySelector('.pixel-icon').outerHTML;
        DOM.toolTitleText.innerText = toolConfig[tool].title;
        DOM.fileInput.accept = toolConfig[tool].accept;
        DOM.fileInput.multiple = toolConfig[tool].multiple;
        resetToolUI(false); // Reset state, but don't go home
        setViewState('tool');
    });
});

function resetToolUI(fullClear) {
    // PHASE 4: Memory Cleanup
    if (state.resultBlob) {
        // Just in case we created an object URL elsewhere
        state.resultBlob = null;
    }

    DOM.fileInput.value = '';
    
    // Clear Files & State
    state.imgFiles = [];
    state.mergeFiles = [];
    state.rotateFile = null;
    state.rotateAngle = 90;
    state.splitFile = null;
    state.splitMode = 'all';
    state.sourceFile = null;
    state.exportSettings = { size: 'default', filename: '', customWidth:0, customHeight:0, exportRotation: 0 };
    
    if (fullClear) {
        // Only clear renaming maps on full reset
        state.pdfImgNames.clear();
        state.splitNames.clear();
        state.splitRanges = [];
        state.pdfImgSelectedPages.clear();
    }
    
    // Cleanup PDF Objects
    if (state.splitDoc) { state.splitDoc.destroy(); state.splitDoc = null; }
    if (state.pdfImgDoc) { state.pdfImgDoc.destroy(); state.pdfImgDoc = null; }
    if (state.pdfImgObserver) { state.pdfImgObserver.disconnect(); state.pdfImgObserver = null; }
    
    DOM.pdfGrid.innerHTML = '';
    DOM.splitRangesContainer.innerHTML = '';
    
    // Reset Buttons
    DOM.rotateBtns.forEach(b => b.classList.remove('selected'));
    const rightBtn = document.querySelector('.rotate-btn[data-angle="90"]');
    if(rightBtn) rightBtn.classList.add('selected');
    
    setProgress(0);
}

// --- Global Actions ---
DOM.btnProcess.addEventListener('click', async () => {
    // Validation
    const tool = state.currentTool;
    if (tool === 'img2pdf' && state.imgFiles.length === 0) return alert("Please select images.");
    if (tool === 'merge' && state.mergeFiles.length === 0) return alert("Please select PDF files.");
    if (tool === 'pdf2img' && !state.pdfImgDoc) return alert("No PDF loaded.");
    if (tool === 'pdf2img' && state.pdfImgSelectedPages.size === 0) return alert("Select at least one page.");
    
    if (tool === 'split' && state.splitMode === 'custom') {
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

    // Settings Modal
    const confirmed = await openExportModal();
    if (confirmed) {
        setViewState('processing');
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

DOM.btnReprocess.addEventListener('click', () => DOM.btnProcess.click());

DOM.btnEditResult.addEventListener('click', () => {
    // PHASE 4: Result -> Edit Transition
    // Restore the tool UI with the *exact* same state (don't clear maps/files)
    setViewState('tool');
});

// --- Input Handling ---
DOM.dropZone.addEventListener('click', () => DOM.fileInput.click());
DOM.dropZone.addEventListener('dragover', (e) => { e.preventDefault(); DOM.dropZone.classList.add('dragover'); });
DOM.dropZone.addEventListener('dragleave', () => DOM.dropZone.classList.remove('dragover'); });
DOM.dropZone.addEventListener('drop', (e) => {
    e.preventDefault(); DOM.dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
});
DOM.fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) handleFiles(e.target.files);
});

function handleFiles(files) {
    const fileArr = Array.from(files);
    if (!toolConfig[state.currentTool].multiple && fileArr.length > 1) fileArr.length = 1;
    
    if (state.currentTool === 'img2pdf') {
        state.imgFiles = state.imgFiles.concat(fileArr);
        renderReorderUI();
    } else if (state.currentTool === 'merge') {
        state.mergeFiles = state.mergeFiles.concat(fileArr);
        renderReorderUI();
    } else {
        // Single File Tools
        state.sourceFile = fileArr[0];
        if (state.currentTool === 'rotate') {
            state.rotateFile = fileArr[0];
            DOM.rotateFilename.innerText = fileArr[0].name;
        } else if (state.currentTool === 'split') {
            state.splitFile = fileArr[0];
            initSplitUI(fileArr[0]);
        } else if (state.currentTool === 'pdf2img') {
            initPdfToImgUI(fileArr[0]);
        }
    }
    setViewState('tool');
}

// --- Specific Tool UIs ---
DOM.rotateBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        state.rotateAngle = parseInt(btn.getAttribute('data-angle'));
        DOM.rotateBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
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

// PHASE 5: Split Rename Persistence
function renderSplitRanges(count) {
    DOM.splitRangesContainer.innerHTML = '';
    const baseName = state.sourceFile ? getBaseName(state.sourceFile.name) : 'split';

    for (let i = 0; i < count; i++) {
        const block = document.createElement('div');
        block.className = 'range-block';
        
        const defaultName = `${baseName}_part_${i+1}`;
        if (!state.splitNames.has(i)) state.splitNames.set(i, defaultName);
        const storedName = state.splitNames.get(i);

        block.innerHTML = `
            <div class="range-header">FILE #${i+1}</div>
            <div class="range-inputs">
                <input type="number" class="input-num range-start" placeholder="FROM" data-idx="${i}">
                <span>TO</span>
                <input type="number" class="input-num range-end" placeholder="TO" data-idx="${i}">
            </div>
            <input type="text" class="range-name-input input-text" value="${storedName}" placeholder="Filename">
            <div class="range-previews">
                <canvas class="preview-canvas start-canvas" data-idx="${i}"></canvas>
                <canvas class="preview-canvas end-canvas" data-idx="${i}"></canvas>
            </div>
        `;
        DOM.splitRangesContainer.appendChild(block);
        
        // Bind Listeners
        const nameInput = block.querySelector('.range-name-input');
        nameInput.addEventListener('input', (e) => state.splitNames.set(i, e.target.value.trim()));

        // Range preview logic remains similar to before...
        const sInput = block.querySelector('.range-start');
        const eInput = block.querySelector('.range-end');
        sInput.addEventListener('change', (e) => updateRangePreview(i, 'start', e.target.value));
        eInput.addEventListener('change', (e) => updateRangePreview(i, 'end', e.target.value));
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
    } catch(e) {}
}

async function initSplitUI(file) {
    DOM.splitFilename.innerText = file.name;
    DOM.splitPageCount.innerText = "LOADING...";
    try {
        const buf = await file.arrayBuffer();
        const task = pdfjsLib.getDocument({ data: buf });
        state.splitDoc = await task.promise;
        DOM.splitPageCount.innerText = state.splitDoc.numPages + " PAGES";
        DOM.splitRangeCount.value = 1;
        state.splitMode = 'all';
        DOM.splitModeRadios[0].checked = true;
        DOM.splitCustomOptions.classList.add('hidden');
    } catch(e) {
        console.error(e);
        DOM.splitPageCount.innerText = "ERROR";
    }
}

// PHASE 5: PDF2IMG Rename Persistence
async function initPdfToImgUI(file) {
    DOM.pdfGrid.innerHTML = '';
    DOM.statusText.innerText = "ANALYZING PDF...";
    try {
        const buf = await file.arrayBuffer();
        const task = pdfjsLib.getDocument({ data: buf });
        state.pdfImgDoc = await task.promise;
        const total = state.pdfImgDoc.numPages;
        const baseName = getBaseName(file.name);
        
        const frag = document.createDocumentFragment();
        for (let i = 1; i <= total; i++) {
            const card = document.createElement('div');
            card.className = 'page-card selected';
            card.dataset.page = i;
            
            const defaultName = `${baseName}_page_${String(i).padStart(3,'0')}`;
            if (!state.pdfImgNames.has(i)) state.pdfImgNames.set(i, defaultName);
            const storedName = state.pdfImgNames.get(i);
            
            card.innerHTML = `
                <div class="page-check"><svg class="check-icon" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg></div>
                <div class="page-preview-box"><span class="page-loading">...</span></div>
                <div class="page-info">PAGE ${i}</div>
                <input type="text" class="card-name-input" value="${storedName}" data-page="${i}">
            `;
            
            const input = card.querySelector('.card-name-input');
            input.addEventListener('click', e => e.stopPropagation());
            input.addEventListener('input', e => state.pdfImgNames.set(i, e.target.value.trim()));
            
            card.addEventListener('click', (e) => {
                if(e.target === input) return;
                if(state.pdfImgSelectedPages.has(i)) {
                    state.pdfImgSelectedPages.delete(i);
                    card.classList.remove('selected');
                } else {
                    state.pdfImgSelectedPages.add(i);
                    card.classList.add('selected');
                }
            });
            state.pdfImgSelectedPages.add(i);
            frag.appendChild(card);
        }
        DOM.pdfGrid.appendChild(frag);
        
        // Lazy Load Thumbs
        if (state.pdfImgObserver) state.pdfImgObserver.disconnect();
        state.pdfImgObserver = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const c = entry.target;
                    loadPdfThumbnail(c, parseInt(c.dataset.page));
                    obs.unobserve(c);
                }
            });
        }, { root: DOM.pdfGrid, threshold: 0.1 });
        document.querySelectorAll('.page-card').forEach(c => state.pdfImgObserver.observe(c));
        
    } catch(e) {
        console.error(e);
        alert("Failed to load PDF");
    }
}

async function loadPdfThumbnail(card, num) {
    if(!state.pdfImgDoc) return;
    try {
        const page = await state.pdfImgDoc.getPage(num);
        const viewport = page.getViewport({scale: 0.3});
        const canvas = document.createElement('canvas');
        canvas.className = 'page-canvas';
        const ctx = canvas.getContext('2d', {alpha: false});
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({canvasContext: ctx, viewport}).promise;
        const box = card.querySelector('.page-preview-box');
        box.innerHTML = '';
        box.appendChild(canvas);
        page.cleanup();
    } catch(e) {}
}

DOM.btnSelectAll.addEventListener('click', () => {
    document.querySelectorAll('.page-card').forEach(c => c.classList.add('selected'));
    if(state.pdfImgDoc) for(let i=1; i<=state.pdfImgDoc.numPages; i++) state.pdfImgSelectedPages.add(i);
});
DOM.btnSelectNone.addEventListener('click', () => {
    document.querySelectorAll('.page-card').forEach(c => c.classList.remove('selected'));
    state.pdfImgSelectedPages.clear();
});

// --- Modal System ---
function openModal(title, text) {
    DOM.modalTitle.innerText = title;
    DOM.modalBody.innerText = text;
    DOM.infoModal.classList.remove('hidden');
    document.body.classList.add('modal-open');
}
DOM.btnModalClose.addEventListener('click', () => {
    DOM.infoModal.classList.add('hidden');
    document.body.classList.remove('modal-open');
});
DOM.btnAbout.addEventListener('click', () => { if(appContent) openModal('ABOUT', appContent.about); });
DOM.btnInfo.addEventListener('click', () => {
    if(!appContent || !state.currentTool) return;
    const map = { 'pdf2img': 'pdfToImages', 'img2pdf': 'imageToPdf', 'merge': 'merge', 'split': 'split', 'rotate': 'rotate' };
    openModal(`${toolConfig[state.currentTool].title} INFO`, appContent.tools[map[state.currentTool]]);
});

// --- Export Modal ---
let exportResolve = null;
function openExportModal() {
    return new Promise(resolve => {
        exportResolve = resolve;
        DOM.exportFilename.value = '';
        DOM.exportSize.value = 'default';
        DOM.exportRotation.value = '0';
        DOM.customSizeInputs.classList.add('hidden');
        
        // Hide/Show Rotation & Size based on tool
        if (state.currentTool === 'pdf2img') {
            DOM.exportSizeGroup.classList.add('hidden');
            DOM.exportRotationGroup.classList.add('hidden');
        } else {
            DOM.exportSizeGroup.classList.remove('hidden');
            if (state.currentTool === 'img2pdf' || state.currentTool === 'merge') {
                DOM.exportRotationGroup.classList.remove('hidden');
            } else {
                DOM.exportRotationGroup.classList.add('hidden');
            }
        }
        
        DOM.exportModal.classList.remove('hidden');
        document.body.classList.add('modal-open');
    });
}
DOM.exportSize.addEventListener('change', (e) => {
    if(e.target.value === 'custom') DOM.customSizeInputs.classList.remove('hidden');
    else DOM.customSizeInputs.classList.add('hidden');
});
function closeExportModal(confirmed) {
    if(confirmed) {
        state.exportSettings.size = DOM.exportSize.value;
        state.exportSettings.filename = DOM.exportFilename.value.trim();
        state.exportSettings.exportRotation = parseInt(DOM.exportRotation.value) || 0;
        if(state.exportSettings.size === 'custom') {
            const w = parseFloat(DOM.customWidth.value);
            const h = parseFloat(DOM.customHeight.value);
            const u = DOM.customUnit.value;
            if(isNaN(w) || isNaN(h) || w<=0 || h<=0) { alert("Invalid Dimensions"); return; }
            let f = 1;
            if(u === 'mm') f = 2.83465;
            if(u === 'cm') f = 28.3465;
            if(u === 'inch') f = 72;
            state.exportSettings.customWidth = w * f;
            state.exportSettings.customHeight = h * f;
        }
    }
    DOM.exportModal.classList.add('hidden');
    document.body.classList.remove('modal-open');
    if(exportResolve) exportResolve(confirmed);
    exportResolve = null;
}
DOM.btnExportConfirm.addEventListener('click', () => closeExportModal(true));
DOM.btnExportCancel.addEventListener('click', () => closeExportModal(false));
DOM.btnExportClose.addEventListener('click', () => closeExportModal(false));

// --- Reorder UI ---
let dragStartIndex = -1;
function renderReorderUI() {
    const list = DOM.reorderContainer;
    list.innerHTML = '';
    const isImg = state.currentTool === 'img2pdf';
    const active = isImg ? state.imgFiles : state.mergeFiles;
    
    if(active.length === 0) return;
    
    const ul = document.createElement('div');
    ul.className = 'reorder-list';
    
    active.forEach((file, idx) => {
        const item = document.createElement('div');
        item.className = 'reorder-item';
        item.draggable = true;
        
        item.addEventListener('dragstart', () => { dragStartIndex = idx; item.classList.add('dragging'); });
        item.addEventListener('dragover', e => e.preventDefault());
        item.addEventListener('drop', e => {
            e.preventDefault();
            if(dragStartIndex > -1 && dragStartIndex !== idx) {
                const moved = active.splice(dragStartIndex, 1)[0];
                active.splice(idx, 0, moved);
                renderReorderUI();
            }
        });
        item.addEventListener('dragend', () => { dragStartIndex = -1; item.classList.remove('dragging'); });
        
        item.innerHTML = `
            <div class="drag-handle">::</div>
            <div class="item-idx">[${String(idx+1).padStart(2,'0')}]</div>
            <div class="item-thumb-container"></div>
            <span class="item-name">${file.name}</span>
            <button class="btn-remove">X</button>
        `;
        
        // Thumbnail
        const box = item.querySelector('.item-thumb-container');
        if(isImg) {
            const img = document.createElement('img');
            img.className = 'item-thumb';
            img.src = URL.createObjectURL(file);
            box.appendChild(img);
        } else {
            const span = document.createElement('span');
            span.className = 'doc-icon';
            span.innerText = "PDF";
            box.appendChild(span);
        }
        
        item.querySelector('.btn-remove').onclick = () => {
            active.splice(idx, 1);
            renderReorderUI();
        };
        ul.appendChild(item);
    });
    list.appendChild(ul);
}

// --- CORE PROCESSING ---
function setProgress(p, m = "PROCESSING...") {
    const safe = Math.min(100, Math.max(0, Math.round(p)));
    const filled = Math.round((safe/100)*14);
    DOM.asciiProgress.innerText = `[${'█'.repeat(filled)}${'░'.repeat(14-filled)}] ${safe}%`;
    if(m) DOM.statusText.innerText = m;
}

function getTargetSize() {
    if(state.exportSettings.size === 'custom') 
        return [state.exportSettings.customWidth, state.exportSettings.customHeight];
    return PAGE_SIZES[state.exportSettings.size];
}

async function processFiles() {
    const tool = state.currentTool;
    let files = [];
    if(tool === 'pdf2img') files = [state.sourceFile];
    else if(tool === 'split') files = [state.splitFile];
    else if(tool === 'rotate') files = [state.rotateFile];
    else files = tool === 'img2pdf' ? state.imgFiles : state.mergeFiles;

    if(!files[0]) throw new Error("No files");

    if(tool === 'pdf2img') await execPdfToImg(files[0]);
    else if(tool === 'img2pdf') await execImgToPdf(files);
    else if(tool === 'merge') await execMerge(files);
    else if(tool === 'split') await execSplit(files[0]);
    else if(tool === 'rotate') await execRotate(files[0]);

    setViewState('result');
    await renderFinalResultPreview(state.resultBlob, tool);
}

// --- PHASE 2: ROTATION ISOLATION ---
async function execRotate(file) {
    const { PDFDocument, degrees } = PDFLib;
    setProgress(0, "LOADING PDF...");
    await yieldToMain();

    const buf = await file.arrayBuffer();
    const pdf = await PDFDocument.load(buf);
    const pages = pdf.getPages();
    const total = pages.length;
    const angleToAdd = state.rotateAngle || 90;
    const sizeSetting = state.exportSettings.size;
    
    // Calculate new metadata rotation for each page first
    // Note: PDF page rotation is usually 0, 90, 180, 270.
    const newRotations = [];
    for(let i=0; i<total; i++) {
        const curr = pages[i].getRotation().angle;
        let next = (curr + angleToAdd) % 360;
        if(next < 0) next += 360;
        newRotations.push(next);
    }

    let finalBytes;

    if (sizeSetting === 'default') {
        // Simple metadata update
        for(let i=0; i<total; i++) {
            pages[i].setRotation(degrees(newRotations[i]));
        }
        finalBytes = await pdf.save();
    } else {
        // PHASE 2 FIX: Resize then Rotate
        const newPdf = await PDFDocument.create();
        const embedded = await newPdf.embedPages(pages);
        const target = getTargetSize(); // [w, h]
        
        for (let i = 0; i < total; i++) {
            setProgress((i/total)*100, `RESIZING PAGE ${i+1}/${total}`);
            const embPage = embedded[i];
            const finalRot = newRotations[i];

            // 1. Create page of Target Size
            const page = newPdf.addPage(target);
            
            // 2. Scale content to fit Target (preserving aspect ratio of content)
            const scale = Math.min(
                target[0] / embPage.width,
                target[1] / embPage.height
            );
            
            const drawW = embPage.width * scale;
            const drawH = embPage.height * scale;
            
            // 3. Draw content centered (Upright relative to page coordinates)
            page.drawPage(embPage, {
                x: (target[0] - drawW) / 2,
                y: (target[1] - drawH) / 2,
                width: drawW,
                height: drawH
            });
            
            // 4. Apply Rotation to the Page Metadata
            // This rotates the "paper", carrying the content with it.
            page.setRotation(degrees(finalRot));
        }
        finalBytes = await newPdf.save();
    }
    
    state.resultBlob = new Blob([finalBytes], { type: 'application/pdf' });
    state.resultName = state.exportSettings.filename ? `${state.exportSettings.filename}.pdf` : file.name.replace(/\.pdf$/i, '_rotated.pdf');
}

// --- PHASE 3: CREATION ROTATION ---
async function execImgToPdf(files) {
    const { PDFDocument, degrees } = PDFLib;
    const pdfDoc = await PDFDocument.create();
    const sizeSetting = state.exportSettings.size;
    const exportRot = state.exportSettings.exportRotation || 0; // Phase 3
    
    for (let i = 0; i < files.length; i++) {
        setProgress((i/files.length)*100, `ADDING IMAGE ${i+1}`);
        const buf = await files[i].arrayBuffer();
        let img;
        try {
            if(files[i].type === 'image/jpeg' || files[i].name.match(/\.jpe?g$/i)) img = await pdfDoc.embedJpg(buf);
            else if(files[i].type === 'image/png' || files[i].name.match(/\.png$/i)) img = await pdfDoc.embedPng(buf);
        } catch(e) { continue; }
        if(!img) continue;

        let page;
        if (sizeSetting !== 'default') {
            const target = getTargetSize();
            page = pdfDoc.addPage(target);
            const scale = Math.min(target[0]/img.width, target[1]/img.height);
            const w = img.width*scale;
            const h = img.height*scale;
            page.drawImage(img, { x: (target[0]-w)/2, y: (target[1]-h)/2, width: w, height: h });
        } else {
            page = pdfDoc.addPage([img.width, img.height]);
            page.drawImage(img, { x:0, y:0, width: img.width, height: img.height });
        }
        
        // Phase 3: Apply export rotation at the end
        if(exportRot !== 0) page.setRotation(degrees(exportRot));
    }
    
    setProgress(100, "SAVING PDF...");
    const bytes = await pdfDoc.save();
    state.resultBlob = new Blob([bytes], { type: 'application/pdf' });
    state.resultName = state.exportSettings.filename ? `${state.exportSettings.filename}.pdf` : 'images_merged.pdf';
}

async function execMerge(files) {
    const { PDFDocument, degrees } = PDFLib;
    const mergedPdf = await PDFDocument.create();
    const sizeSetting = state.exportSettings.size;
    const exportRot = state.exportSettings.exportRotation || 0; // Phase 3

    for (let i=0; i<files.length; i++) {
        setProgress((i/files.length)*100, `MERGING FILE ${i+1}`);
        const buf = await files[i].arrayBuffer();
        const pdf = await PDFDocument.load(buf, {ignoreEncryption: true});
        
        if (sizeSetting === 'default') {
            const copied = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copied.forEach(p => {
                const newPage = mergedPdf.addPage(p);
                // Apply rotation additively or override? Usually additive to existing page rot.
                // But specifically for "Export Rotation", it implies rotating the final sheet.
                if(exportRot !== 0) {
                    const current = newPage.getRotation().angle;
                    newPage.setRotation(degrees(current + exportRot));
                }
            });
        } else {
            const embedded = await mergedPdf.embedPages(pdf.getPages());
            const target = getTargetSize();
            embedded.forEach(emb => {
                const p = mergedPdf.addPage(target);
                const {width, height} = emb.scale(1);
                const scale = Math.min(target[0]/width, target[1]/height);
                p.drawPage(emb, { x: (target[0]-width*scale)/2, y: (target[1]-height*scale)/2, xScale: scale, yScale: scale });
                if(exportRot !== 0) p.setRotation(degrees(exportRot));
            });
        }
    }
    setProgress(100, "SAVING...");
    const bytes = await mergedPdf.save();
    state.resultBlob = new Blob([bytes], { type: 'application/pdf' });
    state.resultName = state.exportSettings.filename ? `${state.exportSettings.filename}.pdf` : 'merged.pdf';
}

async function execSplit(file) {
    const { PDFDocument } = PDFLib;
    const buf = await file.arrayBuffer();
    const pdf = await PDFDocument.load(buf);
    const zip = new JSZip();
    const sizeSetting = state.exportSettings.size;
    
    // Helper to extract pages
    const extract = async (indices) => {
        const newDoc = await PDFDocument.create();
        if(sizeSetting === 'default') {
            const copied = await newDoc.copyPages(pdf, indices);
            copied.forEach(p => newDoc.addPage(p));
        } else {
            const pages = indices.map(i => pdf.getPage(i));
            const embedded = await newDoc.embedPages(pages);
            const target = getTargetSize();
            embedded.forEach(emb => {
                const p = newDoc.addPage(target);
                const {width, height} = emb.scale(1);
                const scale = Math.min(target[0]/width, target[1]/height);
                p.drawPage(emb, { x: (target[0]-width*scale)/2, y: (target[1]-height*scale)/2, xScale: scale, yScale: scale });
            });
        }
        return await newDoc.save();
    };

    if(state.splitMode === 'all') {
        const total = pdf.getPageCount();
        for(let i=0; i<total; i++) {
            setProgress((i/total)*100, `SPLITTING ${i+1}/${total}`);
            const bytes = await extract([i]);
            zip.file(`page_${String(i+1).padStart(3,'0')}.pdf`, bytes);
        }
        state.resultName = state.exportSettings.filename ? `${state.exportSettings.filename}.zip` : file.name.replace(/\.pdf$/i, '_split.zip');
    } else {
        const ranges = state.splitRanges;
        for(let i=0; i<ranges.length; i++) {
            setProgress((i/ranges.length)*100, `RANGE ${i+1}`);
            const r = ranges[i];
            const idxs = [];
            for(let j=r.start-1; j<=r.end-1; j++) idxs.push(j);
            const bytes = await extract(idxs);
            
            // Phase 5: Custom Name
            let name = state.splitNames.get(i);
            if(!name) name = `range_${i+1}`;
            if(!name.toLowerCase().endsWith('.pdf')) name += '.pdf';
            zip.file(name, bytes);
        }
        state.resultName = state.exportSettings.filename ? `${state.exportSettings.filename}.zip` : file.name.replace(/\.pdf$/i, '_ranges.zip');
    }
    
    setProgress(100, "ZIPPING...");
    state.resultBlob = await zip.generateAsync({type: 'blob'});
}

async function execPdfToImg(file) {
    if(typeof pdfjsLib === 'undefined') throw new Error("Lib missing");
    let pdf = state.pdfImgDoc;
    if(!pdf) {
        const buf = await file.arrayBuffer();
        pdf = await pdfjsLib.getDocument({data: buf}).promise;
    }
    const zip = new JSZip();
    const pages = Array.from(state.pdfImgSelectedPages).sort((a,b)=>a-b);
    const scale = Math.max(2, window.devicePixelRatio || 1); // Good quality
    
    for(let i=0; i<pages.length; i++) {
        const pNum = pages[i];
        setProgress((i/pages.length)*100, `RENDER PAGE ${pNum}`);
        const page = await pdf.getPage(pNum);
        const vp = page.getViewport({scale});
        const cvs = document.createElement('canvas');
        cvs.width = vp.width; cvs.height = vp.height;
        await page.render({canvasContext: cvs.getContext('2d'), viewport: vp}).promise;
        const blob = await new Promise(r => cvs.toBlob(r, 'image/png'));
        
        // Phase 5: Custom Name
        let name = state.pdfImgNames.get(pNum);
        if(!name) name = `page_${pNum}`;
        if(!name.toLowerCase().endsWith('.png')) name += '.png';
        zip.file(name, blob);
        
        page.cleanup();
    }
    setProgress(100, "ZIPPING...");
    state.resultBlob = await zip.generateAsync({type:'blob'});
    state.resultName = state.exportSettings.filename ? `${state.exportSettings.filename}.zip` : file.name.replace(/\.pdf$/i, '_images.zip');
}

// --- Result Preview ---
async function renderFinalResultPreview(blob, tool) {
    DOM.resultPreviewCanvas.classList.add('hidden');
    DOM.resultGrid.classList.add('hidden');
    DOM.resultList.classList.add('hidden');
    DOM.resultZipInfo.classList.add('hidden');

    if (blob.type === 'application/pdf') {
        DOM.resultPreviewCanvas.classList.remove('hidden');
        const buf = await blob.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({data: buf}).promise;
        const page = await pdf.getPage(1);
        const vp = page.getViewport({scale: 1});
        const scale = Math.min(600/vp.width, 1.5);
        const scaledVp = page.getViewport({scale});
        const ctx = DOM.resultPreviewCanvas.getContext('2d');
        DOM.resultPreviewCanvas.width = scaledVp.width;
        DOM.resultPreviewCanvas.height = scaledVp.height;
        await page.render({canvasContext: ctx, viewport: scaledVp}).promise;
    } else {
        // Zip
        const zip = await JSZip.loadAsync(blob);
        if (tool === 'pdf2img') {
            DOM.resultGrid.classList.remove('hidden');
            let count = 0;
            DOM.resultGrid.innerHTML = '';
            zip.forEach((path, entry) => {
                if(count < 8 && !entry.dir && entry.name.match(/\.png$/i)) {
                    entry.async('blob').then(b => {
                        const img = document.createElement('img');
                        img.className = 'result-thumb';
                        img.src = URL.createObjectURL(b);
                        DOM.resultGrid.appendChild(img);
                    });
                    count++;
                }
            });
            DOM.resultZipInfo.classList.remove('hidden');
            DOM.resultZipName.innerText = `${Object.keys(zip.files).length} IMAGES`;
        } else {
            DOM.resultList.classList.remove('hidden');
            DOM.resultList.innerHTML = '';
            Object.keys(zip.files).forEach(f => {
                if(!zip.files[f].dir) {
                    const div = document.createElement('div');
                    div.className = 'result-file-item';
                    div.innerText = f;
                    DOM.resultList.appendChild(div);
                }
            });
            DOM.resultZipInfo.classList.remove('hidden');
            DOM.resultZipName.innerText = state.resultName;
        }
    }
}

function handleError(e) {
    console.error(e);
    alert("Error: " + e.message);
    setViewState('tool');
}

init();