import { X, Sparkles, AlertCircle } from 'lucide-react';
import { triggerConfetti } from '../utils/confetti';
import { GiftItem, AppLanguage } from '../types/chatnest';
import { INITIAL_GIFTS } from '../services/mockData';
import { SoundEffects } from '../services/soundEffects';

interface GiftPickerModalProps {
  userCoins: number;
  recipientName: string;
  recipientAvatar: string;
  language: AppLanguage;
  onSelectGift: (gift: GiftItem) => void;
  onClaimDailyBonus: () => void;
  onClose: () => void;
}

export const GiftPickerModal: React.FC<GiftPickerModalProps> = ({
  userCoins,
  recipientName,
  recipientAvatar,
  onSelectGift,
  onClaimDailyBonus,
  onClose
}) => {
  const handleSend = (gift: GiftItem) => {
    if (userCoins < gift.cost) return;

    // Trigger celebratory confetti burst!
    try {
      triggerConfetti({ count: 40, y: 0.8 });
    } catch (e) {
      console.warn('Confetti error:', e);
    }

    SoundEffects.playGiftChime();
    onSelectGift(gift);
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center animate-in fade-in"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto pb-safe animate-in slide-in-from-bottom-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-xl">
              🎁
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Send Gift to {recipientName}
              </h3>
              <p className="text-[11px] text-slate-400">
                Show love and appreciation with a digital gift!
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="min-h-[38px] min-w-[38px] p-2 text-slate-400 hover:text-white rounded-xl"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Balance Chip */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/90 border border-slate-700/80">
          <div className="flex items-center gap-2">
            <span className="text-lg">🪙</span>
            <div>
              <span className="text-xs font-bold text-white">Your Balance:</span>
              <span className="text-xs font-extrabold text-amber-400 ml-1.5">
                {userCoins.toLocaleString()} Coins
              </span>
            </div>
          </div>

          <button
            onClick={onClaimDailyBonus}
            className="min-h-[36px] px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-1 active:scale-95 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>+150 Free</span>
          </button>
        </div>

        {/* 8 Gifts Grid */}
        <div className="grid grid-cols-4 gap-2.5">
          {INITIAL_GIFTS.map((gift) => {
            const canAfford = userCoins >= gift.cost;

            return (
              <button
                key={gift.id}
                onClick={() => handleSend(gift)}
                disabled={!canAfford}
                className={`min-h-[88px] p-2.5 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
                  canAfford
                    ? 'bg-slate-800/80 hover:bg-slate-750 border-slate-700 hover:border-amber-500/50 cursor-pointer shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 opacity-40 cursor-not-allowed'
                }`}
              >
                <span className="text-2xl hover:scale-125 transition-transform">
                  {gift.emoji}
                </span>
                <span className="text-[11px] font-bold text-white truncate max-w-full">
                  {gift.name}
                </span>
                <div className="flex items-center gap-1 text-[10px] font-extrabold text-amber-400">
                  <span>🪙</span>
                  <span>{gift.cost}</span>
                </div>
              </button>
            );
          })}
        </div>

        <p className="text-[10px] text-center text-slate-500">
          * Demo gifts use simulated coins only. No real money or payment is processed.
        </p>
      </div>
    </div>
  );
};
