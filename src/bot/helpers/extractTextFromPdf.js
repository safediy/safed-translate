const pdfjsLib = require('pdfjs-dist');
const fs = require('fs');

async function extractTextFromPdf(pdfPath, options = {}) {
    const maxPages = Number(options.maxPages || process.env.PDF_MAX_PAGES || 30);

    try {
        const loadingTask = pdfjsLib.getDocument(pdfPath);
        const pdfDocument = await loadingTask.promise;

        let fullText = '';
        const pagesToRead = Math.min(pdfDocument.numPages, maxPages);

        for (let i = 1; i <= pagesToRead; i++) {
            const page = await pdfDocument.getPage(i);
            const textContent = await page.getTextContent();
            const text = textContent.items.map(item => item.str).join(' ');
            fullText += text + '\n';
        }

        if (pdfDocument.numPages > maxPages) {
            fullText += `\n[PDF qisqartirildi: ${maxPages} ta sahifagacha o'qildi]`;
        }

        return fullText;
    } finally {
        if (fs.existsSync(pdfPath)) {
            fs.unlinkSync(pdfPath);
        }
    }
}


module.exports = extractTextFromPdf;