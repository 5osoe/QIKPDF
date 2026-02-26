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
    imgFiles:[] // Array for image reordering
};

const toolConfig = {
    'pdf2img': { title: 'PDF \u2192 IMG', accept: 'application/pdf', multiple: false },
    'img2pdf': { title: 'IMG \u2192 PDF', accept: 'image/png, image/jpeg', multiple: true },
    'merge': { title: 'MERGE', accept: 'application/pdf', multiple: true },
    'split': { title: 'SPLIT', accept: 'application/pdf', multiple: false },
    'rotate': { title: 'ROTATE', accept: 'application/pdf', multiple: false }
};

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
    state.imgFiles =[];
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
    if (!toolConfig[state.currentTool].multiple && fileArr.length > 1) {
        fileArr.length = 1;
    }
    
    state.resultBlob = null;
    state.resultName = '';
    DOM.resultContainer.classList.add('hidden');

    // If IMG -> PDF, send to reorder UI instead of immediate processing
    if (state.currentTool === 'img2pdf') {
        state.imgFiles = state.imgFiles.concat(fileArr);
        renderImgReorderUI();
        return; 
    }

    DOM.dropZone.classList.add('hidden');
    DOM.progressContainer.classList.remove('hidden');
    
    processFiles(fileArr).catch(e => {
        console.error(e);
        DOM.statusText.innerText = ">> ERROR";
        DOM.dropZone.classList.remove('hidden');
        DOM.fileInput.value = '';
    });
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

        // Drag Handle
        const dragHandle = document.createElement('div');
        dragHandle.innerText = '::';
        dragHandle.style.color = 'var(--border)';
        dragHandle.style.fontWeight = 'bold';
        
        // Index
        const idxStr = String(index + 1).padStart(2, '0');
        const idx = document.createElement('span');
        idx.innerText = `[${idxStr}]`;
        idx.style.color = 'var(--accent)';

        // Thumbnail
        const thumb = document.createElement('img');
        thumb.src = URL.createObjectURL(file);
        thumb.style.width = '32px';
        thumb.style.height = '32px';
        thumb.style.objectFit = 'cover';
        thumb.style.border = '1px solid var(--border)';

        // Filename
        const name = document.createElement('span');
        name.innerText = file.name;
        name.style.flex = '1';
        name.style.overflow = 'hidden';
        name.style.textOverflow = 'ellipsis';
        name.style.whiteSpace = 'nowrap';

        // Remove Button
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
        processFiles(state.imgFiles).catch(console.error);
    };

    const btnClear = document.createElement('button');
    btnClear.innerText = 'CLEAR ALL';
    btnClear.style.border = '1px solid var(--border)';
    btnClear.style.padding = '12px 24px';
    btnClear.style.transition = '120ms linear';
    btnClear.onmouseover = () => { btnClear.style.backgroundColor = 'var(--border)'; };
    btnClear.onmouseout = () => { btnClear.style.backgroundColor = 'transparent'; };
    btnClear.onclick = () => {
        state.imgFiles =[];
        renderImgReorderUI();
    };

    actions.appendChild(btnClear);
    actions.appendChild(btnProcess);

    container.appendChild(list);
    container.appendChild(actions);
}

// --- File Processing ---
function setProgress(percent, msg = "PROCESSING...") {
    const total = 14;
    const filled = Math.min(total, Math.max(0, Math.round((percent / 100) * total)));
    const bar = '[' + '█'.repeat(filled) + '░'.repeat(total - filled) + ']';
    DOM.asciiProgress.innerText = bar;
    DOM.statusText.innerText = msg;
}

