const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const path = require('path');

// PDF dosyasından metin çıkarma
const extractTextFromPDF = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    console.error("PDF metin çıkarma hatası:", error);
    throw new Error("PDF dosyasından metin çıkarılamadı.");
  }
};

// DOCX dosyasından metin çıkarma
const extractTextFromDOCX = async (filePath) => {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } catch (error) {
    console.error("DOCX metin çıkarma hatası:", error);
    throw new Error("DOCX dosyasından metin çıkarılamadı.");
  }
};

// Dosya uzantısına göre uygun metni çıkarma
const extractTextFromFile = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  
  try {
    if (ext === '.pdf') {
      return await extractTextFromPDF(filePath);
    } else if (ext === '.docx' || ext === '.doc') {
      return await extractTextFromDOCX(filePath);
    } else {
      throw new Error("Desteklenmeyen dosya formatı.");
    }
  } catch (error) {
    console.error("Dosya metin çıkarma hatası:", error);
    throw error;
  }
};

module.exports = {
  extractTextFromFile,
  extractTextFromPDF,
  extractTextFromDOCX
};