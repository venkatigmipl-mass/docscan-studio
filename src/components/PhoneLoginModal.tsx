import React, { useState, useEffect } from 'react';
import { Phone, KeyRound, Sparkles, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import { AppLanguage } from '../types/chatnest';
import { getT } from '../services/i18n';

interface PhoneLoginModalProps {
  language: AppLanguage;
  onLoginSuccess: (phoneNumber: string) => void;
  onBackToOnboarding: () => void;
}

export const PhoneLoginModal: React.FC<PhoneLoginModalProps> = ({
  language,
  onLoginSuccess,
  onBackToOnboarding
}) => {
  const t = getT(language);
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('98765 43210');
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let timer: number;
    if (step === 'otp' && resendTimer > 0) {
      timer = window.setInterval(() => {
        setResendTimer((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, resendTimer]);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      setErrorMsg('Please enter a phone number');
      return;
    }
    setErrorMsg('');
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep('otp');
      setResendTimer(30);
      setOtp('1234'); // Pre-fill suggested demo OTP for instant convenience!
    }, 600);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) {
      setErrorMsg('Please enter any 4 digits (e.g. 1 2 3 4)');
      return;
    }
    setErrorMsg('');
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess(`${countryCode} ${phone}`);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between overflow-y-auto px-4 py-8 pt-safe pb-safe animate-in fade-in">
      <div className="max-w-md w-full mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBackToOnboarding}
            className="text-xs text-slate-400 hover:text-white font-medium p-2 -ml-2 rounded-xl"
          >
            ← Back
          </button>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('demo_mode')}</span>
          </div>
        </div>

        {/* Branding badge */}
        <div className="text-center pt-2">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-3xl mb-3">
            {step === 'phone' ? '📱' : '🔐'}
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            {step === 'phone' ? t('phone_login') : t('otp_label')}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            {step === 'phone' 
              ? 'Enter your mobile number to receive a simulated one-time passcode.' 
              : `Code sent to ${countryCode} ${phone}`}
          </p>
        </div>

        {step === 'phone' ? (
          /* Step 1: Phone Input */
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                {t('phone_label')}
              </label>

              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-white rounded-2xl px-3 py-3 text-sm font-semibold focus:outline-none focus:border-indigo-500 min-h-[48px]"
                >
                  <option value="+91">🇮🇳 +91</option>
                  <option value="+1">🇺🇸 +1</option>
                  <option value="+44">🇬🇧 +44</option>
                  <option value="+65">🇸🇬 +65</option>
                  <option value="+971">🇦🇪 +971</option>
                  <option value="+60">🇲🇾 +60</option>
                </select>

                <div className="relative flex-1">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="98765 43210"
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-2xl pl-10 pr-4 py-3 text-sm font-semibold focus:outline-none focus:border-indigo-500 min-h-[48px]"
                    required
                  />
                </div>
              </div>

              {errorMsg && (
                <p className="text-xs text-rose-400 font-medium">{errorMsg}</p>
              )}

              <div className="pt-2 flex items-center gap-2 text-[11px] text-emerald-400 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Simulated login: no real SMS will be charged or sent.</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full min-h-[50px] bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:brightness-110 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-98 cursor-pointer"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Send Verification Code</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* Step 2: OTP Input */
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
              <div className="text-center">
                <span className="text-xs font-bold text-indigo-400 block mb-1">
                  {t('otp_hint')}
                </span>
                <p className="text-[11px] text-slate-400">
                  Any 4 digits are accepted in demo mode.
                </p>
              </div>

              <div className="flex justify-center gap-3">
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className="w-12 h-14 bg-slate-800 border-2 border-slate-700 focus-within:border-indigo-500 rounded-2xl flex items-center justify-center text-xl font-black text-white"
                  >
                    <input
                      type="text"
                      maxLength={1}
                      value={otp[idx] || ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        const newOtp = otp.split('');
                        newOtp[idx] = val;
                        setOtp(newOtp.join(''));
                      }}
                      className="w-full h-full bg-transparent text-center focus:outline-none"
                    />
                  </div>
                ))}
              </div>

              {errorMsg && (
                <p className="text-xs text-rose-400 text-center font-medium">{errorMsg}</p>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Change number
                </button>
                <button
                  type="button"
                  disabled={resendTimer > 0}
                  onClick={() => {
                    setResendTimer(30);
                    setOtp('5678');
                  }}
                  className={`text-xs font-semibold ${
                    resendTimer > 0 ? 'text-slate-500 cursor-not-allowed' : 'text-indigo-400 hover:underline cursor-pointer'
                  }`}
                >
                  {resendTimer > 0 ? `${t('resend_otp')} (${resendTimer}s)` : t('resend_otp')}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || otp.length < 4}
              className={`w-full min-h-[50px] font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 ${
                otp.length >= 4
                  ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-indigo-600/30 hover:brightness-110 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/60'
              }`}
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>{t('verify_otp')}</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>

      <div className="max-w-md w-full mx-auto text-center pt-4">
        <p className="text-[10px] text-slate-500">
          ChatNest Demo Prototype • 100% Offline Simulation
        </p>
      </div>
    </div>
  );
};
