async function execImgToPdf(files) {
    const { PDFDocument, degrees } = PDFLib;
    const pdfDoc        = await PDFDocument.create();
    const total         = files.length;
    const sizeSetting   = state.exportSettings.size;
    const exportRotation = state.exportSettings.exportRotation || 0;
    for (let i = 0; i < total; i++) {
        await yieldToMain();
        setProgress((i / total) * 100, `ADDING IMAGE ${i + 1}/${total}...`);
        const file        = files[i];
        const arrayBuffer = await file.arrayBuffer();
        let image;
        try {
            if (file.type === 'image/jpeg' || file.name.match(/\.(jpg|jpeg)$/i)) image = await pdfDoc.embedJpg(arrayBuffer);
            else if (file.type === 'image/png' || file.name.match(/\.png$/i))    image = await pdfDoc.embedPng(arrayBuffer);
            else continue;
            const dims = { width: image.width, height: image.height };
            let page;
            if (sizeSetting !== 'default') {
                const target = getTargetSize();
                page = pdfDoc.addPage(target);
                const scale = Math.min(target[0] / dims.width, target[1] / dims.height);
                const w = dims.width * scale, h = dims.height * scale;
                page.drawImage(image, { x: (target[0] - w) / 2, y: (target[1] - h) / 2, width: w, height: h });
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
    state.resultName = state.exportSettings.filename
        ? `${state.exportSettings.filename}.pdf`
        : 'images_merged.pdf';
}
