async function initSplitUI(file) {
    DOM.splitFilename.innerText = file.name;
    DOM.splitPageCount.innerText = "جارٍ التحميل...";

    try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        state.splitDoc = await loadingTask.promise;
        DOM.splitPageCount.innerText = state.splitDoc.numPages + " " + getT('pages');
        DOM.splitRangeCount.value = 1;
        state.splitMode = 'all';
        DOM.splitModeRadios[0].checked = true;
        DOM.splitCustomOptions.classList.add('hidden');
        renderSplitAllNames();
    } catch (e) {
        DOM.splitPageCount.innerText = "خطأ";
    }
}

async function renderSplitAllNames() {
    if (!state.splitDoc || !DOM.splitAllNames || !DOM.splitAllList) return;

    const total = state.splitDoc.numPages;
    const baseName = state.sourceFile ? getBaseName(state.sourceFile.name) : 'page';

    DOM.splitAllList.innerHTML = '';
    if (DOM.splitAllCount) DOM.splitAllCount.innerText = total + ' صفحات';
    DOM.splitAllNames.classList.remove('hidden');

    const fragment = document.createDocumentFragment();

    for (let i = 1; i <= total; i++) {
        const defaultName = `${baseName}_page_${String(i).padStart(3, '0')}`;
        if (!state.splitAllPageNames.has(i)) state.splitAllPageNames.set(i, defaultName);

        const item = document.createElement('div');
        item.className = 'split-all-item';
        item.dataset.page = i;

        const thumbBox = document.createElement('div');
        thumbBox.className = 'page-thumb';
        thumbBox.title = 'انقر للمعاينة';

        const pageNum = document.createElement('span');
        pageNum.className = 'page-num';
        pageNum.textContent = `ص${i}`;

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'page-name-input';
        nameInput.value = state.splitAllPageNames.get(i);
        nameInput.placeholder = defaultName;
        nameInput.addEventListener('input', debounce((e) => {
            state.splitAllPageNames.set(i, e.target.value.trim() || defaultName);
        }, 150));

        thumbBox.addEventListener('click', () => {
            if (!processingLock) openEditPreview(state.splitDoc, 'pdf-single', i);
        });

        item.appendChild(thumbBox);
        item.appendChild(pageNum);
        item.appendChild(nameInput);
        fragment.appendChild(item);
    }

    DOM.splitAllList.appendChild(fragment);

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(async entry => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            const pNum = parseInt(el.dataset.page);
            obs.unobserve(el);
            if (!state.splitDoc) return;
            try {
                const page = await state.splitDoc.getPage(pNum);
                const viewport = page.getViewport({ scale: 1.2 });
                const canvas = document.createElement('canvas');
                canvas.width  = viewport.width;
                canvas.height = viewport.height;
                await page.render({ canvasContext: canvas.getContext('2d', { alpha: false }), viewport }).promise;
                const thumbBox = el.querySelector('.page-thumb');
                if (thumbBox) { thumbBox.innerHTML = ''; thumbBox.appendChild(canvas); }
                page.cleanup();
            } catch (e) {}
        });
    }, { root: DOM.splitAllList, threshold: 0.05 });

    DOM.splitAllList.querySelectorAll('.split-all-item').forEach(el => observer.observe(el));
}

function renderSplitRanges(count) {
    DOM.splitRangesContainer.innerHTML = '';
    const baseName = state.sourceFile ? getBaseName(state.sourceFile.name) : 'split';

    for (let i = 0; i < count; i++) {
        const block = document.createElement('div');
        block.className = 'range-block';
        const defaultName = `${baseName}_part_${i + 1}`;
        const storedName = state.splitNames.get(i) || defaultName;
        if (!state.splitNames.has(i)) state.splitNames.set(i, storedName);

        block.innerHTML = `
            <div class="range-header">${getT('file')} #${i + 1}</div>
            <div class="range-inputs">
                <input type="number" class="input-num range-start" placeholder="${getT('from')}" data-idx="${i}">
                <span>${getT('to')}</span>
                <input type="number" class="input-num range-end" placeholder="${getT('to')}" data-idx="${i}">
            </div>
            <input type="text" class="range-name-input input-text" placeholder="${getT('filename')}" data-idx="${i}">
            <div class="range-previews">
                <canvas class="preview-canvas start-canvas clickable-canvas" data-idx="${i}"></canvas>
                <canvas class="preview-canvas end-canvas clickable-canvas" data-idx="${i}"></canvas>
            </div>
        `;

        DOM.splitRangesContainer.appendChild(block);

        const startInput  = block.querySelector('.range-start');
        const endInput    = block.querySelector('.range-end');
        const nameInput   = block.querySelector('.range-name-input');
        const startCanvas = block.querySelector('.start-canvas');
        const endCanvas   = block.querySelector('.end-canvas');

        nameInput.value = storedName;

        startInput.addEventListener('change', (e) => updateRangePreview(i, 'start', e.target.value));
        endInput.addEventListener('change',   (e) => updateRangePreview(i, 'end',   e.target.value));
        nameInput.addEventListener('input', debounce((e) => state.splitNames.set(i, e.target.value.trim()), 150));

        startCanvas.addEventListener('click', () => {
            const val = parseInt(startInput.value);
            if (val && !processingLock) openEditPreview(state.splitDoc, 'pdf-single', val);
        });
        endCanvas.addEventListener('click', () => {
            const val = parseInt(endInput.value);
            if (val && !processingLock) openEditPreview(state.splitDoc, 'pdf-single', val);
        });
    }
}

