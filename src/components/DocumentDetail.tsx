import React, { useState } from 'react';
import { ScannedDocument, DocPage } from '../types/scanner';
import {
  ArrowLeft,
  Share2,
  Trash2,
  Edit2,
  Plus,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Check,
  FileDown,
  Image as ImageIcon,
  Crop,
  Sliders,
} from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';
import { downloadPageAsJpeg } from '../services/pdfExport';
import { useToast } from './Toast';

interface DocumentDetailProps {
  document: ScannedDocument;
  onBack: () => void;
  onUpdateDocument: (updated: ScannedDocument) => Promise<void>;
  onDeleteDocument: (id: string) => Promise<void>;
  onAddPageCamera: () => void;
  onAddPageGallery: () => void;
  onEditPageCrop: (page: DocPage, pageIndex: number) => void;
  onEditPageFilter: (page: DocPage, pageIndex: number) => void;
  onOpenExportModal: () => void;
}

export const DocumentDetail: React.FC<DocumentDetailProps> = ({
  document: doc,
  onBack,
  onUpdateDocument,
  onDeleteDocument,
  onAddPageCamera,
  onAddPageGallery,
  onEditPageCrop,
  onEditPageFilter,
  onOpenExportModal,
}) => {
  const toast = useToast();

  // Rename state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(doc.name);

  // Deletion confirm state
  const [confirmDeleteDoc, setConfirmDeleteDoc] = useState(false);
  const [pageToDeleteIndex, setPageToDeleteIndex] = useState<number | null>(null);

  // Fullscreen page view modal
  const [inspectPageIndex, setInspectPageIndex] = useState<number | null>(null);

  // Save new document title
  const handleSaveTitle = async () => {
    const trimmed = titleInput.trim();
    if (!trimmed) {
      toast.error('Document title cannot be empty');
      return;
    }
    const updated: ScannedDocument = {
      ...doc,
      name: trimmed,
      updatedAt: Date.now(),
    };
    await onUpdateDocument(updated);
    setIsEditingTitle(false);
    toast.success('Document renamed');
  };

  // Reorder page up
  const handleMovePageUp = async (index: number) => {
    if (index === 0) return;
    const newPages = [...doc.pages];
    const temp = newPages[index];
    newPages[index] = newPages[index - 1];
    newPages[index - 1] = temp;

    const updated: ScannedDocument = {
      ...doc,
      pages: newPages,
      thumbnail: newPages[0]?.processedDataUrl || doc.thumbnail,
      updatedAt: Date.now(),
    };
    await onUpdateDocument(updated);
  };

  // Reorder page down
  const handleMovePageDown = async (index: number) => {
    if (index === doc.pages.length - 1) return;
    const newPages = [...doc.pages];
    const temp = newPages[index];
    newPages[index] = newPages[index + 1];
    newPages[index + 1] = temp;

    const updated: ScannedDocument = {
      ...doc,
      pages: newPages,
      thumbnail: newPages[0]?.processedDataUrl || doc.thumbnail,
      updatedAt: Date.now(),
    };
    await onUpdateDocument(updated);
  };

  // Delete page
  const handleConfirmDeletePage = async () => {
    if (pageToDeleteIndex === null) return;
    if (doc.pages.length <= 1) {
      toast.error('A document must have at least one page. You can delete the entire document instead.');
      setPageToDeleteIndex(null);
      return;
    }

    const newPages = doc.pages.filter((_, idx) => idx !== pageToDeleteIndex);
    const updated: ScannedDocument = {
      ...doc,
      pages: newPages,
      pageCount: newPages.length,
      thumbnail: newPages[0]?.processedDataUrl || '',
      updatedAt: Date.now(),
    };
    await onUpdateDocument(updated);
    setPageToDeleteIndex(null);
    toast.success('Page deleted');
  };

  // Single page JPEG download
  const handleDownloadJpeg = async (page: DocPage, index: number) => {
    try {
      await downloadPageAsJpeg(page, doc.name, index + 1);
      toast.success(`Page ${index + 1} downloaded as JPEG`);
    } catch {
      toast.error('Failed to download JPEG');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 pb-36 max-w-md mx-auto">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between h-14 px-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to documents"
            className="min-h-[44px] min-w-[44px] -ml-1 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-indigo-600 rounded-xl active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Document Title or Inline Editor */}
          <div className="flex-1 min-w-0 px-2 text-center">
            {isEditingTitle ? (
              <div className="flex items-center justify-center gap-1">
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  autoFocus
                  className="w-full max-w-[200px] h-8 px-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 border border-indigo-500 text-slate-900 dark:text-white focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitle();
                    if (e.key === 'Escape') setIsEditingTitle(false);
                  }}
                />
                <button
                  type="button"
                  onClick={handleSaveTitle}
                  className="min-h-[36px] min-w-[36px] flex items-center justify-center text-emerald-600 dark:text-emerald-400"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setTitleInput(doc.name);
                  setIsEditingTitle(true);
                }}
                className="group inline-flex items-center gap-1.5 max-w-full text-xs font-bold text-slate-900 dark:text-white truncate py-1 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="truncate">{doc.name}</span>
                <Edit2 className="w-3 h-3 text-slate-400 opacity-60 group-hover:opacity-100 shrink-0" />
              </button>
            )}
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onOpenExportModal}
              aria-label="Export or Share"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 rounded-xl active:scale-95"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setConfirmDeleteDoc(true)}
              aria-label="Delete document"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-rose-500 rounded-xl active:scale-95"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Pages List */}
      <main className="flex-1 p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between px-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <span>{doc.pages.length} {doc.pages.length === 1 ? 'Page' : 'Pages'}</span>
          <span>Tap image to zoom · Reorder below</span>
        </div>

        {/* Page Cards */}
        {doc.pages.map((page, index) => {
          const isFirst = index === 0;
          const isLast = index === doc.pages.length - 1;

          return (
            <div
              key={page.id || index}
              className="bg-white dark:bg-slate-900 rounded-3xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col gap-3"
            >
              {/* Page Header Info */}
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full text-[10px] text-slate-600 dark:text-slate-400">
                  Page {index + 1} of {doc.pages.length}
                </span>

                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                  {page.filter} · {page.rotation}°
                </span>
              </div>

              {/* Page Image Preview */}
              <div
                className="w-full bg-slate-100 dark:bg-slate-800/60 rounded-2xl overflow-hidden cursor-pointer relative group flex items-center justify-center min-h-[220px] max-h-[360px]"
                onClick={() => setInspectPageIndex(index)}
              >
                <img
                  src={page.processedDataUrl || page.originalDataUrl}
                  alt={`Page ${index + 1}`}
                  className="w-full h-auto max-h-[360px] object-contain rounded-xl"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 bg-black/70 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-xs transition-opacity">
                    Tap to inspect
                  </span>
                </div>
              </div>

              {/* Page Actions Toolbar */}
              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-2.5 mt-1">
                {/* Reorder Up/Down */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleMovePageUp(index)}
                    disabled={isFirst}
                    aria-label="Move page up"
                    className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center disabled:opacity-30 active:scale-95 transition-transform"
                    title="Move up"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMovePageDown(index)}
                    disabled={isLast}
                    aria-label="Move page down"
                    className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center disabled:opacity-30 active:scale-95 transition-transform"
                    title="Move down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Edit Crop & Filters */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onEditPageCrop(page, index)}
                    aria-label="Recrop page"
                    className="min-h-[44px] px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-1 active:scale-95"
                    title="Crop"
                  >
                    <Crop className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Crop</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onEditPageFilter(page, index)}
                    aria-label="Edit filters"
                    className="min-h-[44px] px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-1 active:scale-95"
                    title="Filters"
                  >
                    <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Filter</span>
                  </button>
                </div>

                {/* Single Page Actions: JPEG Download & Delete */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleDownloadJpeg(page, index)}
                    aria-label="Download JPEG"
                    className="min-h-[44px] min-w-[44px] text-slate-500 hover:text-indigo-600 rounded-xl flex items-center justify-center active:scale-95"
                    title="Save JPEG"
                  >
                    <FileDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPageToDeleteIndex(index)}
                    aria-label="Delete page"
                    className="min-h-[44px] min-w-[44px] text-slate-400 hover:text-rose-500 rounded-xl flex items-center justify-center active:scale-95"
                    title="Delete page"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </main>

      {/* Sticky Bottom Actions Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-3 pb-safe">
        <div className="max-w-md mx-auto grid grid-cols-3 gap-2">
          {/* Add Page Camera */}
          <button
            type="button"
            onClick={onAddPageCamera}
            className="min-h-[46px] rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
          >
            <Plus className="w-4 h-4 text-indigo-500" />
            <span>Camera</span>
          </button>

          {/* Add Page Gallery */}
          <button
            type="button"
            onClick={onAddPageGallery}
            className="min-h-[46px] rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
          >
            <ImageIcon className="w-4 h-4 text-indigo-500" />
            <span>Gallery</span>
          </button>

          {/* Export PDF Button */}
          <button
            type="button"
            onClick={onOpenExportModal}
            className="min-h-[46px] rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30 active:scale-95 transition-all"
          >
            <Share2 className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Fullscreen Inspector Modal */}
      {inspectPageIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col justify-between p-4"
          onClick={() => setInspectPageIndex(null)}
        >
          <div className="flex justify-between items-center text-white">
            <span className="text-xs font-semibold">
              Page {inspectPageIndex + 1} of {doc.pages.length}
            </span>
            <button
              type="button"
              onClick={() => setInspectPageIndex(null)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-white"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center p-2">
            <img
              src={doc.pages[inspectPageIndex]?.processedDataUrl || doc.pages[inspectPageIndex]?.originalDataUrl}
              alt={`Page ${inspectPageIndex + 1}`}
              className="max-h-[80vh] max-w-full object-contain rounded-lg"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="text-center text-xs text-slate-400 pb-safe">
            Tap anywhere to close
          </div>
        </div>
      )}

      {/* Delete Page Confirm */}
      <ConfirmDialog
        isOpen={pageToDeleteIndex !== null}
        title="Delete Page?"
        message={`Are you sure you want to remove Page ${(pageToDeleteIndex ?? 0) + 1} from this document?`}
        confirmLabel="Delete Page"
        onConfirm={handleConfirmDeletePage}
        onCancel={() => setPageToDeleteIndex(null)}
      />

      {/* Delete Entire Document Confirm */}
      <ConfirmDialog
        isOpen={confirmDeleteDoc}
        title="Delete Document?"
        message={`Are you sure you want to delete "${doc.name}"? This cannot be undone.`}
        confirmLabel="Delete Document"
        onConfirm={async () => {
          setConfirmDeleteDoc(false);
          await onDeleteDocument(doc.id);
        }}
        onCancel={() => setConfirmDeleteDoc(false)}
      />
    </div>
  );
};
