pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const DOM = {
    themeToggle: document.getElementById('theme-toggle'),
    logoHome: document.getElementById('logo-home'),
    mainView: document.getElementById('main-view'),
    toolView: document.getElementById('tool-view'),
    toolCards: document.querySelectorAll('.tool-card'),
    toolTitle: document.getElementById('tool-title'),
    btnBack: document.getElementById('btn-back'),
    dropZone: document.getElementById('drop-zone'),
    fileInput: document.getElementById('file-input'),
    imgReorderContainer: document.getElementById('img-reorder-container'),
    progressContainer: document.getElementById('progress-container'),
    asciiProgress: document.getElementById('ascii-progress'),
    statusText: document.getElementById('status-text'),
    resultContainer: document.getElementById('result-container'),
    btnDownload: document.getElementById('btn-download')
};

let state = {
    theme: localStorage.getItem('theme') || 'dark',
    currentTool: null,
    resultBlob: null,
    resultName: '',
    imgFiles: [] 
};

const toolConfig = {
    'pdf2img': { title: 'PDF \u2192 IMG', accept: 'application/pdf', multiple: false },
    'img2pdf': { title: 'IMG \u2192 PDF', accept: 'image/png, image/jpeg', multiple: true },
    'merge': { title: 'MERGE', accept: 'application/pdf', multiple: true },
    'split': { title: 'SPLIT', accept: 'application/pdf', multiple: false },
    'rotate': { title: 'ROTATE', accept: 'application/pdf', multiple: false }
};

// --- Utils ---

// Non-blocking yield to allow UI updates
const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 0));

function init() {
    setTheme(state.theme);
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js').catch(console.error);
    }
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    state.theme = theme;
    DOM.themeToggle.innerText = `MODE: ${theme.toUpperCase()}`;
}

DOM.themeToggle.addEventListener('click', () => {
    setTheme(state.theme === 'dark' ? 'light' : 'dark');
});

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
        state.currentTool = tool;
        DOM.toolTitle.innerText = toolConfig[tool].title;
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
    DOM.imgReorderContainer.classList.add('hidden');
    DOM.fileInput.value = '';
    state.resultBlob = null;
    state.resultName = '';
    state.imgFiles = [];
    setProgress(0);
}

DOM.dropZone.addEventListener('click', () => DOM.fileInput.click());
DOM.dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    DOM.dropZone.classList.add('dragover');
});
DOM.dropZone.addEventListener('dragleave', () => DOM.dropZone.classList.remove('dragover'));
DOM.dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    DOM.dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
});
DOM.fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) handleFiles(e.target.files);
});

function handleFiles(files) {
    const fileArr = Array.from(files);
    
    // Enforce Single File limit for specific tools
    if (!toolConfig[state.currentTool].multiple && fileArr.length > 1) {
        fileArr.length = 1; 
    }
    
    state.resultBlob = null;
    state.resultName = '';
    DOM.resultContainer.classList.add('hidden');

    // Special flow for IMG -> PDF (Reorder UI)
    if (state.currentTool === 'img2pdf') {
        state.imgFiles = state.imgFiles.concat(fileArr);
        renderImgReorderUI();
        return; 
    }

    DOM.dropZone.classList.add('hidden');
    DOM.progressContainer.classList.remove('hidden');
    
    // Small delay to ensure UI renders "Processing" before heavy work starts
    setTimeout(() => {
        processFiles(fileArr).catch(handleError);
    }, 50);
}

function handleError(e) {
    console.error(e);
    DOM.statusText.innerText = `>> ERROR: ${e.message || "UNKNOWN"}`;
    DOM.asciiProgress.innerText = "[!! ERROR !!]";
    
    // Allow retry
    setTimeout(() => {
        DOM.dropZone.classList.remove('hidden');
        DOM.fileInput.value = '';
    }, 1000);
}

// --- Image Reordering UI Logic ---
let dragStartIndex = -1;

