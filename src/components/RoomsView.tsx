import React, { useState } from 'react';
import { Radio, Users, Sparkles, ChevronRight, Volume2 } from 'lucide-react';
import { Room, AppLanguage } from '../types/chatnest';
import { getT } from '../services/i18n';

interface RoomsViewProps {
  rooms: Room[];
  language: AppLanguage;
  onSelectRoom: (room: Room) => void;
}

export const RoomsView: React.FC<RoomsViewProps> = ({
  rooms,
  language,
  onSelectRoom
}) => {
  const t = getT(language);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Friendship', 'Music', 'Movies', 'Study', 'Tamil Talks', 'Late Night'];

  const filteredRooms = selectedCategory === 'All'
    ? rooms
    : rooms.filter((r) => r.category === selectedCategory);

  return (
    <div className="pb-24 pt-2 px-4 max-w-md mx-auto space-y-4">
      {/* Banner / Header */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-indigo-900/80 via-purple-900/80 to-slate-900 border border-indigo-500/30 shadow-lg relative overflow-hidden">
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-400">
              Live Voice Stages
            </span>
          </div>
          <h2 className="text-lg font-black text-white tracking-tight">
            {t('live_voice_rooms')}
          </h2>
          <p className="text-xs text-slate-300">
            Hop into live audio rooms, meet speakers, raise your hand, and chat with friends!
          </p>
        </div>
        <div className="absolute -bottom-4 -right-4 text-6xl opacity-20 pointer-events-none">
          📻
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`min-h-[36px] px-3.5 py-1 rounded-xl text-xs font-semibold shrink-0 transition-all ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 6 Fake Live Rooms List */}
      <div className="space-y-3">
        {filteredRooms.map((room) => (
          <div
            key={room.id}
            onClick={() => onSelectRoom(room)}
            className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 rounded-3xl p-4 shadow-md transition-all duration-200 cursor-pointer group active:scale-98"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center text-2xl shadow-md">
                  {room.emoji}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                    {room.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                    <span className="text-indigo-400 font-semibold">{room.category}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-emerald-400 font-medium">
                      <Volume2 className="w-3 h-3 animate-pulse" />
                      8 On Stage
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {room.listenersCount} {t('listening')}
                    </span>
                  </div>
                </div>
              </div>

              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/20 shrink-0">
                {room.badge}
              </span>
            </div>

            <p className="text-xs text-slate-300 line-clamp-2 mb-3 leading-relaxed">
              {room.topic}
            </p>

            {/* Speakers Avatars preview strip */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
              <div className="flex items-center -space-x-2 overflow-hidden">
                {room.speakers.slice(0, 5).map((sp, idx) => (
                  <div
                    key={idx}
                    className="w-7 h-7 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-xs shadow-sm"
                    title={sp.name}
                  >
                    {sp.avatar}
                  </div>
                ))}
                <span className="w-7 h-7 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[9px] font-bold text-slate-300">
                  +3
                </span>
              </div>

              <div className="flex items-center gap-1 text-xs font-bold text-indigo-400 group-hover:translate-x-1 transition-transform">
                <span>Join Stage</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
