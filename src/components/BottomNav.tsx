import React from 'react';
import { Files, Camera, Images, QrCode } from 'lucide-react';
import { ActiveScreen } from '../types/scanner';

interface BottomNavProps {
  activeScreen: ActiveScreen;
  onNavigate: (screen: ActiveScreen) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeScreen, onNavigate }) => {
  // Hide bottom nav during active editing workflows and detail view
  const isEditingFlow =
    activeScreen === 'crop' ||
    activeScreen === 'filter' ||
    activeScreen === 'camera' ||
    activeScreen === 'document-detail';
  if (isEditingFlow) return null;

  const tabs = [
    {
      id: 'home' as ActiveScreen,
      label: 'Docs',
      icon: Files,
    },
    {
      id: 'camera' as ActiveScreen,
      label: 'Scan',
      icon: Camera,
      highlight: true,
    },
    {
      id: 'images-to-pdf' as ActiveScreen,
      label: 'Img to PDF',
      icon: Images,
    },
    {
      id: 'qr-tools' as ActiveScreen,
      label: 'QR & Barcode',
      icon: QrCode,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800/80 pb-safe">
      <div className="max-w-md mx-auto grid grid-cols-4 items-center h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeScreen === tab.id;

          if (tab.highlight) {
            return (
              <div key={tab.id} className="flex items-center justify-center -mt-5">
                <button
                  type="button"
                  onClick={() => onNavigate(tab.id)}
                  aria-label={tab.label}
                  className="w-13 h-13 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex flex-col items-center justify-center shadow-lg shadow-indigo-600/30 active:scale-95 transition-transform"
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-[9px] font-semibold tracking-tight mt-0.5">{tab.label}</span>
                </button>
              </div>
            );
          }

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onNavigate(tab.id)}
              className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center transition-colors ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium tracking-tight mt-1">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
