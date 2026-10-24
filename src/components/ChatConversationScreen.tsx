import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  PhoneCall, 
  Video, 
  Send, 
  Gift, 
  MoreVertical, 
  ShieldAlert, 
  UserX, 
  Trash2, 
  CheckCheck,
  Smile
} from 'lucide-react';
import { User, ChatMessage, GiftItem, AppLanguage } from '../types/chatnest';
import { getT } from '../services/i18n';
import { SoundEffects } from '../services/soundEffects';
import { FRIENDLY_AUTO_REPLIES } from '../services/mockData';

interface ChatConversationScreenProps {
  peerUser: User;
  messages: ChatMessage[];
  language: AppLanguage;
  onBack: () => void;
  onSendMessage: (text: string, gift?: GiftItem) => void;
  onReceiveAutoReply: (text: string) => void;
  onStartVoiceCall: (user: User) => void;
  onStartVideoCall: (user: User) => void;
  onOpenGiftPicker: () => void;
  onOpenUserProfile: (user: User) => void;
  onBlockUser: (user: User) => void;
  onReportUser: (user: User) => void;
  onReportMessage: (msg: ChatMessage) => void;
  onClearChat: () => void;
}

export const ChatConversationScreen: React.FC<ChatConversationScreenProps> = ({
  peerUser,
  messages,
  language,
  onBack,
  onSendMessage,
  onReceiveAutoReply,
  onStartVoiceCall,
  onStartVideoCall,
  onOpenGiftPicker,
  onOpenUserProfile,
  onBlockUser,
  onReportUser,
  onReportMessage,
  onClearChat
}) => {
  const t = getT(language);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever messages update or typing toggles
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const quickChips = [
    'Hey! How are you doing? 😊',
    'Chai time! ☕',
    'Free for a quick voice call?',
    'Loved your profile! ✨',
    'Which song are you listening to? 🎶'
  ];

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    onSendMessage(text.trim());
    setInputText('');
    SoundEffects.playMessagePop();

    // Trigger typing indicator and simulated auto-reply after 1.2 - 2 seconds!
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const replyPool = FRIENDLY_AUTO_REPLIES[peerUser.id] || FRIENDLY_AUTO_REPLIES.default;
        const randomReply = replyPool[Math.floor(Math.random() * replyPool.length)];
        onReceiveAutoReply(randomReply);
        SoundEffects.playMessagePop();
      }, 1600);
    }, 800);
  };

  const formatMessageTime = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col justify-between pt-safe pb-safe animate-in slide-in-from-right-4 overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2.5 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between z-30">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="min-h-[44px] min-w-[44px] -ml-1 p-2 rounded-xl text-slate-400 hover:text-white flex items-center justify-center active:scale-95"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div
            onClick={() => onOpenUserProfile(peerUser)}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl shadow-sm group-hover:scale-105 transition-transform">
                {peerUser.avatar}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900" />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                  {peerUser.name}
                </h4>
                <span className="px-1 py-0.2 text-[8px] font-bold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded">
                  Demo
                </span>
              </div>
              <p className="text-[10px] text-emerald-400 font-medium">
                {isTyping ? `${peerUser.name.split(' ')[0]} is typing...` : 'Online'}
              </p>
            </div>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          {/* Voice Call */}
          <button
            onClick={() => onStartVoiceCall(peerUser)}
            className="min-h-[40px] min-w-[40px] p-2 text-slate-300 hover:text-emerald-400 rounded-xl hover:bg-slate-800 transition-colors active:scale-95"
            title={t('call_voice')}
          >
            <PhoneCall className="w-4 h-4" />
          </button>

          {/* Video Call */}
          <button
            onClick={() => onStartVideoCall(peerUser)}
            className="min-h-[40px] min-w-[40px] p-2 text-slate-300 hover:text-purple-400 rounded-xl hover:bg-slate-800 transition-colors active:scale-95"
            title={t('call_video')}
          >
            <Video className="w-4 h-4" />
          </button>

          {/* More menu dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="min-h-[40px] min-w-[40px] p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              title="Options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showOptions && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowOptions(false)} 
                />
                <div className="absolute right-0 top-12 z-50 w-48 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-1.5 space-y-1 animate-in zoom-in-95">
                  <button
                    onClick={() => {
                      setShowOptions(false);
                      onOpenUserProfile(peerUser);
                    }}
                    className="w-full min-h-[38px] px-3 py-2 text-left text-xs font-semibold text-slate-200 hover:bg-slate-800 rounded-xl flex items-center gap-2"
                  >
                    <span>View Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowOptions(false);
                      onClearChat();
                    }}
                    className="w-full min-h-[38px] px-3 py-2 text-left text-xs font-semibold text-slate-300 hover:bg-slate-800 rounded-xl flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Chat</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowOptions(false);
                      onReportUser(peerUser);
                    }}
                    className="w-full min-h-[38px] px-3 py-2 text-left text-xs font-semibold text-amber-400 hover:bg-slate-800 rounded-xl flex items-center gap-2"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>{t('report_user')}</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowOptions(false);
                      onBlockUser(peerUser);
                    }}
                    className="w-full min-h-[38px] px-3 py-2 text-left text-xs font-semibold text-rose-400 hover:bg-rose-500/10 rounded-xl flex items-center gap-2"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    <span>{t('block_user')}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Safe notice */}
        <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center max-w-xs mx-auto text-[11px] text-slate-400">
          🔒 Messages are encrypted & stored locally for this demo.
        </div>

        {messages.map((msg) => {
          const isUser = msg.isUser;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} group`}
            >
              {/* Gift Message Card */}
              {msg.gift ? (
                <div className={`p-3 rounded-3xl border shadow-lg max-w-[80%] ${
                  isUser 
                    ? 'bg-gradient-to-tr from-amber-600/30 via-purple-600/20 to-indigo-600/30 border-amber-500/40 text-white' 
                    : 'bg-slate-900 border-amber-500/30 text-white'
                }`}>
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span className="text-3xl animate-bounce">{msg.gift.emoji}</span>
                    <div>
                      <span className="text-xs font-bold text-amber-300 block">
                        Sent {msg.gift.name}!
                      </span>
                      <span className="text-[10px] text-amber-400/80 font-mono">
                        🪙 {msg.gift.cost} Coins Gift
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-200">{msg.text}</p>
                </div>
              ) : (
                /* Regular Text Bubble */
                <div
                  className={`relative px-4 py-2.5 rounded-2xl max-w-[80%] text-xs leading-relaxed shadow-sm break-words ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-tr-xs'
                      : 'bg-slate-800 text-slate-100 rounded-tl-xs border border-slate-700/60'
                  }`}
                >
                  <p>{msg.text}</p>
                  <div className={`flex items-center justify-end gap-1 text-[9px] mt-1 ${isUser ? 'text-indigo-200' : 'text-slate-400'}`}>
                    <span>{formatMessageTime(msg.timestamp)}</span>
                    {isUser && <CheckCheck className="w-3 h-3 text-indigo-300" />}
                  </div>
                </div>
              )}

              {/* Message options button (Report message) */}
              {!isUser && (
                <button
                  onClick={() => onReportMessage(msg)}
                  className="opacity-0 group-hover:opacity-100 text-[10px] text-slate-500 hover:text-amber-400 transition-opacity mt-0.5 px-1"
                >
                  Report
                </button>
              )}
            </div>
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/80 px-3 py-2 rounded-2xl w-fit border border-slate-700/60 animate-in fade-in">
            <span className="text-sm">{peerUser.avatar}</span>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
            <span className="text-[11px]">{peerUser.name.split(' ')[0]} is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Reply Chips */}
      <div className="px-3 py-1.5 overflow-x-auto scrollbar-none flex gap-1.5 bg-slate-900/60 border-t border-slate-800/60">
        {quickChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(chip)}
            className="min-h-[32px] px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-slate-300 rounded-full text-xs shrink-0 active:scale-95 transition-transform"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input bar */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 z-30">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(inputText);
          }}
          className="flex items-center gap-2"
        >
          {/* Gift Trigger Button (🎁) */}
          <button
            type="button"
            onClick={onOpenGiftPicker}
            className="min-h-[48px] min-w-[48px] rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 flex items-center justify-center transition-all active:scale-95"
            title={t('send_gift')}
          >
            <Gift className="w-5 h-5" />
          </button>

          {/* Message Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={t('type_message')}
            className="flex-1 min-h-[48px] bg-slate-800 border border-slate-700 text-white rounded-2xl px-4 py-2 text-xs focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="min-h-[48px] min-w-[48px] bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-2xl flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-md shadow-indigo-600/30"
            title="Send"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
