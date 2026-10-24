import React from 'react';
import { Settings, Sun, Moon, ShieldCheck } from 'lucide-react';
import { AppSettings } from '../types/scanner';

interface HeaderProps {
  settings: AppSettings;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onToggleTheme,
  onOpenSettings,
  title = 'DocScan Studio',
  showBack = false,
  onBack,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="flex items-center justify-between h-14 px-4 max-w-md mx-auto">
        {/* Left Slot: Back or Logo */}
        <div className="flex items-center gap-2 overflow-hidden">
          {showBack && onBack ? (
            <button
              onClick={onBack}
              aria-label="Go Back"
              className="min-h-[44px] min-w-[44px] -ml-2 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-indigo-600 rounded-xl active:scale-95 transition-transform"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm shadow-indigo-600/30">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M4 8V4h4" />
                <path d="M20 8V4h-4" />
                <path d="M4 16v4h4" />
                <path d="M20 16v4h-4" />
                <rect x="7" y="7" width="10" height="10" rx="1.5" />
              </svg>
            </div>
          )}
          <div className="flex flex-col truncate">
            <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white truncate">
              {title}
            </span>
            {!showBack && (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                100% Offline · Private
              </span>
            )}
          </div>
        </div>

        {/* Right Slot: Theme & Settings Action */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl active:scale-95 transition-transform"
          >
            {settings.theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
          <button
            onClick={onOpenSettings}
            aria-label="Open settings"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl active:scale-95 transition-transform"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
