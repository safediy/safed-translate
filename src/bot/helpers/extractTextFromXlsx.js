const XLSX = require("xlsx");
const fs = require('fs');

async function extractTextFromXlsx(filePath, options = {}) {
    const maxRows = Number(options.maxRows || process.env.XLSX_MAX_ROWS || 5000);

    try {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 0 });
        const limitedRows = jsonData.slice(0, maxRows);

        let text = limitedRows
            .map((row) => row.join(" ").trim())  // Har bir qatorni birlashtirish
            .filter((line) => line && !/^\d+$/.test(line))  // Bo'sh va faqat raqamlardan iborat qatorlarni olib tashlash
            .join("\n");

        if (jsonData.length > maxRows) {
            text += `\n\n[XLSX qisqartirildi: ${maxRows} qatordan ko'pi olinmadi]`;
        }

        return text;
    } catch (error) {
        console.error("Xatolik:", error);
        return "";
    } finally {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
}

module.exports = extractTextFromXlsx;
