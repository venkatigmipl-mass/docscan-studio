import { jsPDF } from 'jspdf';
import { DocPage, PdfPageSize, ScannedDocument } from '../types/scanner';

// Page dimensions in mm: [width, height] in portrait
const PAGE_DIMENSIONS: Record<PdfPageSize, [number, number]> = {
  a4: [210, 297],
  letter: [215.9, 279.4],
  a5: [148, 210],
  a3: [297, 420],
};

export interface ExportPdfOptions {
  pageSize: PdfPageSize;
  marginMm?: number;
}

/**
 * Generates a jsPDF instance from a list of pages
 */
export async function generatePdfBlob(
  pages: DocPage[],
  options: ExportPdfOptions = { pageSize: 'a4', marginMm: 8 }
): Promise<Blob> {
  if (pages.length === 0) {
    throw new Error('No pages to generate PDF');
  }

  const [pageW, pageH] = PAGE_DIMENSIONS[options.pageSize] || PAGE_DIMENSIONS.a4;
  const margin = options.marginMm ?? 8;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: options.pageSize,
    compress: true,
  });

  for (let i = 0; i < pages.length; i++) {
    if (i > 0) {
      pdf.addPage(options.pageSize, 'portrait');
    }

    const page = pages[i];
    const dataUrl = page.processedDataUrl || page.originalDataUrl;

    const printableW = pageW - margin * 2;
    const printableH = pageH - margin * 2;

    const imgAspect = (page.width || 1) / (page.height || 1);
    const boxAspect = printableW / printableH;

    let drawW: number;
    let drawH: number;

    if (imgAspect > boxAspect) {
      // Fit to width
      drawW = printableW;
      drawH = printableW / imgAspect;
    } else {
      // Fit to height
      drawH = printableH;
      drawW = printableH * imgAspect;
    }

    // Center image on the page
    const posX = margin + (printableW - drawW) / 2;
    const posY = margin + (printableH - drawH) / 2;

    pdf.addImage(dataUrl, 'JPEG', posX, posY, drawW, drawH, undefined, 'FAST');
  }

  return pdf.output('blob');
}

/**
 * Downloads a Blob as a file with the specified filename
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

/**
 * Shares or downloads a PDF document
 */
export async function exportDocumentPdf(
  doc: ScannedDocument,
  options: ExportPdfOptions,
  action: 'share' | 'download' = 'download'
): Promise<void> {
  const blob = await generatePdfBlob(doc.pages, options);
  const sanitizedName = (doc.name || 'Scan').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${sanitizedName}.pdf`;

  if (action === 'share') {
    const file = new File([blob], filename, { type: 'application/pdf' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: doc.name,
          text: `Scanned document: ${doc.name} (${doc.pages.length} pages)`,
          files: [file],
        });
        return;
      } catch (err: unknown) {
        // User aborted share or share failed
        if (err instanceof Error && err.name === 'AbortError') return;
        console.warn('Share failed, falling back to download:', err);
      }
    }
  }

  // Fallback to direct download
  downloadBlob(blob, filename);
}

/**
 * Exports a single page as a JPEG file
 */
export async function downloadPageAsJpeg(page: DocPage, docName: string, pageNumber: number): Promise<void> {
  const dataUrl = page.processedDataUrl || page.originalDataUrl;
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const sanitizedName = (docName || 'Scan').replace(/[^a-zA-Z0-9_-]/g, '_');
  downloadBlob(blob, `${sanitizedName}_page_${pageNumber}.jpg`);
}
