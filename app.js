// --- INIT & CONFIG ---
if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

document.addEventListener("DOMContentLoaded", () => {
    const intro = document.getElementById("intro-screen");
    if (intro) setTimeout(() => intro.remove(), 500); // Small delay for smoothness
    initApp();
});

const DOM = {
    // Nav
    mainView: document.getElementById('main-view'),
    toolView: document.getElementById('tool-view'),
    toolCards: document.querySelectorAll('.tool-card'),
    btnBack: document.getElementById('btn-back'),
    toolTitleText: document.getElementById('tool-title-text'),
    
    // UI Containers
    editingUi: document.getElementById('editing-ui'),
    resultContainer: document.getElementById('result-container'),
    progressContainer: document.getElementById('progress-container'),
    
    // Inputs
    dropZone: document.getElementById('drop-zone'),
    fileInput: document.getElementById('file-input'),
    reorderContainer: document.getElementById('reorder-container'),
    
    // Action Buttons
    globalActions: document.getElementById('global-actions'),
    btnProcess: document.getElementById('btn-process'),
    btnEditResult: document.getElementById('btn-edit-result'),
    btnDownloadAction: document.getElementById('btn-download-action'),
    btnClearResult: document.getElementById('btn-clear-result'),
    
    // Status
    asciiProgress: document.getElementById('ascii-progress'),
    statusText: document.getElementById('status-text'),
    
    // Result
    resultListWrapper: document.getElementById('result-list-wrapper'),
    resultZipInfo: document.getElementById('result-zip-info'),
    resultZipName: document.getElementById('result-zip-name'),

    // Tools
    pdf2ImgUi: document.getElementById('pdf2img-ui'),
    pdfGrid: document.getElementById('pdf-grid'),
    rotateUi: document.getElementById('rotate-ui'),
    rotateFilename: document.getElementById('rotate-filename'),
    rotateBtns: document.querySelectorAll('.rotate-btn'),
    splitUi: document.getElementById('split-ui'),
    splitFilename: document.getElementById('split-filename'),
    splitPageCount: document.getElementById('split-pagecount'),
    splitRangesContainer: document.getElementById('split-ranges-container'),
    splitRangeCount: document.getElementById('split-range-count'),
    
    // Modals
    exportModal: document.getElementById('export-modal'),
    exportFilename: document.getElementById('export-filename'),
    btnExportConfirm: document.getElementById('btn-export-confirm'),
    btnExportCancel: document.getElementById('btn-export-cancel'),
    
    previewModal: document.getElementById('preview-modal'),
    previewImage: document.getElementById('preview-image'),
    previewPdfContainer: document.getElementById('preview-pdf-container'),
    pdfCanvas: document.getElementById('pdf-canvas'),
    btnPreviewClose: document.getElementById('btn-preview-close'),
    
    infoModal: document.getElementById('info-modal'),
    btnInfo: document.getElementById('btn-info'),
    btnAbout: document.getElementById('btn-about')
};

// State
let state = {
    tool: null,
    sourceFile: null,
    imgFiles: [],
    mergeFiles: [],
    resultBlob: null,
    resultName: '',
    
    // Tool Specific
    rotateAngle: 90,
    splitMode: 'all',
    splitRanges: [],
    pdfDoc: null, // For Split/PDF2IMG
    pdfSelectedPages: new Set(),
    
    // Export
    exportName: ''
};

const UrlManager = {
    urls: new Set(),
    create(obj) {
        const url = URL.createObjectURL(obj);
        this.urls.add(url);
        return url;
    },
    revokeAll() {
        this.urls.forEach(u => URL.revokeObjectURL(u));
        this.urls.clear();
    }
};

const toolConfig = {
    'pdf2img': { title: 'PDF \u2192 IMG', accept: 'application/pdf', multiple: false },
    'img2pdf': { title: 'IMG \u2192 PDF', accept: 'image/png, image/jpeg', multiple: true },
    'merge': { title: 'MERGE', accept: 'application/pdf', multiple: true },
    'split': { title: 'SPLIT', accept: 'application/pdf', multiple: false },
    'rotate': { title: 'ROTATE', accept: 'application/pdf', multiple: false }
};

