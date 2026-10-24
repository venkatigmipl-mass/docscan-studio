import React, { useState } from 'react';
import { ShieldAlert, X, CheckCircle2 } from 'lucide-react';
import { User, AppLanguage } from '../types/chatnest';
import { getT } from '../services/i18n';

interface ReportModalProps {
  targetUser?: User | null;
  messageText?: string | null;
  language: AppLanguage;
  onSubmitReport: (reason: string, details: string) => void;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  targetUser,
  messageText,
  language,
  onSubmitReport,
  onClose
}) => {
  const t = getT(language);
  const [selectedReason, setSelectedReason] = useState('Harassment or Bullying');
  const [details, setDetails] = useState('');

  const reasons = [
    'Harassment or Bullying',
    'Spam or Scamming',
    'Inappropriate Content',
    'Hate Speech or Abusive Language',
    'Impersonation or Fake Profile',
    'Other Safety Concern'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitReport(selectedReason, details);
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <span>
              {messageText ? t('report_message') : t('report_user')}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {targetUser && (
          <div className="p-2.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center gap-2.5 text-xs text-slate-300">
            <span className="text-xl">{targetUser.avatar}</span>
            <div>
              <span className="font-bold text-white block">{targetUser.name}</span>
              <span className="text-[11px] text-slate-400">{targetUser.handle}</span>
            </div>
          </div>
        )}

        {messageText && (
          <div className="p-2.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300 italic">
            "{messageText}"
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-2">
              Select Reason:
            </label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {reasons.map((r) => {
                const isSelected = selectedReason === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedReason(r)}
                    className={`w-full min-h-[40px] px-3 py-2 rounded-xl text-left text-xs font-medium border flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-rose-500/20 border-rose-500 text-white font-semibold'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{r}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Additional Details (Optional):
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide more context for our demo safety team..."
              rows={2}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[44px] bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 min-h-[44px] bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-600/30 active:scale-95 transition-all"
            >
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
