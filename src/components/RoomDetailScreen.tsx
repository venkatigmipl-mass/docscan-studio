import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  Hand, 
  Send, 
  Mic, 
  MicOff, 
  ArrowLeft, 
  Sparkles, 
  Heart, 
  Flame, 
  Coffee, 
  PartyPopper,
  Radio
} from 'lucide-react';
import { Room, RoomChatMessage, RoomSpeaker, AppLanguage } from '../types/chatnest';
import { getT } from '../services/i18n';
import { SoundEffects } from '../services/soundEffects';

interface RoomDetailScreenProps {
  room: Room;
  language: AppLanguage;
  onLeaveRoom: () => void;
  onSendRoomGift?: () => void;
}

export const RoomDetailScreen: React.FC<RoomDetailScreenProps> = ({
  room,
  language,
  onLeaveRoom
}) => {
  const t = getT(language);
  const [speakers, setSpeakers] = useState<RoomSpeaker[]>(room.speakers);
  const [messages, setMessages] = useState<RoomChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isGrantedSpeaker, setIsGrantedSpeaker] = useState(false);
  const [isMyMicMuted, setIsMyMicMuted] = useState(true);
  const [floatingReactions, setFloatingReactions] = useState<{ id: string; emoji: string; left: number }[]>([]);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const msgIndexRef = useRef(0);

  // Initialize initial 2 messages
  useEffect(() => {
    const initialMsgs: RoomChatMessage[] = [
      {
        id: 'init_1',
        userId: room.speakers[0]?.id || 'sp_1',
        userName: room.speakers[0]?.name || 'Host',
        userAvatar: room.speakers[0]?.avatar || '🌸',
        text: room.preparedMessages[0] || 'Welcome to the room everyone! 👋',
        timestamp: Date.now() - 15000
      },
      {
        id: 'init_2',
        userId: room.speakers[1]?.id || 'sp_2',
        userName: room.speakers[1]?.name || 'Co-Host',
        userAvatar: room.speakers[1]?.avatar || '✨',
        text: room.preparedMessages[1] || 'Great to see so many people joining today!',
        timestamp: Date.now() - 6000
      }
    ];
    setMessages(initialMsgs);
    msgIndexRef.current = 2;
  }, [room]);

  // Periodic simulation: Auto-send messages from prepared list every 4 seconds!
  useEffect(() => {
    const interval = window.setInterval(() => {
      if (room.preparedMessages && room.preparedMessages.length > 0) {
        const nextIdx = msgIndexRef.current % room.preparedMessages.length;
        const randomSpeaker = room.speakers[Math.floor(Math.random() * room.speakers.length)];
        const newMsg: RoomChatMessage = {
          id: `room_msg_${Date.now()}`,
          userId: randomSpeaker?.id || 'sp_x',
          userName: randomSpeaker?.name || 'Friendly Member',
          userAvatar: randomSpeaker?.avatar || '🐣',
          text: room.preparedMessages[nextIdx],
          timestamp: Date.now()
        };

        setMessages((prev) => [...prev.slice(-30), newMsg]);
        msgIndexRef.current += 1;
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [room]);

  // Periodic simulation: Speaking animation toggles among speakers
  useEffect(() => {
    const speakTimer = window.setInterval(() => {
      setSpeakers((prev) =>
        prev.map((speaker, idx) => {
          // Keep host usually active, randomize other 1 or 2 speakers
          if (speaker.isHost) {
            return { ...speaker, isSpeaking: Math.random() > 0.3 };
          }
          if (idx === 1 || idx === 3) {
            return { ...speaker, isSpeaking: Math.random() > 0.5 };
          }
          return { ...speaker, isSpeaking: Math.random() > 0.8 };
        })
      );
    }, 2500);

    return () => clearInterval(speakTimer);
  }, []);

  // Auto scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMsg: RoomChatMessage = {
      id: `user_room_${Date.now()}`,
      userId: 'me',
      userName: 'You',
      userAvatar: '🦊',
      text: inputMessage.trim(),
      timestamp: Date.now()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    SoundEffects.playMessagePop();
  };

  const handleRaiseHand = () => {
    if (isGrantedSpeaker) return;
    setIsHandRaised(!isHandRaised);

    if (!isHandRaised) {
      // Host automatically grants speaker status after 3.5 seconds
      setTimeout(() => {
        setIsGrantedSpeaker(true);
        setIsHandRaised(false);
        setIsMyMicMuted(false);
        // Add user to speakers stage
        setSpeakers((prev) => [
          ...prev,
          {
            id: 'me_speaker',
            name: 'You',
            avatar: '🦊',
            isSpeaking: true,
            isMuted: false,
            role: 'Guest Speaker'
          }
        ]);
        SoundEffects.playConnectedTone();
      }, 3500);
    }
  };

  const spawnReaction = (emoji: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    const left = Math.floor(Math.random() * 70) + 15;
    setFloatingReactions((prev) => [...prev, { id, emoji, left }]);
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col justify-between pt-safe pb-safe animate-in slide-in-from-bottom-4 overflow-hidden">
      {/* Floating Reaction Emojis layer */}
      <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
        {floatingReactions.map((r) => (
          <div
            key={r.id}
            style={{ left: `${r.left}%` }}
            className="absolute bottom-28 text-3xl animate-float-up pointer-events-none drop-shadow-lg"
          >
            {r.emoji}
          </div>
        ))}
      </div>

      {/* Top Bar: Room Title & Leave */}
      <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between z-30">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onLeaveRoom}
            className="min-h-[44px] min-w-[44px] -ml-2 p-2 rounded-xl text-slate-400 hover:text-white flex items-center justify-center"
            title="Leave room"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-white line-clamp-1">
                {room.title}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <Radio className="w-3 h-3 animate-pulse" />
                Live Voice Room
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {room.listenersCount} {t('listening')}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-md">
            Demo Mode
          </span>
          <button
            onClick={onLeaveRoom}
            className="min-h-[40px] px-3.5 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition-all active:scale-95"
          >
            {t('leave_room')}
          </button>
        </div>
      </div>

      {/* Main Content Area: Stage (Top) + Chat (Bottom) */}
      <div className="flex-1 overflow-y-auto flex flex-col justify-between p-4 space-y-4">
        {/* Stage Area: 8 Speakers with Speaking Animation */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>{t('speakers')} ({speakers.length})</span>
            </span>
            <span className="text-[10px] text-indigo-400 font-medium">
              Stage Active
            </span>
          </div>

          {/* 8 Speakers Grid */}
          <div className="grid grid-cols-4 gap-3 text-center">
            {speakers.map((sp) => (
              <div key={sp.id} className="flex flex-col items-center">
                <div className="relative">
                  {/* Glowing speaking animation ring */}
                  {sp.isSpeaking && (
                    <div className="absolute -inset-1 rounded-2xl bg-emerald-500 animate-pulse opacity-75 blur-xs" />
                  )}

                  <div
                    className={`relative w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-md transition-transform ${
                      sp.isSpeaking
                        ? 'bg-slate-800 border-2 border-emerald-400 scale-105'
                        : 'bg-slate-800 border border-slate-700/80'
                    }`}
                  >
                    {sp.avatar}
                    {/* Speaking badge icon */}
                    <span
                      className={`absolute -bottom-1 -right-1 p-0.5 rounded-full border border-slate-900 ${
                        sp.isSpeaking ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {sp.isMuted ? (
                        <MicOff className="w-2.5 h-2.5" />
                      ) : (
                        <Mic className="w-2.5 h-2.5" />
                      )}
                    </span>
                  </div>
                </div>

                <span className="text-[11px] font-bold text-slate-200 mt-1 truncate w-16">
                  {sp.name}
                </span>
                <span className="text-[9px] text-slate-400 -mt-0.5 truncate w-16">
                  {sp.role || (sp.isHost ? 'Host' : 'Speaker')}
                </span>
              </div>
            ))}
          </div>

          {/* Hand raised status banner */}
          {isHandRaised && (
            <div className="mt-3 p-2 bg-amber-500/15 border border-amber-500/30 rounded-xl text-center text-xs text-amber-300 font-semibold flex items-center justify-center gap-2 animate-pulse">
              <Hand className="w-4 h-4 text-amber-400" />
              <span>Hand raised! Host will bring you up on mic shortly...</span>
            </div>
          )}

          {isGrantedSpeaker && (
            <div className="mt-3 p-2 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-center text-xs text-emerald-300 font-semibold flex items-center justify-between px-3">
              <span className="flex items-center gap-1.5">
                <Mic className="w-4 h-4 text-emerald-400 animate-bounce" />
                <span>You have speaking privileges!</span>
              </span>
              <button
                onClick={() => setIsMyMicMuted(!isMyMicMuted)}
                className={`min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-bold ${
                  isMyMicMuted ? 'bg-rose-500 text-white' : 'bg-emerald-600 text-white'
                }`}
              >
                {isMyMicMuted ? 'Unmute' : 'Mute'}
              </button>
            </div>
          )}
        </div>

        {/* Live Room Text Chat Messages Container */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-3 shadow-xl flex-1 flex flex-col justify-between min-h-[190px] max-h-[260px] overflow-hidden">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px] text-slate-400 font-semibold">
            <span>{t('room_chat')}</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Stream
            </span>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto space-y-2 py-2 pr-1">
            {messages.map((m) => {
              const isMe = m.userId === 'me';
              return (
                <div key={m.id} className="flex items-start gap-2 text-xs">
                  <span className="text-sm shrink-0 mt-0.5">{m.userAvatar}</span>
                  <div className="bg-slate-800/80 rounded-2xl px-2.5 py-1.5 max-w-[85%] border border-slate-700/50">
                    <span className={`font-bold text-[11px] mr-1 ${isMe ? 'text-indigo-400' : 'text-slate-300'}`}>
                      {m.userName}:
                    </span>
                    <span className="text-slate-200">{m.text}</span>
                  </div>
                </div>
              );
            })}
            <div ref={chatBottomRef} />
          </div>

          {/* Quick Reaction Buttons */}
          <div className="flex items-center justify-around py-1.5 border-t border-slate-800/80 -mx-1">
            <button
              onClick={() => spawnReaction('❤️')}
              className="p-1 text-lg hover:scale-125 transition-transform active:scale-95 min-h-[36px] min-w-[36px] flex items-center justify-center"
              title="Love"
            >
              ❤️
            </button>
            <button
              onClick={() => spawnReaction('🔥')}
              className="p-1 text-lg hover:scale-125 transition-transform active:scale-95 min-h-[36px] min-w-[36px] flex items-center justify-center"
              title="Fire"
            >
              🔥
            </button>
            <button
              onClick={() => spawnReaction('👏')}
              className="p-1 text-lg hover:scale-125 transition-transform active:scale-95 min-h-[36px] min-w-[36px] flex items-center justify-center"
              title="Clap"
            >
              👏
            </button>
            <button
              onClick={() => spawnReaction('☕')}
              className="p-1 text-lg hover:scale-125 transition-transform active:scale-95 min-h-[36px] min-w-[36px] flex items-center justify-center"
              title="Chai"
            >
              ☕
            </button>
            <button
              onClick={() => spawnReaction('🎉')}
              className="p-1 text-lg hover:scale-125 transition-transform active:scale-95 min-h-[36px] min-w-[36px] flex items-center justify-center"
              title="Party"
            >
              🎉
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Bar: Input + Raise Hand */}
      <div className="px-4 py-3 bg-slate-900 border-t border-slate-800 z-30">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          {/* Raise Hand Button */}
          <button
            type="button"
            onClick={handleRaiseHand}
            disabled={isGrantedSpeaker}
            className={`min-h-[48px] min-w-[48px] px-3 rounded-2xl flex items-center justify-center gap-1 text-xs font-bold transition-all active:scale-95 ${
              isGrantedSpeaker
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : isHandRaised
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/30 animate-pulse'
                : 'bg-slate-800 text-slate-300 border border-slate-700 hover:text-white'
            }`}
            title={isHandRaised ? t('hand_raised') : t('raise_hand')}
          >
            <Hand className="w-5 h-5" />
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={t('type_message')}
            className="flex-1 min-h-[48px] bg-slate-800 border border-slate-700 text-white rounded-2xl px-4 py-2 text-xs focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputMessage.trim()}
            className="min-h-[48px] min-w-[48px] bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-2xl flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-md shadow-indigo-600/30"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
