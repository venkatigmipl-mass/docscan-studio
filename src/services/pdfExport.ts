import { jsPDF } from 'jspdf';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
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
 * Converts a Blob to a raw base64 string (without the data: prefix)
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const commaIdx = result.indexOf(',');
      if (commaIdx >= 0) {
        resolve(result.substring(commaIdx + 1));
      } else {
        resolve(result);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Generates a jsPDF Blob from a list of DocPages
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
      drawW = printableW;
      drawH = printableW / imgAspect;
    } else {
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
 * Downloads a Blob as a file with the specified filename for web browsers
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
 * Shares or downloads a PDF blob safely on both Capacitor Native WebView and Web browsers
 */
export async function shareOrDownloadPdfBlob(
  blob: Blob,
  filename: string,
  title: string,
  action: 'share' | 'download' = 'download'
): Promise<void> {
  const isNative = Capacitor.isNativePlatform();

  if (isNative) {
    // Android/iOS Capacitor Native WebView flow
    const base64Data = await blobToBase64(blob);
    const writeResult = await Filesystem.writeFile({
      path: filename,
      data: base64Data,
      directory: Directory.Cache,
    });

    await Share.share({
      title,
      text: title,
      url: writeResult.uri,
      dialogTitle: 'Share PDF',
    });
    return;
  }

  // Web browser flow
  if (action === 'share' && typeof navigator !== 'undefined' && navigator.canShare) {
    const file = new File([blob], filename, { type: 'application/pdf' });
    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title,
          text: title,
          files: [file],
        });
        return;
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
        console.warn('Web Share API error:', err);
      }
    }
  }

  // Fallback to direct web download link
  downloadBlob(blob, filename);
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
  const title = `Scanned document: ${doc.name} (${doc.pages.length} pages)`;

  await shareOrDownloadPdfBlob(blob, filename, title, action);
}

/**
 * Exports a single page as a JPEG file safely on both Capacitor Native and Web
 */
export async function downloadPageAsJpeg(
  page: DocPage,
  docName: string,
  pageNumber: number
): Promise<void> {
  const sanitizedName = (docName || 'Scan').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${sanitizedName}_page_${pageNumber}.jpg`;

  let blob = page.processedBlob;
  if (!blob) {
    const dataUrl = page.processedDataUrl || page.originalDataUrl;
    const res = await fetch(dataUrl);
    blob = await res.blob();
  }

  const isNative = Capacitor.isNativePlatform();

  if (isNative) {
    const base64Data = await blobToBase64(blob);
    const writeResult = await Filesystem.writeFile({
      path: filename,
      data: base64Data,
      directory: Directory.Cache,
    });

    await Share.share({
      title: filename,
      url: writeResult.uri,
      dialogTitle: 'Share Image',
    });
    return;
  }

  downloadBlob(blob, filename);
}
