import React, { useState } from 'react';
import { 
  X, 
  UserCheck, 
  UserPlus, 
  Check, 
  Trash2, 
  MessageSquare, 
  PhoneCall, 
  Video, 
  Users
} from 'lucide-react';
import { User, FriendRequest, AppLanguage } from '../types/chatnest';
import { getT } from '../services/i18n';

interface FriendsModalProps {
  friends: User[];
  requests: FriendRequest[];
  allUsers: User[];
  language: AppLanguage;
  onAcceptRequest: (req: FriendRequest) => void;
  onDeclineRequest: (req: FriendRequest) => void;
  onRemoveFriend: (user: User) => void;
  onOpenChat: (user: User) => void;
  onStartVoiceCall: (user: User) => void;
  onStartVideoCall: (user: User) => void;
  onSendFriendRequest: (user: User) => void;
  onClose: () => void;
}

export const FriendsModal: React.FC<FriendsModalProps> = ({
  friends,
  requests,
  allUsers,
  language,
  onAcceptRequest,
  onDeclineRequest,
  onRemoveFriend,
  onOpenChat,
  onStartVoiceCall,
  onStartVideoCall,
  onSendFriendRequest,
  onClose
}) => {
  const t = getT(language);
  const [activeTab, setActiveTab] = useState<'requests' | 'friends' | 'add'>('requests');

  const potentialFriends = allUsers.filter(
    (u) => !u.isFriend && !u.isBlocked && !requests.some((r) => r.user.id === u.id)
  );

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl flex flex-col max-h-[85vh] pb-safe animate-in slide-in-from-bottom-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-xl">
              👥
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Friends & Requests</h3>
              <p className="text-[11px] text-slate-400">
                Manage your friendships in ChatNest demo
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

        {/* Tab Switcher */}
        <div className="flex gap-2 py-3">
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 min-h-[40px] px-2 py-1.5 rounded-xl text-xs font-bold transition-all relative flex items-center justify-center gap-1.5 ${
              activeTab === 'requests'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <span>Requests</span>
            {requests.length > 0 && (
              <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[10px] font-black rounded-full">
                {requests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 min-h-[40px] px-2 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'friends'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <span>Friends</span>
            <span className="text-[10px] opacity-80">({friends.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('add')}
            className={`flex-1 min-h-[40px] px-2 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'add'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <span>+ Add</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[220px]">
          {/* TAB 1: PENDING REQUESTS */}
          {activeTab === 'requests' && (
            requests.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-800 flex items-center justify-center text-2xl">
                  📬
                </div>
                <p className="text-sm font-semibold text-slate-300">
                  {t('requests_empty')}
                </p>
                <p className="text-xs text-slate-500">
                  When someone sends you a friend request, it appears here!
                </p>
              </div>
            ) : (
              requests.map((req) => (
                <div
                  key={req.id}
                  className="p-3 bg-slate-800/90 border border-slate-700/80 rounded-2xl flex items-center justify-between gap-3 shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-slate-700 flex items-center justify-center text-2xl shrink-0">
                      {req.user.avatar}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">
                        {req.user.name}
                      </h4>
                      <p className="text-[10px] text-indigo-400">
                        {req.mutualCount} mutual friends
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => onDeclineRequest(req)}
                      className="min-h-[38px] px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-xs font-semibold"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => onAcceptRequest(req)}
                      className="min-h-[38px] px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Accept</span>
                    </button>
                  </div>
                </div>
              ))
            )
          )}

          {/* TAB 2: ALL FRIENDS */}
          {activeTab === 'friends' && (
            friends.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-800 flex items-center justify-center text-2xl">
                  🤝
                </div>
                <p className="text-sm font-semibold text-slate-300">No friends yet</p>
                <p className="text-xs text-slate-500">
                  Accept incoming requests or add people from the online grid!
                </p>
              </div>
            ) : (
              friends.map((friend) => (
                <div
                  key={friend.id}
                  className="p-3 bg-slate-800/90 border border-slate-700/80 rounded-2xl flex items-center justify-between gap-2 shadow-sm"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-2xl bg-slate-700 flex items-center justify-center text-xl">
                        {friend.avatar}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">
                        {friend.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 truncate">
                        {friend.handle}
                      </p>
                    </div>
                  </div>

                  {/* Actions: Chat, Voice, Video, Remove */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        onClose();
                        onOpenChat(friend);
                      }}
                      className="min-h-[36px] min-w-[36px] p-2 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 rounded-xl"
                      title="Chat"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        onClose();
                        onStartVoiceCall(friend);
                      }}
                      className="min-h-[36px] min-w-[36px] p-2 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 rounded-xl"
                      title="Voice Call"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        onClose();
                        onStartVideoCall(friend);
                      }}
                      className="min-h-[36px] min-w-[36px] p-2 bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 rounded-xl"
                      title="Video Call"
                    >
                      <Video className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onRemoveFriend(friend)}
                      className="min-h-[36px] min-w-[36px] p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-slate-700"
                      title="Remove Friend"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )
          )}

          {/* TAB 3: ADD FRIENDS */}
          {activeTab === 'add' && (
            potentialFriends.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-800 flex items-center justify-center text-2xl">
                  ✨
                </div>
                <p className="text-sm font-semibold text-slate-300">You are connected with everyone!</p>
              </div>
            ) : (
              potentialFriends.map((person) => (
                <div
                  key={person.id}
                  className="p-3 bg-slate-800/90 border border-slate-700/80 rounded-2xl flex items-center justify-between gap-3 shadow-sm"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-slate-700 flex items-center justify-center text-xl shrink-0">
                      {person.avatar}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">
                        {person.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 line-clamp-1">
                        {person.bio}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onSendFriendRequest(person)}
                    className="min-h-[38px] px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              ))
            )
          )}
        </div>
      </div>
    </div>
  );
};
