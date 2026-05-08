import { PDFDocument } from 'pdf-lib';
import { jsPDF } from 'jspdf';

interface Tramite {
  nombre: string;
  pasos?: string[];
}

/**
 * Generates a combined PDF with the original form and the step-by-step guide.
 * @param tramite The tramite object containing name and steps.
 * @param originalPdfUrl The URL of the original PDF form.
 * @returns A Blob URL of the combined PDF.
 */
export async function generateFullTramitePdf(tramite: Tramite, originalPdfUrl: string): Promise<string> {
  // 1. Fetch the original PDF with a timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  let originalPdfBytes: ArrayBuffer;
  try {
    const response = await fetch(originalPdfUrl, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`No se pudo descargar el archivo original (Error ${response.status}).`);
    }
    originalPdfBytes = await response.arrayBuffer();
    
    if (originalPdfBytes.byteLength === 0) {
      throw new Error('El archivo PDF original está vacío.');
    }
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error('Fetch error:', error);
    if (error.name === 'AbortError') {
      throw new Error('La descarga del archivo original tardó demasiado tiempo.');
    }
    throw new Error('No se pudo acceder al archivo original. Esto puede deberse a restricciones de seguridad (CORS).');
  }

  // 2. Generate the guide PDF using jsPDF
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Style settings
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - (margin * 2);
  let yPos = margin;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(11, 35, 68); // PAMI Blue
  const titleLines = doc.splitTextToSize(tramite.nombre.toUpperCase(), contentWidth);
  doc.text(titleLines, margin, yPos);
  yPos += (titleLines.length * 10) + 5;

  // Horizontal line
  doc.setDrawColor(0, 185, 190); // PAMI Cyan
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, margin + contentWidth, yPos);
  yPos += 10;

  // Header "Pasos a seguir"
  doc.setFontSize(14);
  doc.setTextColor(0, 185, 190); // PAMI Cyan
  doc.text('GUÍA PASO A PASO', margin, yPos);
  yPos += 10;

  // Steps
  if (tramite.pasos && tramite.pasos.length > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(51, 51, 51); // Dark gray

    tramite.pasos.forEach((paso, index) => {
      const stepText = `${index + 1}. ${paso}`;
      const stepLines = doc.splitTextToSize(stepText, contentWidth);
      
      // Check if we need a new page (unlikely for a guide, but good practice)
      if (yPos + (stepLines.length * 7) > 280) {
        doc.addPage();
        yPos = margin;
      }

      doc.text(stepLines, margin, yPos);
      yPos += (stepLines.length * 7) + 5;
    });
  }

  // No footer as requested

  // Get the guide PDF as bytes
  const guidePdfBytes = doc.output('arraybuffer');

  // 3. Merge PDFs using pdf-lib
  const mergedPdf = await PDFDocument.create();
  
  // Load original PDF
  const originalPdfDoc = await PDFDocument.load(originalPdfBytes);
  const originalPages = await mergedPdf.copyPages(originalPdfDoc, originalPdfDoc.getPageIndices());
  originalPages.forEach(page => mergedPdf.addPage(page));

  // Load guide PDF
  const guidePdfDoc = await PDFDocument.load(guidePdfBytes);
  const guidePages = await mergedPdf.copyPages(guidePdfDoc, guidePdfDoc.getPageIndices());
  guidePages.forEach(page => mergedPdf.addPage(page));

  // 4. Save and return Blob URL
  const mergedPdfBytes = await mergedPdf.save();
  const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
  return URL.createObjectURL(blob);
}