function renderImgReorderUI() {
    const container = DOM.imgReorderContainer;
    container.innerHTML = '';
    
    if (state.imgFiles.length === 0) {
        container.classList.add('hidden');
        return;
    }
    
    container.classList.remove('hidden');
    container.style.marginTop = '24px';
    container.style.marginBottom = '24px';

    const list = document.createElement('div');
    list.style.display = 'flex';
    list.style.flexDirection = 'column';
    list.style.gap = '8px';
    list.style.marginBottom = '24px';

    state.imgFiles.forEach((file, index) => {
        const item = document.createElement('div');
        item.draggable = true;
        item.style.border = '1px solid var(--border)';
        item.style.backgroundColor = 'var(--surface)';
        item.style.padding = '12px 16px';
        item.style.display = 'flex';
        item.style.alignItems = 'center';
        item.style.gap = '16px';
        item.style.cursor = 'grab';
        item.style.transition = 'all 120ms linear';

        // Drag events
        item.addEventListener('dragstart', (e) => {
            dragStartIndex = index;
            item.style.opacity = '0.4';
            e.dataTransfer.effectAllowed = 'move';
        });
        item.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });
        item.addEventListener('dragenter', (e) => {
            e.preventDefault();
            item.style.borderColor = 'var(--accent)';
        });
        item.addEventListener('dragleave', () => {
            item.style.borderColor = 'var(--border)';
        });
        item.addEventListener('drop', (e) => {
            e.preventDefault();
            item.style.borderColor = 'var(--border)';
            if (dragStartIndex > -1 && dragStartIndex !== index) {
                const movedFile = state.imgFiles.splice(dragStartIndex, 1)[0];
                state.imgFiles.splice(index, 0, movedFile);
                renderImgReorderUI();
            }
        });
        item.addEventListener('dragend', () => {
            item.style.opacity = '1';
            dragStartIndex = -1;
        });

        // Content
        const dragHandle = document.createElement('div');
        dragHandle.innerText = '::';
        dragHandle.style.color = 'var(--border)';
        dragHandle.style.fontWeight = 'bold';
        
        const idxStr = String(index + 1).padStart(2, '0');
        const idx = document.createElement('span');
        idx.innerText = `[${idxStr}]`;
        idx.style.color = 'var(--accent)';

        const thumb = document.createElement('img');
        thumb.src = URL.createObjectURL(file);
        thumb.style.width = '32px';
        thumb.style.height = '32px';
        thumb.style.objectFit = 'cover';
        thumb.style.border = '1px solid var(--border)';

        const name = document.createElement('span');
        name.innerText = file.name;
        name.style.flex = '1';
        name.style.overflow = 'hidden';
        name.style.textOverflow = 'ellipsis';
        name.style.whiteSpace = 'nowrap';

        const removeBtn = document.createElement('button');
        removeBtn.innerText = 'X';
        removeBtn.style.border = '1px solid var(--border)';
        removeBtn.style.padding = '4px 8px';
        removeBtn.style.transition = '120ms linear';
        removeBtn.onmouseover = () => { removeBtn.style.backgroundColor = 'var(--accent)'; removeBtn.style.color = '#000'; };
        removeBtn.onmouseout = () => { removeBtn.style.backgroundColor = 'transparent'; removeBtn.style.color = 'var(--text)'; };
        removeBtn.onclick = () => {
            state.imgFiles.splice(index, 1);
            renderImgReorderUI();
        };

        item.appendChild(dragHandle);
        item.appendChild(idx);
        item.appendChild(thumb);
        item.appendChild(name);
        item.appendChild(removeBtn);
        list.appendChild(item);
    });

    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.gap = '16px';

    const btnProcess = document.createElement('button');
    btnProcess.innerText = 'PROCESS PDF';
    btnProcess.style.border = '1px solid var(--accent)';
    btnProcess.style.color = 'var(--accent)';
    btnProcess.style.padding = '12px 24px';
    btnProcess.style.flex = '1';
    btnProcess.style.transition = '120ms linear';
    btnProcess.onmouseover = () => { btnProcess.style.backgroundColor = 'var(--accent)'; btnProcess.style.color = '#000'; };
    btnProcess.onmouseout = () => { btnProcess.style.backgroundColor = 'transparent'; btnProcess.style.color = 'var(--accent)'; };
    btnProcess.onclick = () => {
        DOM.imgReorderContainer.classList.add('hidden');
        DOM.dropZone.classList.add('hidden');
        DOM.progressContainer.classList.remove('hidden');
        processFiles(state.imgFiles).catch(handleError);
    };

    const btnClear = document.createElement('button');
    btnClear.innerText = 'CLEAR ALL';
    btnClear.style.border = '1px solid var(--border)';
    btnClear.style.padding = '12px 24px';
    btnClear.style.transition = '120ms linear';
    btnClear.onmouseover = () => { btnClear.style.backgroundColor = 'var(--border)'; };
    btnClear.onmouseout = () => { btnClear.style.backgroundColor = 'transparent'; };
    btnClear.onclick = () => {
        state.imgFiles = [];
        renderImgReorderUI();
    };

    actions.appendChild(btnClear);
    actions.appendChild(btnProcess);

    container.appendChild(list);
    container.appendChild(actions);
}