async function updateRangePreview(idx, type, pageVal) {
    if (!state.splitDoc) return;
    const pageNum = parseInt(pageVal);
    if (isNaN(pageNum) || pageNum < 1 || pageNum > state.splitDoc.numPages) return;

    try {
        const page = await state.splitDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 0.5 });
        const blocks = document.querySelectorAll('.range-block');
        const canvas = blocks[idx].querySelector(type === 'start' ? '.start-canvas' : '.end-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width  = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: ctx, viewport }).promise;
        page.cleanup();
    } catch (e) {}
}

async function execSplit(file) {
    const { PDFDocument } = PDFLib;
    const arrayBuffer = await file.arrayBuffer();
    setProgress(0, "تحميل PDF...");
    await yieldToMain();

    const pdf = await PDFDocument.load(arrayBuffer);
    const zip = new JSZip();
    const sizeSetting = state.exportSettings.size;

    const processPages = async (doc, indices) => {
        const newPdf = await PDFDocument.create();
        if (sizeSetting === 'default') {
            const copied = await newPdf.copyPages(doc, indices);
            copied.forEach(p => newPdf.addPage(p));
        } else {
            const pagesToEmbed = indices.map(i => doc.getPage(i));
            const embedded = await newPdf.embedPages(pagesToEmbed);
            const target = getTargetSize();
            embedded.forEach(embPage => {
                const page = newPdf.addPage(target);
                const { width, height } = embPage.scale(1);
                const scale = Math.min(target[0] / width, target[1] / height);
                page.drawPage(embPage, {
                    x: (target[0] - width  * scale) / 2,
                    y: (target[1] - height * scale) / 2,
                    xScale: scale,
                    yScale: scale
                });
            });
        }
        return await newPdf.save();
    };

    if (state.splitMode === 'all') {
        const numPages = pdf.getPageCount();
        for (let i = 0; i < numPages; i++) {
            await yieldToMain();
            setProgress((i / numPages) * 100, `تقسيم الصفحة ${i + 1}/${numPages}...`);
            const pdfBytes = await processPages(pdf, [i]);
            let pageName = state.splitAllPageNames.get(i + 1);
            if (!pageName) pageName = `page_${String(i + 1).padStart(3, '0')}`;
            if (!pageName.toLowerCase().endsWith('.pdf')) pageName += '.pdf';
            zip.file(pageName, pdfBytes);
        }
        state.resultName = state.exportSettings.filename
            ? `${state.exportSettings.filename}.zip`
            : file.name.replace(/\.pdf$/i, '_split.zip');

    } else if (state.splitMode === 'custom') {
        const ranges = state.splitRanges;
        const total  = ranges.length;
        for (let i = 0; i < total; i++) {
            await yieldToMain();
            setProgress((i / total) * 100, `معالجة النطاق ${i + 1}/${total}...`);
            const range = ranges[i];
            const indices = [];
            for (let j = range.start - 1; j <= range.end - 1; j++) indices.push(j);
            const pdfBytes = await processPages(pdf, indices);
            let fileName = state.splitNames.get(i);
            if (!fileName) fileName = `range_${String(i + 1).padStart(2, '0')}_p${range.start}-${range.end}`;
            if (!fileName.toLowerCase().endsWith('.pdf')) fileName += '.pdf';
            zip.file(fileName, pdfBytes);
        }
        state.resultName = state.exportSettings.filename
            ? `${state.exportSettings.filename}.zip`
            : file.name.replace(/\.pdf$/i, '_ranges.zip');
    }

    setProgress(100, "ضغط الملفات...");
    await yieldToMain();
    state.resultBlob = await zip.generateAsync({ type: 'blob' });
}
