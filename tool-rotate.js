async function execRotate(file) {
    const { PDFDocument, degrees } = PDFLib;
    setProgress(0, "LOADING PDF...");
    await yieldToMain();
    const arrayBuffer = await file.arrayBuffer();
    const pdf         = await PDFDocument.load(arrayBuffer);
    const pages       = pdf.getPages();
    const total       = pages.length;
    const angleToAdd  = state.rotateAngle || 90;
    const sizeSetting = state.exportSettings.size;
    const rotationState = new Map();
    for (let i = 0; i < total; i++) {
        const page        = pages[i];
        const currentRot  = page.getRotation().angle;
        let newRotation   = (currentRot + angleToAdd) % 360;
        if (newRotation < 0) newRotation += 360;
        rotationState.set(i, newRotation);
    }
    let finalBytes;
    if (sizeSetting === 'default') {
        for (let i = 0; i < total; i++) {
            if (i % 10 === 0) { await yieldToMain(); setProgress((i / total) * 100, `ROTATING PAGE ${i + 1}/${total}...`); }
            pages[i].setRotation(degrees(rotationState.get(i)));
        }
        finalBytes = await pdf.save();
    } else {
        const newPdf   = await PDFDocument.create();
        const embedded = await newPdf.embedPages(pages);
        const target   = getTargetSize();
        for (let i = 0; i < total; i++) {
            if (i % 5 === 0) { await yieldToMain(); setProgress((i / total) * 100, `RESIZING PAGE ${i + 1}/${total}...`); }
            const embPage    = embedded[i];
            const rot        = rotationState.get(i);
            const isSideways = rot % 180 !== 0;
            const contentW   = isSideways ? embPage.height : embPage.width;
            const contentH   = isSideways ? embPage.width  : embPage.height;
            const [pgW, pgH] = target;
            const scale      = Math.min(pgW / contentW, pgH / contentH);
            const page       = newPdf.addPage([pgW, pgH]);
            const drawW      = embPage.width  * scale;
            const drawH      = embPage.height * scale;
            const cX = pgW / 2, cY = pgH / 2;
            let x, y;
            if      (rot === 0)   { x = cX - drawW / 2; y = cY - drawH / 2; }
            else if (rot === 90)  { x = cX + drawH / 2; y = cY - drawW / 2; }
            else if (rot === 180) { x = cX + drawW / 2; y = cY + drawH / 2; }
            else if (rot === 270) { x = cX - drawH / 2; y = cY + drawW / 2; }
            else                  { x = cX - drawW / 2; y = cY - drawH / 2; }
            page.drawPage(embPage, { x, y, width: drawW, height: drawH, rotate: degrees(rot) });
        }
        finalBytes = await newPdf.save();
    }
    state.resultBlob = new Blob([finalBytes], { type: 'application/pdf' });
    state.resultName = state.exportSettings.filename
        ? `${state.exportSettings.filename}.pdf`
        : file.name.replace(/\.pdf$/i, '_rotated.pdf');
}
