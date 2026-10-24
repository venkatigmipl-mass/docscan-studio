import React from 'react';
import { Home, Radio, MessageSquare, User as UserIcon } from 'lucide-react';
import { MainTab, AppLanguage } from '../types/chatnest';
import { getT } from '../services/i18n';

interface BottomNavProps {
  currentTab: MainTab;
  onSelectTab: (tab: MainTab) => void;
  unreadChatCount?: number;
  language: AppLanguage;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  unreadChatCount = 0,
  language
}) => {
  const t = getT(language);

  const tabs: { id: MainTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'home', label: t('home'), icon: Home },
    { id: 'rooms', label: t('rooms'), icon: Radio },
    { id: 'chats', label: t('chats'), icon: MessageSquare },
    { id: 'profile', label: t('profile'), icon: UserIcon }
  ];

  return (
    <nav 
      aria-label="Bottom Navigation" 
      className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur-md border-t border-slate-800/80 pb-safe shadow-2xl"
    >
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex flex-col items-center justify-center min-w-[64px] min-h-[48px] rounded-2xl transition-all duration-200 active:scale-95 ${
                isActive ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-6 h-6 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                {tab.id === 'chats' && unreadChatCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-slate-900">
                    {unreadChatCount > 9 ? '9+' : unreadChatCount}
                  </span>
                )}
                {tab.id === 'rooms' && (
                  <span className="absolute -top-1 -right-1.5 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                )}
              </div>
              <span className={`text-[11px] mt-1 tracking-tight ${isActive ? 'text-indigo-400 font-medium' : 'text-slate-400'}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-1.5 h-1.5 bg-indigo-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
