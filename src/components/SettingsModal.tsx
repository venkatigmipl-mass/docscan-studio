import React, { useState, useEffect } from 'react';
import { AppSettings, FilterType, PdfPageSize } from '../types/scanner';
import { dbService } from '../services/db';
import { X, Moon, Sun, FileText, Sparkles, HardDrive, Trash2, ShieldCheck } from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';
import { useToast } from './Toast';

interface SettingsModalProps {
  settings: AppSettings;
  isOpen: boolean;
  onClose: () => void;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  onClearAllData: () => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  isOpen,
  onClose,
  onUpdateSettings,
  onClearAllData,
}) => {
  const toast = useToast();
  const [storageInfo, setStorageInfo] = useState<{ docCount: number; estimatedSizeMb: number }>({
    docCount: 0,
    estimatedSizeMb: 0,
  });
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      dbService.getStorageEstimate().then(setStorageInfo);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClearAll = async () => {
    setIsClearing(true);
    try {
      await onClearAllData();
      toast.success('All documents cleared');
      setShowClearConfirm(false);
      onClose();
    } catch {
      toast.error('Failed to clear data');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 pb-safe max-h-[90vh] overflow-y-auto">
        <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-3 sm:hidden" />

        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Settings</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Scanner & PDF preferences</p>
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

        <div className="flex flex-col gap-4">
          {/* Appearance Theme */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-900 dark:text-white block mb-2">
              Appearance
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onUpdateSettings({ theme: 'light' })}
                className={`min-h-[44px] rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                  settings.theme === 'light'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 border-indigo-500 shadow-sm'
                    : 'bg-transparent text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-500" />
                Light
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ theme: 'dark' })}
                className={`min-h-[44px] rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                  settings.theme === 'dark'
                    ? 'bg-white dark:bg-slate-700 text-indigo-400 border-indigo-500 shadow-sm'
                    : 'bg-transparent text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
              >
                <Moon className="w-4 h-4 text-indigo-400" />
                Dark
              </button>
            </div>
          </div>

          {/* Default PDF Page Size */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Default PDF Page Format
              </span>
            </div>
            <select
              value={settings.defaultPdfSize}
              onChange={(e) => onUpdateSettings({ defaultPdfSize: e.target.value as PdfPageSize })}
              className="w-full h-11 px-3.5 rounded-xl bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
            >
              <option value="a4">A4 (Standard 210 × 297 mm)</option>
              <option value="letter">Letter (US 8.5 × 11 in)</option>
              <option value="a5">A5 (Compact 148 × 210 mm)</option>
              <option value="a3">A3 (Large 297 × 420 mm)</option>
            </select>
          </div>

          {/* Default Document Filter */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Default Filter Preset
              </span>
            </div>
            <select
              value={settings.defaultFilter}
              onChange={(e) => onUpdateSettings({ defaultFilter: e.target.value as FilterType })}
              className="w-full h-11 px-3.5 rounded-xl bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 capitalize"
            >
              <option value="original">Original</option>
              <option value="color">Color (Document Boost)</option>
              <option value="bw">B&W (High Contrast Monotone)</option>
              <option value="grayscale">Grayscale</option>
              <option value="lighten">Lighten</option>
              <option value="dark">Dark / High Contrast</option>
              <option value="noise">Noise Removal</option>
            </select>
          </div>

          {/* Offline Storage Information */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  IndexedDB Storage
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                {storageInfo.estimatedSizeMb} MB
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              All data stays on this device. No cloud storage, no account required.
            </div>

            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="w-full min-h-[44px] rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 text-xs font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear All Stored Data</span>
            </button>
          </div>
        </div>

        <ConfirmDialog
          isOpen={showClearConfirm}
          title="Delete All Data?"
          message="This will permanently delete all your scanned documents from this browser. This cannot be undone."
          confirmLabel={isClearing ? 'Deleting...' : 'Erase Everything'}
          onConfirm={handleClearAll}
          onCancel={() => setShowClearConfirm(false)}
        />
      </div>
    </div>
  );
};