// --- File Processing Engine ---

function setProgress(percent, msg = "PROCESSING...") {
    const safePercent = Math.min(100, Math.max(0, Math.round(percent)));
    const totalChars = 14;
    const filled = Math.round((safePercent / 100) * totalChars);
    const empty = totalChars - filled;
    
    // [████░░░░] 45%
    const bar = `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${safePercent}%`;
    
    DOM.asciiProgress.innerText = bar;
    if (msg) DOM.statusText.innerText = msg;
}

async function processFiles(files) {
    if (!files || files.length === 0) throw new Error("NO FILES SELECTED");

    const tool = state.currentTool;
    
    try {
        if (tool === 'pdf2img') await execPdfToImg(files[0]);
        else if (tool === 'img2pdf') await execImgToPdf(files);
        else if (tool === 'merge') await execMerge(files);
        else if (tool === 'split') await execSplit(files[0]);
        else if (tool === 'rotate') await execRotate(files[0]);
        
        DOM.progressContainer.classList.add('hidden');
        DOM.resultContainer.classList.remove('hidden');
        
        // UX: Keep drop zone visible for next action
        DOM.dropZone.classList.remove('hidden'); 
        DOM.fileInput.value = '';
        
        // If Img2PDF, show list again to allow re-ordering without reloading
        if (tool === 'img2pdf') {
            DOM.imgReorderContainer.classList.remove('hidden');
        }
    } catch (err) {
        handleError(err);
    }
}

async function execPdfToImg(file) {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({data: arrayBuffer});
    const pdf = await loadingTask.promise;
    const zip = new JSZip();
    
    // High Quality Export
    const scale = Math.max(3, window.devicePixelRatio || 1);
    const total = pdf.numPages;

    for (let i = 1; i <= total; i++) {
        // Yield to update UI
        await yieldToMain();
        setProgress(((i - 1) / total) * 100, `EXTRACTING PAGE ${i}/${total}...`);

        const page = await pdf.getPage(i);
        const viewport = page.getViewport({scale});
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { alpha: false }); // Optimize for non-transparent
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
            canvasContext: ctx, 
            viewport,
            intent: 'print' // Rendering intent optimization
        }).promise;
        
        // Memory Optimization: usage of toBlob instead of toDataURL
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        zip.file(`page_${String(i).padStart(3, '0')}.png`, blob);
        
        // Strict Cleanup
        page.cleanup();
        canvas.width = 0;
        canvas.height = 0;
    }

    setProgress(100, "COMPRESSING ZIP...");
    await yieldToMain();

    state.resultBlob = await zip.generateAsync({type: 'blob'});
    state.resultName = file.name.replace(/\.pdf$/i, '_images.zip');
    
    // Cleanup PDF Doc
    loadingTask.destroy();
}

