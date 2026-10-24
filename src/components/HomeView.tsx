import React, { useState, useMemo } from 'react';
import { 
  MessageSquare, 
  PhoneCall, 
  Video, 
  UserPlus, 
  UserCheck, 
  Search, 
  Sparkles,
  MapPin
} from 'lucide-react';
import { User, AppLanguage } from '../types/chatnest';
import { getT } from '../services/i18n';

interface HomeViewProps {
  users: User[];
  currentLanguage: AppLanguage;
  onOpenChat: (user: User) => void;
  onStartVoiceCall: (user: User) => void;
  onStartVideoCall: (user: User) => void;
  onToggleFriend: (user: User) => void;
  onSelectUserDetail: (user: User) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  users,
  currentLanguage,
  onOpenChat,
  onStartVoiceCall,
  onStartVideoCall,
  onToggleFriend,
  onSelectUserDetail
}) => {
  const t = getT(currentLanguage);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLangFilter, setSelectedLangFilter] = useState<'all' | AppLanguage>('all');
  const [activeStoryUser, setActiveStoryUser] = useState<User | null>(null);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (u.isBlocked) return false;
      if (selectedLangFilter !== 'all' && u.language !== selectedLangFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.handle.toLowerCase().includes(q) ||
        u.bio.toLowerCase().includes(q) ||
        (u.city && u.city.toLowerCase().includes(q)) ||
        u.interests.some((tag) => tag.toLowerCase().includes(q))
      );
    });
  }, [users, selectedLangFilter, searchQuery]);

  const langLabels: Record<AppLanguage, string> = {
    en: 'English',
    ta: 'தமிழ்',
    hi: 'हिन्दी',
    te: 'తెలుగు'
  };

  return (
    <div className="pb-24 pt-2 px-4 max-w-md mx-auto space-y-4">
      {/* Quick Stories / Vibes Carousel */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs px-1">
          <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
            Live Nest Vibes ⚡
          </span>
          <span className="text-[10px] text-slate-400">12 online now</span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1.5 pt-1 scrollbar-none -mx-4 px-4">
          {users.slice(0, 8).map((user) => (
            <button
              key={user.id}
              onClick={() => setActiveStoryUser(user)}
              className="flex flex-col items-center gap-1 shrink-0 group focus:outline-none"
            >
              <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-indigo-500 via-pink-500 to-amber-400 group-hover:scale-105 transition-transform duration-200">
                <div className="w-14 h-14 rounded-full bg-slate-900 flex items-center justify-center text-2xl border-2 border-slate-900">
                  {user.avatar}
                </div>
                <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900" />
              </div>
              <span className="text-[11px] font-medium text-slate-300 w-14 truncate text-center">
                {user.name.split(' ')[0]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Story Popup Modal */}
      {activeStoryUser && (
        <div 
          onClick={() => setActiveStoryUser(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xs bg-slate-900 border border-slate-800 rounded-3xl p-5 text-center shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-pink-500 to-amber-400" />
            <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-indigo-500 mx-auto flex items-center justify-center text-3xl mb-3 shadow-lg">
              {activeStoryUser.avatar}
            </div>
            <h4 className="text-base font-bold text-white">{activeStoryUser.name}</h4>
            <p className="text-xs text-indigo-400 mb-3">{activeStoryUser.handle}</p>
            <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60 mb-4 text-xs text-slate-200 italic">
              "{activeStoryUser.storyText || 'Enjoying ChatNest today! ✨'}"
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const u = activeStoryUser;
                  setActiveStoryUser(null);
                  onOpenChat(u);
                }}
                className="flex-1 min-h-[44px] bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Say Hi</span>
              </button>
              <button
                onClick={() => setActiveStoryUser(null)}
                className="min-h-[44px] px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('search_placeholder')}
          className="w-full bg-slate-900/90 border border-slate-800 text-slate-100 rounded-2xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500 placeholder:text-slate-500 min-h-[44px]"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
          >
            Clear
          </button>
        )}
      </div>

      {/* Language Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4">
        <button
          onClick={() => setSelectedLangFilter('all')}
          className={`min-h-[36px] px-3 py-1 rounded-xl text-xs font-semibold shrink-0 transition-all ${
            selectedLangFilter === 'all'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
          }`}
        >
          All Languages
        </button>
        {(['en', 'ta', 'hi', 'te'] as AppLanguage[]).map((lang) => (
          <button
            key={lang}
            onClick={() => setSelectedLangFilter(lang)}
            className={`min-h-[36px] px-3 py-1 rounded-xl text-xs font-semibold shrink-0 transition-all ${
              selectedLangFilter === lang
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            {langLabels[lang]}
          </button>
        ))}
      </div>

      {/* Section Header */}
      <div className="flex items-center justify-between pt-1">
        <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
          <span>{t('people_online')}</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </h3>
        <span className="text-[11px] text-slate-400 font-medium">
          {filteredUsers.length} available
        </span>
      </div>

      {/* Empty State */}
      {filteredUsers.length === 0 && (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-8 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-800 flex items-center justify-center text-2xl">
            🔍
          </div>
          <p className="text-sm font-semibold text-slate-300">No friends found</p>
          <p className="text-xs text-slate-400">Try adjusting your search query or language filter.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedLangFilter('all');
            }}
            className="min-h-[44px] px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl"
          >
            Show All People
          </button>
        </div>
      )}

      {/* 12 Fake Users Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-3xl p-3.5 shadow-md flex flex-col justify-between transition-all duration-200"
          >
            {/* Top row: Avatar + Info */}
            <div 
              onClick={() => onSelectUserDetail(user)}
              className="flex items-start gap-3 cursor-pointer group"
            >
              <div className="relative shrink-0">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center text-3xl shadow-md border border-slate-700/50 group-hover:scale-105 transition-transform">
                  {user.avatar}
                </div>
                {/* Green online dot */}
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900 ring-1 ring-emerald-400" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-sm font-bold text-white truncate group-hover:text-indigo-400 transition-colors">
                    {user.name}
                  </h4>
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
                    {langLabels[user.language]}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                  <span>{user.age} yrs</span>
                  <span>•</span>
                  <span className="flex items-center gap-0.5">
                    <MapPin className="w-2.5 h-2.5" />
                    {user.city}
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 line-clamp-1 mt-1 leading-snug">
                  {user.bio}
                </p>
              </div>
            </div>

            {/* Interest Tags */}
            <div className="flex flex-wrap gap-1 mt-2 mb-3">
              {user.interests.slice(0, 3).map((tag, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700/40"
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* 4 Action Buttons: Chat, Add Friend, Voice Call, Video Call */}
            <div className="grid grid-cols-4 gap-1.5 pt-1 border-t border-slate-800/80">
              {/* Chat Button */}
              <button
                onClick={() => onOpenChat(user)}
                className="min-h-[44px] flex flex-col items-center justify-center p-1.5 rounded-xl bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-400 border border-indigo-500/30 transition-all active:scale-95"
                title={t('chat_now')}
              >
                <MessageSquare className="w-4 h-4" />
                <span className="text-[10px] font-semibold mt-0.5">{t('chat_now')}</span>
              </button>

              {/* Add / Toggle Friend */}
              <button
                onClick={() => onToggleFriend(user)}
                className={`min-h-[44px] flex flex-col items-center justify-center p-1.5 rounded-xl border transition-all active:scale-95 ${
                  user.isFriend
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                    : user.hasOutgoingRequest
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
                title={user.isFriend ? 'Friend' : user.hasOutgoingRequest ? 'Requested' : t('add_friend')}
              >
                {user.isFriend ? (
                  <UserCheck className="w-4 h-4" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                <span className="text-[10px] font-semibold mt-0.5 truncate max-w-full">
                  {user.isFriend ? t('friends') : user.hasOutgoingRequest ? t('requested') : '+ Friend'}
                </span>
              </button>

              {/* Voice Call */}
              <button
                onClick={() => onStartVoiceCall(user)}
                className="min-h-[44px] flex flex-col items-center justify-center p-1.5 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-400 border border-emerald-500/30 transition-all active:scale-95"
                title={t('call_voice')}
              >
                <PhoneCall className="w-4 h-4" />
                <span className="text-[10px] font-semibold mt-0.5">Voice</span>
              </button>

              {/* Video Call */}
              <button
                onClick={() => onStartVideoCall(user)}
                className="min-h-[44px] flex flex-col items-center justify-center p-1.5 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 text-purple-400 border border-purple-500/30 transition-all active:scale-95"
                title={t('call_video')}
              >
                <Video className="w-4 h-4" />
                <span className="text-[10px] font-semibold mt-0.5">Video</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
