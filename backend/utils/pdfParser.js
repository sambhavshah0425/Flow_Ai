import { PDFParse } from 'pdf-parse';

/**
 * Extract plain text and page count from a PDF buffer using pdf-parse (v2).
 * Returns real extracted content — no mocking.
 *
 * @param {Buffer} buffer - Raw PDF file bytes
 * @returns {Promise<{ text: string, pageCount: number }>}
 */
export async function extractPdfText(buffer) {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return {
      // pdf-parse separates pages with "-- 1 of 2 --" lines: noise for the AI
      text: (result.text || '').replace(/^-- \d+ of \d+ --$/gm, '').replace(/\n{3,}/g, '\n\n').trim(),
      pageCount: result.total || result.pages?.length || 0
    };
  } finally {
    // Always release pdf.js resources
    await parser.destroy().catch(() => {});
  }
}
