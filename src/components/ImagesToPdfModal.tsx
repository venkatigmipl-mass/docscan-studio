import React, { useState, useRef } from 'react';
import { DocPage, PdfPageSize, ScannedDocument } from '../types/scanner';
import { compressImage } from '../services/imageProcessing';
import { generatePdfBlob, downloadBlob } from '../services/pdfExport';
import {
  Upload,
  ArrowUp,
  ArrowDown,
  Trash2,
  FileText,
  Download,
  Share2,
  FolderPlus,
  X,
  Plus,
} from 'lucide-react';
import { useToast } from './Toast';

interface ImagesToPdfModalProps {
  defaultPageSize?: PdfPageSize;
  onSaveAsDocument: (doc: ScannedDocument) => Promise<void>;
  onClose: () => void;
}

export const ImagesToPdfModal: React.FC<ImagesToPdfModalProps> = ({
  defaultPageSize = 'a4',
  onSaveAsDocument,
  onClose,
}) => {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [images, setImages] = useState<Array<{ id: string; dataUrl: string; width: number; height: number; name: string }>>([]);
  const [docTitle, setDocTitle] = useState(() => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `Images_${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
  });
  const [pageSize, setPageSize] = useState<PdfPageSize>(defaultPageSize);
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle files selected
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    try {
      const newItems: Array<{ id: string; dataUrl: string; width: number; height: number; name: string }> = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const res = await compressImage(file, 1600);
        newItems.push({
          id: Math.random().toString(36).substring(2, 9),
          dataUrl: res.dataUrl,
          width: res.width,
          height: res.height,
          name: file.name,
        });
      }

      setImages((prev) => [...prev, ...newItems]);
      toast.success(`Loaded ${newItems.length} images`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load image';
      toast.error(msg);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const copy = [...prev];
      const tmp = copy[index];
      copy[index] = copy[index - 1];
      copy[index - 1] = tmp;
      return copy;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === images.length - 1) return;
    setImages((prev) => {
      const copy = [...prev];
      const tmp = copy[index];
      copy[index] = copy[index + 1];
      copy[index + 1] = tmp;
      return copy;
    });
  };

  const handleRemove = (index: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Convert and export PDF
  const handleGeneratePdf = async (action: 'download' | 'share') => {
    if (images.length === 0) {
      toast.error('Please add at least one image');
      return;
    }

    setIsProcessing(true);
    try {
      const pages: DocPage[] = images.map((img) => ({
        id: img.id,
        originalDataUrl: img.dataUrl,
        processedDataUrl: img.dataUrl,
        width: img.width,
        height: img.height,
        filter: 'original',
        brightness: 0,
        contrast: 0,
        rotation: 0,
      }));

      const blob = await generatePdfBlob(pages, { pageSize, marginMm: 8 });
      const filename = `${docTitle.trim() || 'Document'}.pdf`;

      if (action === 'share' && navigator.canShare) {
        const file = new File([blob], filename, { type: 'application/pdf' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: docTitle,
            text: `Generated PDF (${images.length} pages)`,
            files: [file],
          });
          toast.success('Shared PDF successfully');
          return;
        }
      }

      downloadBlob(blob, filename);
      toast.success('PDF downloaded successfully');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error creating PDF';
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  // Save to DocScan library
  const handleSaveToLibrary = async () => {
    if (images.length === 0) {
      toast.error('Please add at least one image');
      return;
    }

    setIsProcessing(true);
    try {
      const pages: DocPage[] = images.map((img) => ({
        id: img.id,
        originalDataUrl: img.dataUrl,
        processedDataUrl: img.dataUrl,
        width: img.width,
        height: img.height,
        filter: 'original',
        brightness: 0,
        contrast: 0,
        rotation: 0,
      }));

      const newDoc: ScannedDocument = {
        id: Math.random().toString(36).substring(2, 9),
        name: docTitle.trim() || 'Images Document',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        pageCount: pages.length,
        thumbnail: pages[0]?.processedDataUrl || '',
        pages,
      };

      await onSaveAsDocument(newDoc);
      toast.success('Saved to Documents library');
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error saving document';
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 pb-32 max-w-md mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 dark:text-white">Images to PDF</h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Combine photos into one PDF</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 flex flex-col gap-4">
        {/* Document Name and Page Size Config */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Document Name
            </label>
            <input
              type="text"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              placeholder="e.g. Invoices_March"
              className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              PDF Page Size
            </label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(e.target.value as PdfPageSize)}
              className="h-9 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
            >
              <option value="a4">A4 (210×297mm)</option>
              <option value="letter">Letter (8.5×11")</option>
              <option value="a5">A5 (148×210mm)</option>
              <option value="a3">A3 (297×420mm)</option>
            </select>
          </div>
        </div>

        {/* Upload Trigger Zone */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="min-h-[72px] border-2 border-dashed border-indigo-300 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-3xl flex items-center justify-center gap-3 p-4 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors active:scale-98"
        >
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-600/30">
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="text-left">
            <span className="text-xs font-bold block">Select Photos from Device</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              Pick one or multiple images to convert
            </span>
          </div>
        </button>

        {/* Image Pages Preview and Ordering */}
        {images.length > 0 && (
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between px-1 text-xs text-slate-500 dark:text-slate-400">
              <span>{images.length} {images.length === 1 ? 'image' : 'images'} selected</span>
              <span>Reorder or remove</span>
            </div>

            {images.map((item, idx) => (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-2.5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3"
              >
                {/* Index badge & preview */}
                <span className="text-xs font-bold text-slate-400 w-5 text-center">
                  {idx + 1}
                </span>
                <img
                  src={item.dataUrl}
                  alt={`Selected ${idx + 1}`}
                  className="w-14 h-16 object-cover rounded-xl border border-slate-200/60 dark:border-slate-700 shrink-0"
                  referrerPolicy="no-referrer"
                />

                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate block">
                    {item.name || `Page ${idx + 1}`}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {item.width} × {item.height} px
                  </span>
                </div>

                {/* Move Up/Down & Remove Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleMoveUp(idx)}
                    disabled={idx === 0}
                    aria-label="Move up"
                    className="min-h-[44px] min-w-[36px] flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 active:scale-95"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveDown(idx)}
                    disabled={idx === images.length - 1}
                    aria-label="Move down"
                    className="min-h-[44px] min-w-[36px] flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 active:scale-95"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    aria-label="Delete image"
                    className="min-h-[44px] min-w-[36px] flex items-center justify-center text-rose-500 hover:text-rose-600 active:scale-95"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons in Document Flow to prevent any BottomNav overlap */}
        {images.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col gap-2.5 mt-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleGeneratePdf('download')}
                disabled={isProcessing}
                className="min-h-[46px] rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-indigo-600/30 active:scale-95 transition-all disabled:opacity-50"
              >
                {isProcessing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>Download PDF</span>
              </button>

              <button
                type="button"
                onClick={() => handleGeneratePdf('share')}
                disabled={isProcessing}
                className="min-h-[46px] rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
              >
                <Share2 className="w-4 h-4 text-indigo-500" />
                <span>Share PDF</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleSaveToLibrary}
              disabled={isProcessing}
              className="min-h-[44px] text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl flex items-center justify-center gap-1.5 py-1 transition-colors"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Save as Editable Document in Library</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
};
