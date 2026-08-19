import { extractPdfText } from '../utils/pdfParser.js';

// Decoded-size ceiling. Base64 inflates ~33%, and app.js caps JSON bodies at
// 10mb, so 8mb decoded stays comfortably under the transport limit.
const MAX_PDF_BYTES = 8 * 1024 * 1024;

/**
 * POST /api/upload/pdf
 * Body: { fileName, dataBase64 }  (dataBase64 may be a raw base64 string or a
 * data: URL — the prefix is stripped). Decodes the PDF, validates it, extracts
 * real text via pdf-parse, and returns the text + page count. No file is stored:
 * the caller keeps the extracted text in the node definition.
 */
export async function uploadPdf(req, res) {
  try {
    const { fileName, dataBase64 } = req.body;

    if (!dataBase64 || typeof dataBase64 !== 'string') {
      return res.status(400).json({ success: false, message: 'No PDF data provided.' });
    }

    // Accept both a bare base64 string and a "data:application/pdf;base64,..." URL
    const base64 = dataBase64.includes(',') ? dataBase64.slice(dataBase64.indexOf(',') + 1) : dataBase64;
    const buffer = Buffer.from(base64, 'base64');

    if (buffer.length === 0) {
      return res.status(400).json({ success: false, message: 'Uploaded PDF is empty or invalid.' });
    }
    if (buffer.length > MAX_PDF_BYTES) {
      return res.status(413).json({
        success: false,
        message: `PDF too large (${(buffer.length / (1024 * 1024)).toFixed(1)}MB). Max ${MAX_PDF_BYTES / (1024 * 1024)}MB.`
      });
    }
    // PDF magic bytes: "%PDF-"
    if (buffer.slice(0, 5).toString('latin1') !== '%PDF-') {
      return res.status(400).json({ success: false, message: 'File does not appear to be a valid PDF.' });
    }

    const { text, pageCount } = await extractPdfText(buffer);

    return res.status(200).json({
      success: true,
      fileName: fileName || 'document.pdf',
      text,
      pageCount,
      charCount: text.length
    });
  } catch (error) {
    console.error('[PDF Upload] Extraction failed:', error.message);
    return res.status(422).json({ success: false, message: `Failed to parse PDF: ${error.message}` });
  }
}
