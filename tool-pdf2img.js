async function initPdfToImgUI(file) {
    DOM.pdfGrid.innerHTML = '';
    DOM.pdf2ImgUi.classList.remove('hidden');
    DOM.statusText.innerText = getT('processing');
    try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        state.pdfImgDoc   = await loadingTask.promise;
        const total       = state.pdfImgDoc.numPages;
        const baseName    = getBaseName(file.name);
        const fragment    = document.createDocumentFragment();
        for (let i = 1; i <= total; i++) {
            const card = document.createElement('div');
            card.className    = 'page-card selected';
            card.dataset.page = i;
            card.id           = `pdf-page-${i}`;
            const defaultName = `${baseName}_page_${i.toString().padStart(3, '0')}`;
            if (!state.pdfImgNames.has(i)) state.pdfImgNames.set(i, defaultName);
            const storedName  = state.pdfImgNames.get(i);
            card.innerHTML = `
                <div class="page-check">
                    <svg class="check-icon" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                </div>
                <div class="page-preview-box"><span class="page-loading">...</span></div>
                <div class="page-info">${i}</div>
                <input type="text" class="card-name-input" data-page="${i}">
            `;
            const input = card.querySelector('.card-name-input');
            input.value = storedName;
            input.addEventListener('click', (e) => e.stopPropagation());
            input.addEventListener('input', debounce((e) => state.pdfImgNames.set(i, e.target.value.trim()), 150));
            card.addEventListener('click', (e) => {
                if (processingLock) return;
                if (e.target.closest('.page-preview-box')) { openEditPreview(state.pdfImgDoc, 'pdf-single', i); return; }
                if (e.target === input) return;
                if (state.pdfImgSelectedPages.has(i)) { state.pdfImgSelectedPages.delete(i); card.classList.remove('selected'); }
                else { state.pdfImgSelectedPages.add(i); card.classList.add('selected'); }
            });
            state.pdfImgSelectedPages.add(i);
            fragment.appendChild(card);
        }
        DOM.pdfGrid.appendChild(fragment);
        if (state.pdfImgObserver) state.pdfImgObserver.disconnect();
        state.pdfImgObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const card    = entry.target;
                    const pageNum = parseInt(card.dataset.page);
                    loadPdfThumbnail(card, pageNum);
                    observer.unobserve(card);
                }
            });
        }, { root: DOM.pdfGrid, threshold: 0.05 });
        document.querySelectorAll('.page-card').forEach(card => state.pdfImgObserver.observe(card));
    } catch (e) { alert("Failed to load PDF."); }
}

async function loadPdfThumbnail(card, pageNum) {
    if (!state.pdfImgDoc) return;
    try {
        const page     = await state.pdfImgDoc.getPage(pageNum);
        const rotation = page.rotate || 0;
        const viewport = page.getViewport({ scale: 1.5, rotation });
        const canvas   = document.createElement('canvas');
        canvas.className = 'page-canvas';
        const ctx = canvas.getContext('2d', { alpha: false });
        canvas.width  = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: ctx, viewport }).promise;
        const previewBox = card.querySelector('.page-preview-box');
        previewBox.innerHTML = '';
        previewBox.appendChild(canvas);
        page.cleanup();
    } catch (e) {}
}

async function execPdfToImg(file) {
    if (typeof pdfjsLib === 'undefined') throw new Error("PDF Lib not loaded.");
    let pdf = state.pdfImgDoc;
    if (!pdf) {
        const arrayBuffer = await file.arrayBuffer();
        pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    }
    const zip             = new JSZip();
    const scale           = Math.max(3, window.devicePixelRatio || 1);
    const pagesToProcess  = Array.from(state.pdfImgSelectedPages).sort((a, b) => a - b);
    const total           = pagesToProcess.length;
    for (let i = 0; i < total; i++) {
        await yieldToMain();
        const pageNum  = pagesToProcess[i];
        setProgress((i / total) * 100, `EXTRACTING PAGE ${pageNum} (${i + 1}/${total})...`);
        const page     = await pdf.getPage(pageNum);
        const rotation = page.rotate || 0;
        const viewport = page.getViewport({ scale, rotation });
        const canvas   = document.createElement('canvas');
        const ctx      = canvas.getContext('2d', { alpha: false });
        canvas.width   = viewport.width;
        canvas.height  = viewport.height;
        await page.render({ canvasContext: ctx, viewport, intent: 'print' }).promise;
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        let fileName = state.pdfImgNames.get(pageNum);
        if (!fileName) fileName = `page_${String(pageNum).padStart(3, '0')}`;
        if (!fileName.toLowerCase().endsWith('.png')) fileName += '.png';
        zip.file(fileName, blob);
        page.cleanup();
        canvas.width = 0; canvas.height = 0;
    }
    setProgress(100, "COMPRESSING ZIP...");
    await yieldToMain();
    state.resultBlob = await zip.generateAsync({ type: 'blob' });
    state.resultName = state.exportSettings.filename
        ? `${state.exportSettings.filename}.zip`
        : file.name.replace(/\.pdf$/i, '_images.zip');
}