// --- INITIALIZATION ---
function initApp() {
    setupNavigation();
    setupModals();
    setupDragDrop();
    setupToolLogic();
}

function setupNavigation() {
    DOM.toolCards.forEach(card => {
        card.addEventListener('click', () => {
            const tool = card.getAttribute('data-tool');
            openTool(tool);
        });
    });
    
    DOM.btnBack.addEventListener('click', closeTool);
    DOM.logoHome.addEventListener('click', closeTool);
    DOM.btnEditResult.addEventListener('click', enterEditMode);
    DOM.btnClearResult.addEventListener('click', resetTool);
}

function openTool(toolName) {
    state.tool = toolName;
    DOM.toolTitleText.innerText = toolConfig[toolName].title;
    DOM.fileInput.accept = toolConfig[toolName].accept;
    DOM.fileInput.multiple = toolConfig[toolName].multiple;
    
    DOM.mainView.classList.add('hidden');
    DOM.toolView.classList.remove('hidden');
    resetTool();
}

function closeTool() {
    DOM.toolView.classList.add('hidden');
    DOM.mainView.classList.remove('hidden');
    resetTool();
}

function resetTool() {
    // Clear State
    state.sourceFile = null;
    state.imgFiles = [];
    state.mergeFiles = [];
    state.resultBlob = null;
    state.rotateAngle = 90;
    state.splitRanges = [];
    state.pdfSelectedPages.clear();
    
    if (state.pdfDoc) { state.pdfDoc.destroy(); state.pdfDoc = null; }
    UrlManager.revokeAll();
    
    // Clear UI
    DOM.fileInput.value = '';
    DOM.reorderContainer.innerHTML = '';
    DOM.pdfGrid.innerHTML = '';
    DOM.dropZone.classList.remove('hidden');
    DOM.reorderContainer.classList.add('hidden');
    DOM.pdf2ImgUi.classList.add('hidden');
    DOM.rotateUi.classList.add('hidden');
    DOM.splitUi.classList.add('hidden');
    
    // Reset specific tool UI
    DOM.rotateBtns.forEach(b => b.classList.remove('selected'));
    
    enterEditMode();
}

// --- MODES ---
function enterEditMode() {
    DOM.resultContainer.classList.add('hidden');
    DOM.progressContainer.classList.add('hidden');
    DOM.editingUi.classList.remove('hidden');
    
    DOM.btnProcess.classList.remove('hidden');
    DOM.btnProcess.innerText = "PROCESS PDF";
    DOM.btnProcess.disabled = false;
    
    DOM.btnEditResult.classList.add('hidden');
    DOM.btnDownloadAction.classList.add('hidden');
    DOM.btnClearResult.classList.add('hidden');
    DOM.globalActions.classList.remove('disabled-ui');
    DOM.globalActions.classList.remove('hidden'); // Ensure footer shows
}

function enterResultMode() {
    DOM.editingUi.classList.add('hidden');
    DOM.progressContainer.classList.add('hidden');
    DOM.resultContainer.classList.remove('hidden');
    
    DOM.btnProcess.classList.add('hidden');
    DOM.btnEditResult.classList.remove('hidden');
    DOM.btnDownloadAction.classList.remove('hidden');
    DOM.btnClearResult.classList.remove('hidden');
    DOM.btnDownloadAction.disabled = false;
}

// --- FILE HANDLING & DRAG DROP ---
function setupDragDrop() {
    DOM.dropZone.addEventListener('click', () => DOM.fileInput.click());
    DOM.fileInput.addEventListener('change', (e) => handleFiles(e.target.files));
    
    DOM.dropZone.addEventListener('dragover', (e) => { e.preventDefault(); DOM.dropZone.classList.add('dragover'); });
    DOM.dropZone.addEventListener('dragleave', () => DOM.dropZone.classList.remove('dragover'));
    DOM.dropZone.addEventListener('drop', (e) => {
        e.preventDefault(); DOM.dropZone.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });
}