async function execImgToPdf(files) {
    const { PDFDocument } = PDFLib;
    const pdfDoc = await PDFDocument.create();
    const total = files.length;
    
    for (let i = 0; i < total; i++) {
        await yieldToMain();
        setProgress((i / total) * 100, `ADDING IMAGE ${i+1}/${total}...`);
        
        const file = files[i];
        const arrayBuffer = await file.arrayBuffer();
        let image;
        
        try {
            if (file.type === 'image/jpeg' || file.name.match(/\.(jpg|jpeg)$/i)) {
                image = await pdfDoc.embedJpg(arrayBuffer);
            } else if (file.type === 'image/png' || file.name.match(/\.png$/i)) {
                image = await pdfDoc.embedPng(arrayBuffer);
            } else {
                continue; // Skip unsupported
            }
            
            const page = pdfDoc.addPage([image.width, image.height]);
            page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
            
        } catch (e) {
            console.warn(`Skipping invalid image: ${file.name}`, e);
        }
    }
    
    setProgress(100, "SAVING PDF...");
    await yieldToMain();
    
    const pdfBytes = await pdfDoc.save();
    state.resultBlob = new Blob([pdfBytes], { type: 'application/pdf' });
    state.resultName = 'images_merged.pdf';
}

async function execMerge(files) {
    const { PDFDocument } = PDFLib;
    const mergedPdf = await PDFDocument.create();
    const total = files.length;
    
    for (let i = 0; i < total; i++) {
        await yieldToMain();
        setProgress((i / total) * 100, `MERGING FILE ${i+1}/${total}...`);
        
        const arrayBuffer = await files[i].arrayBuffer();
        
        // Load with minimal parsing for speed
        const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach(page => mergedPdf.addPage(page));
    }
    
    setProgress(100, "SAVING MERGED PDF...");
    await yieldToMain();
    
    const pdfBytes = await mergedPdf.save();
    state.resultBlob = new Blob([pdfBytes], { type: 'application/pdf' });
    state.resultName = 'merged_document.pdf';
}

async function execSplit(file) {
    const { PDFDocument } = PDFLib;
    const arrayBuffer = await file.arrayBuffer();
    
    setProgress(0, "LOADING PDF...");
    await yieldToMain();
    
    const pdf = await PDFDocument.load(arrayBuffer);
    const zip = new JSZip();
    const numPages = pdf.getPageCount();
    
    for (let i = 0; i < numPages; i++) {
        await yieldToMain();
        setProgress((i / numPages) * 100, `SPLITTING PAGE ${i+1}/${numPages}...`);
        
        const newPdf = await PDFDocument.create();
        const [copiedPage] = await newPdf.copyPages(pdf, [i]);
        newPdf.addPage(copiedPage);
        
        const pdfBytes = await newPdf.save();
        zip.file(`page_${String(i + 1).padStart(3, '0')}.pdf`, pdfBytes);
    }
    
    setProgress(100, "ZIPPING FILES...");
    await yieldToMain();
    
    state.resultBlob = await zip.generateAsync({type: 'blob'});
    state.resultName = file.name.replace(/\.pdf$/i, '_split.zip');
}

async function execRotate(file) {
    const { PDFDocument, degrees } = PDFLib;
    
    setProgress(0, "LOADING PDF...");
    await yieldToMain();

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const pages = pdf.getPages();
    const total = pages.length;
    
    for (let i = 0; i < total; i++) {
        // Rotation is fast, but yield every 5 pages for large docs
        if (i % 5 === 0) {
            await yieldToMain();
            setProgress((i / total) * 100, `ROTATING PAGE ${i+1}/${total}...`);
        }
        
        const page = pages[i];
        const rotation = page.getRotation().angle;
        page.setRotation(degrees(rotation + 90));
    }
    
    setProgress(100, "SAVING PDF...");
    await yieldToMain();
    
    const pdfBytes = await pdf.save();
    state.resultBlob = new Blob([pdfBytes], { type: 'application/pdf' });
    state.resultName = file.name.replace(/\.pdf$/i, '_rotated.pdf');
}

DOM.btnDownload.addEventListener('click', () => {
    if (!state.resultBlob) return;
    const url = URL.createObjectURL(state.resultBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = state.resultName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Revoke after delay to ensure download starts
    setTimeout(() => URL.revokeObjectURL(url), 1000);
});

init();