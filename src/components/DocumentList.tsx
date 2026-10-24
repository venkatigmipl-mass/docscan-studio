import React, { useState, useMemo } from 'react';
import { Search, Plus, FileText, Calendar, MoreVertical, Trash2, Edit2, Share2, FolderOpen, ArrowUpDown } from 'lucide-react';
import { ScannedDocument } from '../types/scanner';
import { ConfirmDialog } from './ConfirmDialog';

interface DocumentListProps {
  documents: ScannedDocument[];
  onOpenDocument: (doc: ScannedDocument) => void;
  onStartScan: () => void;
  onImportGallery: () => void;
  onDeleteDocument: (id: string) => Promise<void>;
  onRenameDocument: (id: string, newName: string) => Promise<void>;
  onExportDocument: (doc: ScannedDocument) => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  onOpenDocument,
  onStartScan,
  onImportGallery,
  onDeleteDocument,
  onRenameDocument,
  onExportDocument,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'name'>('newest');
  
  // Actions state
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [renamingDoc, setRenamingDoc] = useState<ScannedDocument | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter and sort
  const filteredDocs = useMemo(() => {
    let result = documents.filter((doc) =>
      doc.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );

    if (sortOrder === 'newest') {
      result.sort((a, b) => b.updatedAt - a.updatedAt);
    } else if (sortOrder === 'oldest') {
      result.sort((a, b) => a.updatedAt - b.updatedAt);
    } else if (sortOrder === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [documents, searchQuery, sortOrder]);

  const handleStartRename = (doc: ScannedDocument) => {
    setRenamingDoc(doc);
    setRenameInput(doc.name);
    setActiveMenuId(null);
  };

  const handleSaveRename = async () => {
    if (!renamingDoc) return;
    const trimmed = renameInput.trim();
    if (!trimmed) return;
    await onRenameDocument(renamingDoc.id, trimmed);
    setRenamingDoc(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await onDeleteDocument(deletingId);
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
      setActiveMenuId(null);
    }
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)] pb-32 px-4 pt-3 max-w-md mx-auto w-full">
      {/* Search and Sort Toolbar */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents..."
            className="w-full h-11 pl-10 pr-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              ✕
            </button>
          )}
        </div>

        {/* Sort button */}
        <button
          onClick={() => {
            const nextOrder = sortOrder === 'newest' ? 'name' : sortOrder === 'name' ? 'oldest' : 'newest';
            setSortOrder(nextOrder);
          }}
          className="h-11 px-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-1.5 shrink-0 shadow-sm active:scale-95 transition-transform"
          title={`Sort: ${sortOrder}`}
        >
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <span className="capitalize">{sortOrder}</span>
        </button>
      </div>

      {/* Document Stats / Counter & Unified Import Action */}
      <div className="flex items-center justify-between px-1 mb-3 text-xs text-slate-500 dark:text-slate-400">
        <span>
          {documents.length} {documents.length === 1 ? 'document' : 'documents'}
          {searchQuery && ` (filtered to ${filteredDocs.length})`}
        </span>
        <button
          onClick={onImportGallery}
          className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1 py-1"
        >
          <FolderOpen className="w-3.5 h-3.5" />
          Import from Photos
        </button>
      </div>

      {/* Empty State */}
      {filteredDocs.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center my-auto">
          <div className="w-18 h-18 rounded-3xl bg-indigo-50 dark:bg-slate-800/80 border border-indigo-100 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 shadow-sm">
            <FileText className="w-9 h-9" />
          </div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1.5">
            {searchQuery ? 'No matching documents' : 'No scanned documents yet'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mb-6 leading-relaxed">
            {searchQuery
              ? `No document names matched "${searchQuery}". Try a different keyword.`
              : 'Scan paper documents, receipts, whiteboards or ID cards using your device camera.'}
          </p>
          <div className="flex flex-col gap-2.5 w-full max-w-xs">
            <button
              onClick={onStartScan}
              className="min-h-[48px] px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 active:scale-95 transition-transform"
            >
              <Plus className="w-4 h-4" />
              Scan with Camera
            </button>
            <button
              onClick={onImportGallery}
              className="min-h-[44px] px-6 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <FolderOpen className="w-4 h-4 text-slate-500" />
              Import from Photos
            </button>
          </div>
        </div>
      )}

      {/* Document List Items */}
      {filteredDocs.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="relative group bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex items-center gap-3.5"
            >
              {/* Thumbnail */}
              <button
                type="button"
                onClick={() => onOpenDocument(doc)}
                className="w-16 h-20 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden shrink-0 border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-center relative active:scale-95 transition-transform"
              >
                {doc.thumbnail ? (
                  <img
                    src={doc.thumbnail}
                    alt={doc.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <FileText className="w-7 h-7 text-slate-400" />
                )}
                <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] font-semibold px-1 py-0.5 rounded backdrop-blur-xs">
                  {doc.pages.length}p
                </div>
              </button>

              {/* Document Info */}
              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => onOpenDocument(doc)}
              >
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate mb-1">
                  {doc.name}
                </h3>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  <span>{doc.pages.length} {doc.pages.length === 1 ? 'page' : 'pages'}</span>
                  <span aria-hidden="true">·</span>
                  <span className="flex items-center gap-1 truncate">
                    <Calendar className="w-3 h-3 shrink-0" />
                    {formatDate(doc.updatedAt)}
                  </span>
                </div>
              </div>

              {/* Actions Dropdown Trigger */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuId(activeMenuId === doc.id ? null : doc.id);
                  }}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl active:scale-95"
                  aria-label="Document options"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {/* Popover Menu */}
                {activeMenuId === doc.id && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setActiveMenuId(null)}
                    />
                    <div className="absolute right-0 top-10 z-50 w-38 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 overflow-hidden animate-in fade-in zoom-in-95">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveMenuId(null);
                          onExportDocument(doc);
                        }}
                        className="w-full px-3 py-2 text-left text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 min-h-[36px]"
                      >
                        <Share2 className="w-3.5 h-3.5 text-indigo-500" />
                        Export / Share
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartRename(doc)}
                        className="w-full px-3 py-2 text-left text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 min-h-[36px]"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                        Rename
                      </button>
                      <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
                      <button
                        type="button"
                        onClick={() => {
                          setDeletingId(doc.id);
                          setActiveMenuId(null);
                        }}
                        className="w-full px-3 py-2 text-left text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 min-h-[36px]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rename Dialog */}
      {renamingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xs bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Rename Document</h3>
            <input
              type="text"
              value={renameInput}
              onChange={(e) => setRenameInput(e.target.value)}
              placeholder="Document name"
              autoFocus
              className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRenamingDoc(null)}
                className="flex-1 min-h-[44px] px-3 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRename}
                disabled={!renameInput.trim()}
                className="flex-1 min-h-[44px] px-3 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingId)}
        title="Delete Document?"
        message="This document and all its scanned pages will be permanently removed from this device."
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete'}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
};