function handleFiles(files) {
    const fileList = Array.from(files);
    if (!fileList.length) return;
    
    if (!toolConfig[state.tool].multiple && fileList.length > 1) {
        fileList.length = 1; // Take only first
    }
    
    // Logic based on tool
    if (state.tool === 'img2pdf') {
        state.imgFiles = state.imgFiles.concat(fileList);
        renderReorderList(state.imgFiles);
    } else if (state.tool === 'merge') {
        state.mergeFiles = state.mergeFiles.concat(fileList);
        renderReorderList(state.mergeFiles);
    } else {
        // Single file tools
        state.sourceFile = fileList[0];
        initSingleFileTool(state.sourceFile);
    }
}

// --- TOOL SPECIFIC UI INITIALIZATION ---
async function initSingleFileTool(file) {
    DOM.dropZone.classList.add('hidden');
    
    if (state.tool === 'rotate') {
        DOM.rotateUi.classList.remove('hidden');
        DOM.rotateFilename.innerText = file.name;
    } 
    else if (state.tool === 'split') {
        DOM.splitUi.classList.remove('hidden');
        DOM.splitFilename.innerText = file.name;
        DOM.splitPageCount.innerText = "LOADING...";
        
        try {
            const ab = await file.arrayBuffer();
            state.pdfDoc = await pdfjsLib.getDocument(ab).promise;
            DOM.splitPageCount.innerText = state.pdfDoc.numPages + " PAGES";
        } catch(e) {
            console.error(e);
            alert("Invalid PDF");
            resetTool();
        }
    }
    else if (state.tool === 'pdf2img') {
        DOM.pdf2ImgUi.classList.remove('hidden');
        renderPdfGrid(file);
    }
}

// --- REORDER UI (Merge/Img2Pdf) ---
function renderReorderList(files) {
    if (files.length === 0) {
        DOM.reorderContainer.classList.add('hidden');
        DOM.dropZone.classList.remove('hidden');
        return;
    }
    
    DOM.dropZone.classList.add('hidden');
    DOM.reorderContainer.classList.remove('hidden');
    DOM.reorderContainer.innerHTML = '';
    
    const list = document.createElement('div');
    list.className = 'reorder-list';
    
    files.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'reorder-item';
        item.draggable = true;
        item.innerHTML = `
            <div class="drag-handle">::</div>
            <span style="font-size:12px;color:#16c35f">[${index+1}]</span>
            <div class="item-name">${file.name}</div>
            <button class="btn-remove">X</button>
        `;
        
        // Remove logic
        item.querySelector('.btn-remove').onclick = () => {
            files.splice(index, 1);
            renderReorderList(files);
        };
        
        // Drag Logic
        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', index);
            item.classList.add('dragging');
        });
        
        item.addEventListener('dragover', (e) => e.preventDefault());
        
        item.addEventListener('drop', (e) => {
            e.preventDefault();
            const oldIndex = parseInt(e.dataTransfer.getData('text/plain'));
            if (oldIndex !== index) {
                const moved = files.splice(oldIndex, 1)[0];
                files.splice(index, 0, moved);
                renderReorderList(files);
            }
        });
        
        item.addEventListener('dragend', () => item.classList.remove('dragging'));
        
        list.appendChild(item);
    });
    
    DOM.reorderContainer.appendChild(list);
}

