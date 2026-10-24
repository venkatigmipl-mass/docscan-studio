import React, { useState } from 'react';
import { 
  X, 
  Globe, 
  Moon, 
  Sun, 
  Bell, 
  Volume2, 
  ShieldAlert, 
  RotateCcw, 
  LogOut, 
  Info,
  Check,
  UserCheck
} from 'lucide-react';
import { AppLanguage, User } from '../types/chatnest';
import { getT } from '../services/i18n';
import { ConfirmDialog } from './ConfirmDialog';

interface SettingsModalProps {
  currentLanguage: AppLanguage;
  currentTheme: 'dark' | 'light';
  isSoundEnabled: boolean;
  isNotificationsEnabled: boolean;
  blockedUsers: User[];
  onChangeLanguage: (lang: AppLanguage) => void;
  onToggleTheme: () => void;
  onToggleSound: () => void;
  onToggleNotifications: () => void;
  onUnblockUser: (userId: string) => void;
  onResetDemoData: () => void;
  onLogout: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  currentLanguage,
  currentTheme,
  isSoundEnabled,
  isNotificationsEnabled,
  blockedUsers,
  onChangeLanguage,
  onToggleTheme,
  onToggleSound,
  onToggleNotifications,
  onUnblockUser,
  onResetDemoData,
  onLogout,
  onClose
}) => {
  const t = getT(currentLanguage);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const languages: { code: AppLanguage; name: string; native: string }[] = [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
    { code: 'te', name: 'Telugu', native: 'తెలుగు' }
  ];

  return (
    <>
      <div 
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
      >
        <div 
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl flex flex-col max-h-[88vh] pb-safe animate-in slide-in-from-bottom-6 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>{t('settings')}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                Demo
              </span>
            </h3>

            <button
              onClick={onClose}
              className="min-h-[38px] min-w-[38px] p-2 text-slate-400 hover:text-white rounded-xl"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Settings list */}
          <div className="flex-1 overflow-y-auto space-y-4 py-3 pr-1">
            {/* Language Selector */}
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <Globe className="w-4 h-4 text-indigo-400" />
                <span>{t('language')}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {languages.map((lang) => {
                  const isSelected = currentLanguage === lang.code;
                  return (
                    <button
                      key={lang.code}
                      onClick={() => onChangeLanguage(lang.code)}
                      className={`min-h-[42px] px-3 py-2 rounded-xl text-xs flex items-center justify-between border transition-all active:scale-95 ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-500 text-white font-bold shadow-sm'
                          : 'bg-slate-700/60 border-slate-600/60 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <span>{lang.native}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Appearance (Theme) */}
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {currentTheme === 'dark' ? (
                  <Moon className="w-4 h-4 text-indigo-400" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-400" />
                )}
                <div>
                  <span className="text-xs font-bold text-white block">Theme</span>
                  <span className="text-[11px] text-slate-400">
                    {currentTheme === 'dark' ? 'Dark Mode (Active)' : 'Light Mode (Active)'}
                  </span>
                </div>
              </div>

              <button
                onClick={onToggleTheme}
                className="min-h-[38px] px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-xl active:scale-95 transition-transform"
              >
                Switch to {currentTheme === 'dark' ? 'Light' : 'Dark'}
              </button>
            </div>

            {/* Notifications Toggle */}
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Bell className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="text-xs font-bold text-white block">
                    {t('notifications')}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Simulate instant push popups
                  </span>
                </div>
              </div>

              <button
                onClick={onToggleNotifications}
                className={`w-12 h-6 rounded-full transition-colors p-0.5 relative ${
                  isNotificationsEnabled ? 'bg-indigo-600' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    isNotificationsEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Sound Effects Toggle */}
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Volume2 className="w-4 h-4 text-amber-400" />
                <div>
                  <span className="text-xs font-bold text-white block">
                    {t('sound_effects')}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Synthesized rings and chimes
                  </span>
                </div>
              </div>

              <button
                onClick={onToggleSound}
                className={`w-12 h-6 rounded-full transition-colors p-0.5 relative ${
                  isSoundEnabled ? 'bg-indigo-600' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    isSoundEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Blocked Users Management */}
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>Blocked Users ({blockedUsers.length})</span>
                </div>
              </div>

              {blockedUsers.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic">
                  {t('blocked_empty')}
                </p>
              ) : (
                <div className="space-y-2 pt-1">
                  {blockedUsers.map((bu) => (
                    <div
                      key={bu.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span>{bu.avatar}</span>
                        <span className="text-white font-medium">{bu.name}</span>
                      </div>
                      <button
                        onClick={() => onUnblockUser(bu.id)}
                        className="px-2.5 py-1 text-xs font-semibold bg-slate-800 text-indigo-400 hover:text-white rounded-lg border border-indigo-500/30"
                      >
                        {t('unblock')}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Demo Reset Button */}
            <div className="pt-2">
              <button
                onClick={() => setShowResetConfirm(true)}
                className="w-full min-h-[46px] rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-center gap-2 active:scale-98 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{t('reset_data')}</span>
              </button>
            </div>

            {/* Logout Button */}
            <div>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full min-h-[46px] rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center justify-center gap-2 active:scale-98 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>{t('logout')}</span>
              </button>
            </div>

            {/* Demo Info */}
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 text-center space-y-1">
              <p className="text-[10px] text-slate-400 font-medium">
                ChatNest Demo Prototype v1.0 • Capacitor 6 Ready
              </p>
              <p className="text-[9px] text-slate-500">
                100% Client-Side Simulated Social Platform. No backend required.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Dialog for Reset Demo Data */}
      <ConfirmDialog
        isOpen={showResetConfirm}
        title="Reset Demo Data?"
        message="This will restore all default mock users, chat threads, coins balance, and unblock any blocked profiles."
        confirmLabel="Reset Data"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={() => {
          setShowResetConfirm(false);
          onResetDemoData();
        }}
        onCancel={() => setShowResetConfirm(false)}
      />

      {/* Confirm Dialog for Logout */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="Log Out of ChatNest?"
        message="You will return to the welcome onboarding and phone verification screen."
        confirmLabel="Log Out"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          onLogout();
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </>
  );
};
