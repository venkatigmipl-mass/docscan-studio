import React from 'react';
import { UserCheck, Settings, Sparkles } from 'lucide-react';
import { AppLanguage } from '../types/chatnest';
import { getT } from '../services/i18n';

interface HeaderProps {
  coins: number;
  pendingRequestsCount: number;
  language: AppLanguage;
  onOpenRequests: () => void;
  onOpenSettings: () => void;
  onOpenDailyBonus: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  coins,
  pendingRequestsCount,
  language,
  onOpenRequests,
  onOpenSettings,
  onOpenDailyBonus,
}) => {
  const t = getT(language);

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 pt-safe px-4 py-2.5 shadow-sm">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Logo and Demo Mode Badge */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-md shadow-indigo-500/20 text-lg">
            🐣
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                ChatNest
              </span>
              <span className="px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-md">
                {t('demo_mode')}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 -mt-0.5 line-clamp-1">
              {t('tagline')}
            </p>
          </div>
        </div>

        {/* Right Actions: Coins Chip + Friends Requests + Settings */}
        <div className="flex items-center gap-2">
          {/* Coins pill */}
          <button
            onClick={onOpenDailyBonus}
            className="min-h-[38px] px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-full flex items-center gap-1.5 text-xs font-bold text-amber-300 transition-all active:scale-95 shadow-sm"
            title={t('get_coins')}
          >
            <span className="text-sm">🪙</span>
            <span>{coins.toLocaleString()}</span>
            <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
          </button>

          {/* Friend requests button */}
          <button
            onClick={onOpenRequests}
            className="relative min-w-[38px] min-h-[38px] w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/80 flex items-center justify-center text-slate-300 hover:text-white transition-colors active:scale-95"
            aria-label="Friend Requests"
            title="Friend Requests"
          >
            <UserCheck className="w-4 h-4" />
            {pendingRequestsCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-slate-900 animate-bounce">
                {pendingRequestsCount}
              </span>
            )}
          </button>

          {/* Settings button */}
          <button
            onClick={onOpenSettings}
            className="min-w-[38px] min-h-[38px] w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/80 flex items-center justify-center text-slate-300 hover:text-white transition-colors active:scale-95"
            aria-label={t('settings')}
            title={t('settings')}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