// --- PDF GRID (PDF2IMG) ---
async function renderPdfGrid(file) {
    DOM.pdfGrid.innerHTML = 'Loading...';
    try {
        const ab = await file.arrayBuffer();
        state.pdfDoc = await pdfjsLib.getDocument(ab).promise;
        DOM.pdfGrid.innerHTML = '';
        
        for (let i = 1; i <= state.pdfDoc.numPages; i++) {
            const card = document.createElement('div');
            card.className = 'page-card selected';
            card.innerHTML = `
                <div class="page-canvas" id="page-thumb-${i}"></div>
                <div>PAGE ${i}</div>
            `;
            state.pdfSelectedPages.add(i);
            
            card.onclick = () => {
                if (state.pdfSelectedPages.has(i)) {
                    state.pdfSelectedPages.delete(i);
                    card.classList.remove('selected');
                } else {
                    state.pdfSelectedPages.add(i);
                    card.classList.add('selected');
                }
            };
            DOM.pdfGrid.appendChild(card);
            
            // Lazy render thumb
            state.pdfDoc.getPage(i).then(page => {
                const viewport = page.getViewport({scale: 0.2});
                const canvas = document.createElement('canvas');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                canvas.style.width = '100%';
                canvas.style.height = '100%';
                page.render({canvasContext: canvas.getContext('2d'), viewport: viewport});
                document.getElementById(`page-thumb-${i}`).appendChild(canvas);
            });
        }
    } catch(e) {
        console.error(e);
        DOM.pdfGrid.innerHTML = 'Error loading PDF';
    }
}

// --- TOOL LOGIC SETUPS ---
function setupToolLogic() {
    // Rotate Buttons
    DOM.rotateBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            DOM.rotateBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            state.rotateAngle = parseInt(btn.dataset.angle);
        });
    });

    // Split Inputs
    document.querySelectorAll('input[name="split-mode"]').forEach(r => {
        r.addEventListener('change', (e) => {
            state.splitMode = e.target.value;
            if (state.splitMode === 'custom') {
                DOM.splitCustomOptions.classList.remove('hidden');
                renderSplitRanges(1);
            } else {
                DOM.splitCustomOptions.classList.add('hidden');
            }
        });
    });

    DOM.splitRangeCount.addEventListener('input', (e) => renderSplitRanges(e.target.value));

    // PDF2Img Selectors
    document.getElementById('btn-select-all').onclick = () => {
        document.querySelectorAll('.page-card').forEach(c => c.classList.add('selected'));
        for(let i=1; i<=state.pdfDoc.numPages; i++) state.pdfSelectedPages.add(i);
    };
    document.getElementById('btn-select-none').onclick = () => {
        document.querySelectorAll('.page-card').forEach(c => c.classList.remove('selected'));
        state.pdfSelectedPages.clear();
    };
    
    // Process Button
    DOM.btnProcess.onclick = () => {
        // Simple Validation
        if (state.tool === 'img2pdf' && !state.imgFiles.length) return alert('No images selected');
        if (state.tool === 'merge' && !state.mergeFiles.length) return alert('No PDFs selected');
        if (['split','rotate','pdf2img'].includes(state.tool) && !state.sourceFile) return alert('No file loaded');
        
        // Show Export Modal
        DOM.exportFilename.value = '';
        openModal(DOM.exportModal);
    };
    
    // Confirm Process
    DOM.btnExportConfirm.onclick = async () => {
        state.exportName = DOM.exportFilename.value.trim();
        closeModal(DOM.exportModal);
        
        DOM.globalActions.classList.add('disabled-ui');
        DOM.editingUi.classList.add('hidden');
        DOM.progressContainer.classList.remove('hidden');
        DOM.btnProcess.innerText = "PROCESSING...";
        
        // Hack to let UI update
        await new Promise(r => setTimeout(r, 100));
        
        try {
            await runProcessor();
        } catch(e) {
            console.error(e);
            alert("Error: " + e.message);
            enterEditMode();
        }
    };
    
    DOM.btnDownloadAction.onclick = () => {
        if (!state.resultBlob) return;
        const a = document.createElement('a');
        a.href = UrlManager.create(state.resultBlob);
        a.download = state.resultName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };
}

