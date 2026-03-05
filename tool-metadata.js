async function initMetadataUI(file) {
    DOM.metadataUi.classList.remove('hidden');
    DOM.btnProcess.innerText = getT('applyChanges');
    DOM.metaTitle.value  = "...";
    DOM.metaAuthor.value = "...";
    try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const doc         = await loadingTask.promise;
        const metadata    = await doc.getMetadata();
        const info        = metadata.info || {};
        DOM.metaTitle.value    = info.Title    || '';
        DOM.metaAuthor.value   = info.Author   || '';
        DOM.metaSubject.value  = info.Subject  || '';
        DOM.metaKeywords.value = info.Keywords || '';
        DOM.metaCreator.value  = info.Creator  || '';
        doc.destroy();
    } catch (e) { alert(getT('errorGeneric')); }
}

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
    state.resultName = state.exportSettings.filename
        ? `${state.exportSettings.filename}.pdf`
        : file.name.replace(/\.pdf$/i, '_metadata.pdf');
}
