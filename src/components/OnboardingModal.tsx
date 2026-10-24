import React, { useState } from 'react';
import { ShieldCheck, Heart, Users, Sparkles, Check, ChevronRight } from 'lucide-react';
import { AppLanguage } from '../types/chatnest';
import { getT } from '../services/i18n';

interface OnboardingModalProps {
  currentLanguage: AppLanguage;
  onSelectLanguage: (lang: AppLanguage) => void;
  onComplete: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  currentLanguage,
  onSelectLanguage,
  onComplete
}) => {
  const [isAgeConfirmed, setIsAgeConfirmed] = useState(false);
  const t = getT(currentLanguage);

  const languages: { code: AppLanguage; name: string; native: string; flag: string }[] = [
    { code: 'en', name: 'English', native: 'English', flag: '🇬🇧' },
    { code: 'ta', name: 'Tamil', native: 'தமிழ்', flag: '🌴' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
    { code: 'te', name: 'Telugu', native: 'తెలుగు', flag: '🏛️' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between overflow-y-auto px-4 py-8 pt-safe pb-safe animate-in fade-in">
      <div className="max-w-md w-full mx-auto space-y-6">
        {/* Splash Branding */}
        <div className="text-center pt-4">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl shadow-indigo-500/25 text-4xl mb-3 animate-pulse">
            🐣
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ChatNest Demo Experience</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            {t('app_name')}
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-xs mx-auto">
            {t('tagline')}
          </p>
        </div>

        {/* Language Picker */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              {t('language')}
            </label>
            <span className="text-[11px] text-indigo-400 font-medium">Select to switch</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {languages.map((lang) => {
              const isSelected = currentLanguage === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => onSelectLanguage(lang.code)}
                  className={`min-h-[48px] p-2.5 rounded-2xl flex items-center justify-between border text-left transition-all active:scale-95 ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500 text-white font-semibold shadow-sm shadow-indigo-500/10'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{lang.flag}</span>
                    <div>
                      <div className="text-xs font-semibold">{lang.native}</div>
                      <div className="text-[10px] text-slate-400">{lang.name}</div>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Community Safety Guidelines */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-lg space-y-3">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>{t('rules_title')}</span>
          </div>
          <ul className="space-y-2.5 text-xs text-slate-300">
            <li className="flex items-start gap-2.5">
              <Heart className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{t('rule_1')}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{t('rule_2')}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <Users className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{t('rule_3')}</span>
            </li>
          </ul>
        </div>

        {/* 18+ Confirmation Checkbox (BLOCK CONTINUE IF UNCHECKED) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-lg">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              id="ageCheckbox"
              checked={isAgeConfirmed}
              onChange={(e) => setIsAgeConfirmed(e.target.checked)}
              className="mt-0.5 w-5 h-5 rounded-lg border-slate-700 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 bg-slate-800 cursor-pointer accent-indigo-500 shrink-0"
            />
            <div className="text-xs text-slate-200 font-medium leading-relaxed">
              <span>{t('age_confirm')}</span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                ChatNest is designed for adults. By proceeding you agree to maintain safe, consensual, and respectful conversations.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Bottom Button */}
      <div className="max-w-md w-full mx-auto pt-6">
        <button
          type="button"
          disabled={!isAgeConfirmed}
          onClick={onComplete}
          className={`w-full min-h-[52px] px-6 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-98 ${
            isAgeConfirmed
              ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-indigo-600/30 hover:brightness-110 cursor-pointer'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60 border border-slate-700/60'
          }`}
        >
          <span>{t('get_started')}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
        {!isAgeConfirmed && (
          <p className="text-center text-[11px] text-amber-400/90 font-medium mt-2">
            ⚠️ Please confirm you are 18+ to unlock entry
          </p>
        )}
      </div>
    </div>
  );
};