function renderSplitRanges(count) {
    const container = DOM.splitRangesContainer;
    container.innerHTML = '';
    for(let i=0; i<count; i++) {
        const div = document.createElement('div');
        div.className = 'range-block';
        div.innerHTML = `
            <div style="font-size:12px;margin-bottom:4px">FILE #${i+1}</div>
            <div style="display:flex;gap:8px;align-items:center">
                <input type="number" class="input-num start" placeholder="From">
                <span>-</span>
                <input type="number" class="input-num end" placeholder="To">
            </div>
        `;
        container.appendChild(div);
    }
}

// --- PROCESSOR CORE ---
async function runProcessor() {
    const { PDFDocument, degrees } = PDFLib;
    let result = null;
    let ext = 'pdf';
    
    if (state.tool === 'img2pdf') {
        const doc = await PDFDocument.create();
        for (let file of state.imgFiles) {
            const ab = await file.arrayBuffer();
            let img;
            if (file.type.includes('png')) img = await doc.embedPng(ab);
            else img = await doc.embedJpg(ab);
            const page = doc.addPage([img.width, img.height]);
            page.drawImage(img, {x:0, y:0, width:img.width, height:img.height});
        }
        const bytes = await doc.save();
        result = new Blob([bytes], {type: 'application/pdf'});
        ext = 'pdf';
    } 
    
    else if (state.tool === 'merge') {
        const doc = await PDFDocument.create();
        for (let file of state.mergeFiles) {
            const ab = await file.arrayBuffer();
            const src = await PDFDocument.load(ab);
            const indices = src.getPageIndices();
            const copied = await doc.copyPages(src, indices);
            copied.forEach(p => doc.addPage(p));
        }
        const bytes = await doc.save();
        result = new Blob([bytes], {type: 'application/pdf'});
        ext = 'pdf';
    }
    
    else if (state.tool === 'rotate') {
        const ab = await state.sourceFile.arrayBuffer();
        const doc = await PDFDocument.load(ab);
        const pages = doc.getPages();
        pages.forEach(p => {
            p.setRotation(degrees(p.getRotation().angle + state.rotateAngle));
        });
        const bytes = await doc.save();
        result = new Blob([bytes], {type: 'application/pdf'});
        ext = 'pdf';
    }
    
    else if (state.tool === 'split') {
        const ab = await state.sourceFile.arrayBuffer();
        const srcDoc = await PDFDocument.load(ab);
        const zip = new JSZip();
        
        const ranges = [];
        if (state.splitMode === 'all') {
            for(let i=0; i<srcDoc.getPageCount(); i++) ranges.push([i]);
        } else {
            // Custom
            DOM.splitRangesContainer.querySelectorAll('.range-block').forEach(block => {
                const s = parseInt(block.querySelector('.start').value) - 1;
                const e = parseInt(block.querySelector('.end').value) - 1;
                const r = [];
                for(let k=s; k<=e; k++) r.push(k);
                ranges.push(r);
            });
        }
        
        for (let i=0; i<ranges.length; i++) {
            const newDoc = await PDFDocument.create();
            const copied = await newDoc.copyPages(srcDoc, ranges[i]);
            copied.forEach(p => newDoc.addPage(p));
            const bytes = await newDoc.save();
            zip.file(`part_${i+1}.pdf`, bytes);
        }
        
        result = await zip.generateAsync({type:'blob'});
        ext = 'zip';
    }
    
    else if (state.tool === 'pdf2img') {
        const zip = new JSZip();
        const pages = Array.from(state.pdfSelectedPages).sort((a,b)=>a-b);
        
        for (let pNum of pages) {
            const page = await state.pdfDoc.getPage(pNum);
            const viewport = page.getViewport({scale: 2}); // High DPI
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            await page.render({canvasContext: canvas.getContext('2d'), viewport}).promise;
            
            const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg'));
            zip.file(`page_${pNum}.jpg`, blob);
        }
        result = await zip.generateAsync({type:'blob'});
        ext = 'zip';
    }
    
    state.resultBlob = result;
    state.resultName = (state.exportName || 'output') + '.' + ext;
    
    renderResultList(result, ext);
    enterResultMode();
}

