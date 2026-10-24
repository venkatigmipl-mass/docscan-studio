import React, { useState } from 'react';
import { ScannedDocument, PdfPageSize } from '../types/scanner';
import { exportDocumentPdf, downloadPageAsJpeg } from '../services/pdfExport';
import { X, Share2, Download, FileText, Image as ImageIcon, Check } from 'lucide-react';
import { useToast } from './Toast';

interface ExportModalProps {
  document: ScannedDocument;
  defaultPageSize?: PdfPageSize;
  isOpen: boolean;
  onClose: () => void;
}

const PAGE_SIZES: Array<{ id: PdfPageSize; name: string; dims: string }> = [
  { id: 'a4', name: 'A4', dims: '210 × 297 mm' },
  { id: 'letter', name: 'Letter', dims: '8.5 × 11 in' },
  { id: 'a5', name: 'A5', dims: '148 × 210 mm' },
  { id: 'a3', name: 'A3', dims: '297 × 420 mm' },
];

export const ExportModal: React.FC<ExportModalProps> = ({
  document: doc,
  defaultPageSize = 'a4',
  isOpen,
  onClose,
}) => {
  const toast = useToast();
  const [pageSize, setPageSize] = useState<PdfPageSize>(defaultPageSize);
  const [margin, setMargin] = useState<number>(8); // mm
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleSharePdf = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      await exportDocumentPdf(doc, { pageSize, marginMm: margin }, 'share');
      toast.success('PDF shared successfully');
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to export PDF';
      toast.error(msg);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      await exportDocumentPdf(doc, { pageSize, marginMm: margin }, 'download');
      toast.success('PDF download started');
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to download PDF';
      toast.error(msg);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadAllJpegs = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      for (let i = 0; i < doc.pages.length; i++) {
        await downloadPageAsJpeg(doc.pages[i], doc.name, i + 1);
        // Small stagger to prevent browser popup block
        await new Promise((r) => setTimeout(r, 200));
      }
      toast.success(`Downloaded ${doc.pages.length} JPEG files`);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed downloading JPEGs';
      toast.error(msg);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 pb-safe animate-in slide-in-from-bottom duration-200">
        {/* Grab bar */}
        <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-3 sm:hidden" />

        {/* Modal Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Export & Share</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {doc.pages.length} {doc.pages.length === 1 ? 'page' : 'pages'} · {doc.name}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PDF Page Size Selection */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            PDF Page Format
          </label>
          <div className="grid grid-cols-2 gap-2">
            {PAGE_SIZES.map((size) => {
              const isSelected = pageSize === size.id;
              return (
                <button
                  key={size.id}
                  type="button"
                  onClick={() => setPageSize(size.id)}
                  className={`min-h-[44px] px-3 py-2 rounded-xl text-left border flex items-center justify-between transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold leading-none">{size.name}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{size.dims}</div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Margin selector */}
        <div className="mb-5 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Page Margins</span>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setMargin(8)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                margin === 8
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Standard (8mm)
            </button>
            <button
              type="button"
              onClick={() => setMargin(2)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                margin === 2
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Slim (2mm)
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          {/* Share PDF button */}
          <button
            type="button"
            onClick={handleSharePdf}
            disabled={isExporting}
            className="w-full min-h-[48px] bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-indigo-600/30 active:scale-95 transition-all disabled:opacity-50"
          >
            {isExporting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
            <span>Share PDF</span>
          </button>

          {/* Download PDF button */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isExporting}
            className="w-full min-h-[44px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Download / Save to Device</span>
          </button>

          {/* Download JPEG button */}
          <button
            type="button"
            onClick={handleDownloadAllJpegs}
            disabled={isExporting}
            className="w-full min-h-[44px] bg-transparent text-slate-600 dark:text-slate-400 hover:text-indigo-600 font-medium text-xs flex items-center justify-center gap-2 py-1"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Export as JPEG {doc.pages.length > 1 ? `(${doc.pages.length} images)` : ''}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
