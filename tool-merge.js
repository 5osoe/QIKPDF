// ============================================================
// TOOL: MERGE PDFs
// ============================================================

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
