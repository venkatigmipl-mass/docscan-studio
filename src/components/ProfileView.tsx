import React, { useState } from 'react';
import { 
  User as UserIcon, 
  Sparkles, 
  Edit3, 
  ShieldCheck, 
  Globe, 
  MapPin, 
  Gift, 
  Check, 
  X,
  Share2
} from 'lucide-react';
import { triggerConfetti } from '../utils/confetti';
import { User, AppLanguage } from '../types/chatnest';
import { getT } from '../services/i18n';
import { AVATAR_OPTIONS } from '../services/mockData';
import { SoundEffects } from '../services/soundEffects';

interface ProfileViewProps {
  user: User;
  friendsCount: number;
  giftsCount: number;
  language: AppLanguage;
  onUpdateProfile: (updated: Partial<User>) => void;
  onClaimDailyBonus: () => void;
  canClaimDaily: boolean;
  onOpenSettings: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  friendsCount,
  giftsCount,
  language,
  onUpdateProfile,
  onClaimDailyBonus,
  canClaimDaily,
  onOpenSettings
}) => {
  const t = getT(language);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio);
  const [city, setCity] = useState(user.city || 'Bengaluru');
  const [avatar, setAvatar] = useState(user.avatar);
  const [userLang, setUserLang] = useState<AppLanguage>(user.language);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      name: name.trim() || user.name,
      bio: bio.trim() || user.bio,
      city: city.trim() || user.city,
      avatar,
      language: userLang
    });
    setIsEditing(false);
  };

  const handleDailyClaim = () => {
    try {
      triggerConfetti({ count: 50, y: 0.6 });
    } catch (e) {
      console.warn(e);
    }
    SoundEffects.playGiftChime();
    onClaimDailyBonus();
  };

  return (
    <div className="pb-24 pt-2 px-4 max-w-md mx-auto space-y-4">
      {/* Profile Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        <div className="flex items-start justify-between">
          {/* Avatar with edit badge */}
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-1 shadow-xl">
              <div className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center text-4xl">
                {user.avatar}
              </div>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md active:scale-95 transition-transform"
              title="Edit Profile"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Edit Profile Button */}
          <button
            onClick={() => setIsEditing(true)}
            className="min-h-[38px] px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/80 rounded-xl text-xs font-bold text-slate-200 flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
        </div>

        {/* User Info */}
        <div className="mt-4 space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              {user.name}
            </h2>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <p className="text-xs text-indigo-400 font-semibold">{user.handle}</p>
          <p className="text-xs text-slate-300 leading-relaxed pt-1">
            {user.bio}
          </p>

          <div className="flex items-center gap-3 pt-2 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400" />
              {user.city || 'India'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3 text-slate-400" />
              Language: {user.language.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Fake Coins & Daily Bonus Card */}
      <div className="bg-gradient-to-tr from-amber-600/20 via-orange-600/10 to-slate-900 border border-amber-500/30 rounded-3xl p-4 shadow-lg flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-400">
            <span className="text-base">🪙</span>
            <span>ChatNest Coins</span>
          </div>
          <div className="text-2xl font-black text-white">
            {(user.coins || 0).toLocaleString()}
          </div>
          <p className="text-[10px] text-amber-300/80">
            Demo currency only • No purchase required
          </p>
        </div>

        <button
          onClick={handleDailyClaim}
          className="min-h-[44px] px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-slate-950 font-black text-xs rounded-2xl flex items-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>+150 Free</span>
        </button>
      </div>

      {/* Social Stats Strip */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-md">
          <div className="text-lg font-black text-white">{friendsCount}</div>
          <div className="text-[11px] text-slate-400 font-medium">Friends</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-md">
          <div className="text-lg font-black text-white">6</div>
          <div className="text-[11px] text-slate-400 font-medium">Live Rooms</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-md">
          <div className="text-lg font-black text-white">{giftsCount}</div>
          <div className="text-[11px] text-slate-400 font-medium">Gifts Sent</div>
        </div>
      </div>

      {/* User Interests */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-md space-y-2">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Passions & Interests
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {user.interests.map((tag, idx) => (
            <span
              key={idx}
              className="px-3 py-1 rounded-xl text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Settings Shortcut Button */}
      <button
        onClick={onOpenSettings}
        className="w-full min-h-[48px] bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-colors active:scale-98"
      >
        <span>Open App Settings</span>
      </button>

      {/* EDIT PROFILE MODAL */}
      {isEditing && (
        <div 
          onClick={() => setIsEditing(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Edit Your Profile</h3>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1.5 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              {/* Avatar Selector */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">
                  Choose Avatar:
                </label>
                <div className="grid grid-cols-4 gap-2 bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60 max-h-36 overflow-y-auto">
                  {AVATAR_OPTIONS.map((av, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatar(av)}
                      className={`min-h-[44px] rounded-xl text-2xl flex items-center justify-center transition-all ${
                        avatar === av
                          ? 'bg-indigo-600 border-2 border-white scale-110 shadow-md'
                          : 'bg-slate-700/60 hover:bg-slate-700'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name Input */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Display Name:
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full min-h-[44px] bg-slate-800 border border-slate-700 rounded-xl px-3.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              {/* Bio Input */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Bio / Status:
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* City Input */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  City:
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full min-h-[44px] bg-slate-800 border border-slate-700 rounded-xl px-3.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 min-h-[44px] bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 min-h-[44px] bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/30"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
