import React, { useState } from 'react';
import { 
  X, 
  MessageSquare, 
  PhoneCall, 
  Video, 
  UserPlus, 
  UserCheck, 
  ShieldAlert, 
  UserX, 
  MapPin, 
  Globe 
} from 'lucide-react';
import { User, AppLanguage } from '../types/chatnest';
import { getT } from '../services/i18n';
import { ConfirmDialog } from './ConfirmDialog';

interface UserProfileModalProps {
  user: User;
  language: AppLanguage;
  onOpenChat: (user: User) => void;
  onStartVoiceCall: (user: User) => void;
  onStartVideoCall: (user: User) => void;
  onToggleFriend: (user: User) => void;
  onBlockUser: (user: User) => void;
  onReportUser: (user: User) => void;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  user,
  language,
  onOpenChat,
  onStartVoiceCall,
  onStartVideoCall,
  onToggleFriend,
  onBlockUser,
  onReportUser,
  onClose
}) => {
  const t = getT(language);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);

  return (
    <>
      <div 
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
      >
        <div 
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 pb-safe animate-in slide-in-from-bottom-6 overflow-hidden relative"
        >
          {/* Top banner accent */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 min-h-[38px] min-w-[38px] p-2 text-slate-400 hover:text-white rounded-xl"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* User Avatar & Status */}
          <div className="flex flex-col items-center text-center pt-3">
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-slate-800 border-2 border-indigo-500/40 flex items-center justify-center text-5xl shadow-xl">
                {user.avatar}
              </div>
              {user.isOnline && (
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900" />
              )}
            </div>

            <h3 className="text-lg font-black text-white mt-2.5">
              {user.name}
            </h3>
            <p className="text-xs text-indigo-400 font-semibold">{user.handle}</p>

            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
              <span>{user.age} yrs</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {user.city || 'India'}
              </span>
              <span>•</span>
              <span className="px-1.5 py-0.2 bg-indigo-500/10 text-indigo-400 rounded text-[10px] font-bold">
                {user.language.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Bio */}
          <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60 text-xs text-slate-200 leading-relaxed text-center">
            {user.bio}
          </div>

          {/* Interests */}
          <div className="flex flex-wrap justify-center gap-1.5">
            {user.interests.map((tag, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-xl text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700/60"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Action Buttons: Chat, Voice, Video, Friend */}
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800">
            <button
              onClick={() => {
                onClose();
                onOpenChat(user);
              }}
              className="min-h-[46px] flex flex-col items-center justify-center p-2 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 active:scale-95 transition-transform"
              title="Chat"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="text-[10px] font-bold mt-1">Chat</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onStartVoiceCall(user);
              }}
              className="min-h-[46px] flex flex-col items-center justify-center p-2 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 active:scale-95 transition-transform"
              title="Voice Call"
            >
              <PhoneCall className="w-4 h-4" />
              <span className="text-[10px] font-bold mt-1">Voice</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onStartVideoCall(user);
              }}
              className="min-h-[46px] flex flex-col items-center justify-center p-2 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30 active:scale-95 transition-transform"
              title="Video Call"
            >
              <Video className="w-4 h-4" />
              <span className="text-[10px] font-bold mt-1">Video</span>
            </button>

            <button
              onClick={() => onToggleFriend(user)}
              className={`min-h-[46px] flex flex-col items-center justify-center p-2 rounded-2xl border active:scale-95 transition-transform ${
                user.isFriend
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
              title="Friend"
            >
              {user.isFriend ? (
                <UserCheck className="w-4 h-4" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              <span className="text-[10px] font-bold mt-1">
                {user.isFriend ? 'Friend' : 'Add'}
              </span>
            </button>
          </div>

          {/* Safety Actions: Block and Report */}
          <div className="flex gap-2 pt-1 border-t border-slate-800/80">
            <button
              onClick={() => onReportUser(user)}
              className="flex-1 min-h-[40px] px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{t('report_user')}</span>
            </button>

            <button
              onClick={() => setShowBlockConfirm(true)}
              className="flex-1 min-h-[40px] px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <UserX className="w-3.5 h-3.5" />
              <span>{t('block_user')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Block Confirm Dialog */}
      <ConfirmDialog
        isOpen={showBlockConfirm}
        title={`Block ${user.name}?`}
        message="This user will be hidden from people online, rooms, chats, and friends list. You can unblock anytime from Settings."
        confirmLabel="Block User"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={() => {
          setShowBlockConfirm(false);
          onClose();
          onBlockUser(user);
        }}
        onCancel={() => setShowBlockConfirm(false)}
      />
    </>
  );
};