async function processFiles(files) {
    const tool = state.currentTool;
    if (tool === 'pdf2img') await execPdfToImg(files[0]);
    else if (tool === 'img2pdf') await execImgToPdf(files);
    else if (tool === 'merge') await execMerge(files);
    else if (tool === 'split') await execSplit(files[0]);
    else if (tool === 'rotate') await execRotate(files[0]);

    DOM.progressContainer.classList.add('hidden');
    DOM.resultContainer.classList.remove('hidden');
    
    // Always keep drop zone visible after process for better UX (add new files without going back)
    DOM.dropZone.classList.remove('hidden'); 
    DOM.fileInput.value = '';
    
    // Re-show reorder list if in img2pdf so user can rearrange or download again
    if (tool === 'img2pdf') {
        DOM.imgReorderContainer.classList.remove('hidden');
    }
}

async function execPdfToImg(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({data: arrayBuffer}).promise;
    const zip = new JSZip();
    
    // High Quality Export
    const scale = Math.max(4, window.devicePixelRatio || 1);
    
    for (let i = 1; i <= pdf.numPages; i++) {
        setProgress((i / pdf.numPages) * 100, `EXTRACTING PAGE ${i}/${pdf.numPages}...`);
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({scale});
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({canvasContext: ctx, viewport}).promise;
        
        const base64 = canvas.toDataURL('image/png').split(',')[1];
        zip.file(`page_${i}.png`, base64, {base64: true});
        
        page.cleanup();
        canvas.width = 0;
        canvas.height = 0;
    }
    
    state.resultBlob = await zip.generateAsync({type: 'blob'});
    state.resultName = file.name.replace(/\.pdf$/i, '_images.zip');
}

async function execImgToPdf(files) {
    const { PDFDocument } = PDFLib;
    const pdfDoc = await PDFDocument.create();
    
    for (let i = 0; i < files.length; i++) {
        setProgress((i / files.length) * 100, `ADDING IMAGE ${i+1}/${files.length}...`);
        const file = files[i];
        const arrayBuffer = await file.arrayBuffer();
        let image;
        
        if (file.type === 'image/jpeg') image = await pdfDoc.embedJpg(arrayBuffer);
        else if (file.type === 'image/png') image = await pdfDoc.embedPng(arrayBuffer);
        else continue;
        
        // Match exact natural dimensions
        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
    }
    
    const pdfBytes = await pdfDoc.save();
    state.resultBlob = new Blob([pdfBytes], { type: 'application/pdf' });
    state.resultName = 'images_merged.pdf';
}

async function execMerge(files) {
    const { PDFDocument } = PDFLib;
    const mergedPdf = await PDFDocument.create();
    
    for (let i = 0; i < files.length; i++) {
        setProgress((i / files.length) * 100, `MERGING FILE ${i+1}/${files.length}...`);
        const arrayBuffer = await files[i].arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        
        // Lossless Direct Copy
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach(page => mergedPdf.addPage(page));
    }
    
    const pdfBytes = await mergedPdf.save();
    state.resultBlob = new Blob([pdfBytes], { type: 'application/pdf' });
    state.resultName = 'merged_document.pdf';
}

async function execSplit(file) {
    const { PDFDocument } = PDFLib;
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const zip = new JSZip();
    const numPages = pdf.getPageCount();
    
    for (let i = 0; i < numPages; i++) {
        setProgress((i / numPages) * 100, `SPLITTING PAGE ${i+1}/${numPages}...`);
        const newPdf = await PDFDocument.create();
        const [copiedPage] = await newPdf.copyPages(pdf, [i]);
        newPdf.addPage(copiedPage);
        const pdfBytes = await newPdf.save();
        zip.file(`page_${i + 1}.pdf`, pdfBytes);
    }
    
    state.resultBlob = await zip.generateAsync({type: 'blob'});
    state.resultName = file.name.replace(/\.pdf$/i, '_split.zip');
}

async function execRotate(file) {
    const { PDFDocument, degrees } = PDFLib;
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const pages = pdf.getPages();
    
    pages.forEach((page, i) => {
        setProgress((i / pages.length) * 100, `ROTATING PAGE ${i+1}/${pages.length}...`);
        const rotation = page.getRotation().angle;
        page.setRotation(degrees(rotation + 90));
    });
    
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
    URL.revokeObjectURL(url);
});

init();