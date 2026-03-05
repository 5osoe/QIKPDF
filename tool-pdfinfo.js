async function initPdfInfoUI(file) {
    DOM.pdfInfoUi.classList.remove('hidden');
    DOM.globalActions.classList.add('hidden');
    DOM.pdfInfoContent.innerHTML = '<div class="loading-spinner">...</div>';
    try {
        const arrayBuffer  = await file.arrayBuffer();
        const loadingTask  = pdfjsLib.getDocument({ data: arrayBuffer });
        const doc          = await loadingTask.promise;
        const metadata     = await doc.getMetadata();
        const info         = metadata.info || {};
        const page         = await doc.getPage(1);
        const rotation     = page.rotate || 0;
        const viewport     = page.getViewport({ scale: 1, rotation });
        const widthPt      = viewport.width;
        const heightPt     = viewport.height;
        DOM.pdfInfoContent.innerHTML = `
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
        document.getElementById('info-filename-el').textContent = file.name;
        document.getElementById('info-filesize-el').textContent = formatFileSize(file.size);
        document.getElementById('info-pages-el').textContent    = doc.numPages;
        document.getElementById('info-dim-el').textContent      = formatPageSize(widthPt, heightPt);
        const metaGrid = document.getElementById('meta-grid-el');
        const appendMeta = (label, val) => {
            const div = document.createElement('div');
            div.className = 'info-item';
            const lbl = document.createElement('label'); lbl.textContent = getT(label);
            const spn = document.createElement('span');  spn.textContent = val || '-';
            div.appendChild(lbl); div.appendChild(spn); metaGrid.appendChild(div);
        };
        appendMeta('metaTitle',    info.Title);
        appendMeta('metaAuthor',   info.Author);
        appendMeta('metaSubject',  info.Subject);
        appendMeta('metaKeywords', info.Keywords);
        appendMeta('metaCreator',  info.Creator);
        document.getElementById('btn-view-pdf-info').addEventListener('click', () => {
            if (!processingLock) openEditPreview(file, 'pdf-full');
        });
        page.cleanup();
        doc.destroy();
    } catch (e) {
        DOM.pdfInfoContent.innerHTML = '';
        const errDiv = document.createElement('div');
        errDiv.className = 'error-text';
        errDiv.textContent = getT('errorGeneric');
        DOM.pdfInfoContent.appendChild(errDiv);
    }
}