// --- RESULT RENDER ---
async function renderResultList(blob, ext) {
    const container = DOM.resultListWrapper;
    container.innerHTML = '';
    
    if (ext === 'pdf') {
        createResultItem(state.resultName, 'pdf', blob);
    } else {
        // Zip
        const zip = await JSZip.loadAsync(blob);
        const files = Object.keys(zip.files).filter(f => !zip.files[f].dir);
        
        // Render first 20 only to prevent lag
        for (let name of files.slice(0, 20)) {
            const isImg = name.match(/jpg|jpeg|png/i);
            const subBlob = await zip.files[name].async('blob');
            createResultItem(name, isImg ? 'img' : 'pdf', subBlob);
        }
        DOM.resultZipInfo.classList.remove('hidden');
        DOM.resultZipName.innerText = state.resultName;
    }
}

function createResultItem(name, type, blob) {
    const div = document.createElement('div');
    div.className = 'result-list-item';
    
    let thumb = '';
    if (type === 'img') {
        thumb = `<img class="result-thumb" src="${UrlManager.create(blob)}">`;
    } else {
        thumb = `<div class="result-thumb" style="display:flex;align-items:center;justify-content:center;color:#16c35f;font-weight:bold">PDF</div>`;
    }
    
    div.innerHTML = `
        ${thumb}
        <div class="result-info">
            <div class="result-filename">${name}</div>
        </div>
        <button class="btn-view">VIEW</button>
    `;
    
    div.querySelector('.btn-view').onclick = () => openViewer(blob, type, name);
    DOM.resultListWrapper.appendChild(div);
}

// --- VIEWER ---
let viewerTask = null;
async function openViewer(blob, type, name) {
    DOM.previewTitle.innerText = name;
    openModal(DOM.previewModal);
    
    if (type === 'img') {
        DOM.previewImage.src = UrlManager.create(blob);
        DOM.previewImage.classList.remove('hidden');
        DOM.previewPdfContainer.classList.add('hidden');
    } else {
        DOM.previewImage.classList.add('hidden');
        DOM.previewPdfContainer.classList.remove('hidden');
        
        const ab = await blob.arrayBuffer();
        const doc = await pdfjsLib.getDocument(ab).promise;
        const page = await doc.getPage(1);
        const viewport = page.getViewport({scale: 1});
        
        // Fit logic
        const container = document.querySelector('.canvas-wrapper');
        const scale = Math.min(container.clientWidth / viewport.width, 1.5);
        const scaledViewport = page.getViewport({scale});
        
        DOM.pdfCanvas.width = scaledViewport.width;
        DOM.pdfCanvas.height = scaledViewport.height;
        
        await page.render({canvasContext: DOM.pdfCanvas.getContext('2d'), viewport: scaledViewport}).promise;
    }
}

function cleanupViewer() {
    DOM.previewImage.src = '';
    const ctx = DOM.pdfCanvas.getContext('2d');
    ctx.clearRect(0,0, DOM.pdfCanvas.width, DOM.pdfCanvas.height);
}

// --- MODALS ---
function setupModals() {
    DOM.btnModalClose.onclick = () => DOM.infoModal.classList.add('hidden');
    DOM.btnExportCancel.onclick = () => DOM.exportModal.classList.add('hidden');
    DOM.btnExportClose.onclick = () => DOM.exportModal.classList.add('hidden');
    DOM.btnPreviewClose.onclick = () => {
        DOM.previewModal.classList.add('hidden');
        cleanupViewer();
    };
    
    DOM.btnInfo.onclick = () => {
        DOM.infoModal.classList.remove('hidden');
        DOM.modalTitle.innerText = "INFO";
        DOM.modalBody.innerText = "QIKPDF is a browser-based tool. Files are processed locally.";
    };
    
    DOM.btnAbout.onclick = DOM.btnInfo.onclick;
}

function openModal(el) {
    el.classList.remove('hidden');
}

function closeModal(el) {
    el.classList.add('hidden');
}