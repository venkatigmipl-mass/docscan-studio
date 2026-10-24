import React, { useState } from 'react';
import { Search, MessageSquare, Plus, CheckCheck, Gift } from 'lucide-react';
import { User, ChatMessage, AppLanguage } from '../types/chatnest';
import { getT } from '../services/i18n';

interface ChatsViewProps {
  users: User[];
  allChats: Record<string, ChatMessage[]>;
  language: AppLanguage;
  onOpenConversation: (user: User) => void;
  onNewChat: () => void;
}

export const ChatsView: React.FC<ChatsViewProps> = ({
  users,
  allChats,
  language,
  onOpenConversation,
  onNewChat
}) => {
  const t = getT(language);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'unread'>('all');

  // Pair users with their latest chat message
  const conversations = users
    .filter((u) => !u.isBlocked)
    .map((user) => {
      const msgs = allChats[user.id] || [];
      const lastMsg = msgs[msgs.length - 1];
      const unreadCount = msgs.filter((m) => !m.isUser && !m.isRead).length;
      return {
        user,
        messagesCount: msgs.length,
        lastMessage: lastMsg,
        unreadCount
      };
    })
    .filter((c) => c.messagesCount > 0)
    .sort((a, b) => {
      const timeA = a.lastMessage?.timestamp || 0;
      const timeB = b.lastMessage?.timestamp || 0;
      return timeB - timeA;
    });

  const filteredConversations = conversations.filter((c) => {
    if (filterMode === 'unread' && c.unreadCount === 0) return false;
    if (!searchQuery.trim()) return true;
    return (
      c.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.user.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.lastMessage?.text || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const formatTime = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="pb-24 pt-2 px-4 max-w-md mx-auto space-y-4">
      {/* Search & New Chat Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full bg-slate-900 border border-slate-800 text-white rounded-2xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500 placeholder:text-slate-500 min-h-[44px]"
          />
        </div>

        <button
          onClick={onNewChat}
          className="min-h-[44px] min-w-[44px] bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-md shadow-indigo-600/30"
          title="New Chat"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilterMode('all')}
          className={`min-h-[36px] px-3.5 py-1 rounded-xl text-xs font-bold transition-all ${
            filterMode === 'all'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-900 text-slate-400 border border-slate-800'
          }`}
        >
          All Chats
        </button>
        <button
          onClick={() => setFilterMode('unread')}
          className={`min-h-[36px] px-3.5 py-1 rounded-xl text-xs font-bold transition-all ${
            filterMode === 'unread'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-900 text-slate-400 border border-slate-800'
          }`}
        >
          Unread
        </button>
      </div>

      {/* Conversations List */}
      {filteredConversations.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-800 flex items-center justify-center text-2xl">
            💬
          </div>
          <h4 className="text-sm font-bold text-white">
            {filterMode === 'unread' ? 'No unread messages' : 'No active chats yet'}
          </h4>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            {t('chats_empty')}
          </p>
          <button
            onClick={onNewChat}
            className="min-h-[44px] px-5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl active:scale-95 transition-transform"
          >
            Find Friends Online
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredConversations.map(({ user, lastMessage, unreadCount }) => (
            <div
              key={user.id}
              onClick={() => onOpenConversation(user)}
              className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-3 shadow-md flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-98"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl shadow-sm">
                    {user.avatar}
                  </div>
                  {user.isOnline && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white truncate">
                      {user.name}
                    </h4>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-400 truncate mt-0.5">
                    {lastMessage?.isUser && (
                      <CheckCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    )}
                    {lastMessage?.gift && (
                      <span className="text-amber-400 flex items-center gap-0.5 shrink-0">
                        <Gift className="w-3 h-3" />
                        [{lastMessage.gift.name}]
                      </span>
                    )}
                    <span className="truncate">
                      {lastMessage?.text || 'Sent an attachment'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0">
                {lastMessage && (
                  <span className="text-[10px] text-slate-500 font-medium">
                    {formatTime(lastMessage.timestamp)}
                  </span>
                )}
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 min-w-[18px] bg-indigo-600 text-white text-[10px] font-bold rounded-full text-center">
                    {unreadCount}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
