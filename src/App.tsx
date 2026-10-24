import React, { useState, useEffect, useCallback, useRef } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { 
  MainTab, 
  User, 
  Room, 
  ChatMessage, 
  GiftItem, 
  FriendRequest, 
  CallSession, 
  AppLanguage 
} from './types/chatnest';
import { StorageService } from './services/storage';
import { INITIAL_ROOMS, INITIAL_USERS } from './services/mockData';
import { ToastProvider, useToast } from './components/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { OnboardingModal } from './components/OnboardingModal';
import { PhoneLoginModal } from './components/PhoneLoginModal';
import { HomeView } from './components/HomeView';
import { RoomsView } from './components/RoomsView';
import { RoomDetailScreen } from './components/RoomDetailScreen';
import { ChatsView } from './components/ChatsView';
import { ChatConversationScreen } from './components/ChatConversationScreen';
import { ProfileView } from './components/ProfileView';
import { CallScreen } from './components/CallScreen';
import { GiftPickerModal } from './components/GiftPickerModal';
import { FriendsModal } from './components/FriendsModal';
import { SettingsModal } from './components/SettingsModal';
import { UserProfileModal } from './components/UserProfileModal';
import { ReportModal } from './components/ReportModal';

function ChatNestMain() {
  const { showToast, success, info, error } = useToast();

  // Persistent States
  const [isOnboarded, setIsOnboarded] = useState<boolean>(() => StorageService.isOnboarded());
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => StorageService.isLoggedIn());
  const [currentLanguage, setCurrentLanguage] = useState<AppLanguage>(() => StorageService.getLanguage());
  const [currentTheme, setCurrentTheme] = useState<'dark' | 'light'>(() => StorageService.getTheme());
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(() => StorageService.getSoundEnabled());
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState<boolean>(() => StorageService.getNotificationsEnabled());

  const [currentUser, setCurrentUser] = useState<User>(() => StorageService.getUserProfile());
  const [users, setUsers] = useState<User[]>(() => StorageService.getUsers());
  const [blockedIds, setBlockedIds] = useState<string[]>(() => StorageService.getBlockedIds());
  const [allChats, setAllChats] = useState<Record<string, ChatMessage[]>>(() => StorageService.getAllChats());
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>(() => StorageService.getFriendRequests());

  // Navigation & Sub-views
  const [currentTab, setCurrentTab] = useState<MainTab>('home');
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [activeChatUser, setActiveChatUser] = useState<User | null>(null);
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);

  // Modals
  const [activeProfileUser, setActiveProfileUser] = useState<User | null>(null);
  const [showGiftPicker, setShowGiftPicker] = useState<boolean>(false);
  const [showFriendsModal, setShowFriendsModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [reportTarget, setReportTarget] = useState<{ user?: User; message?: ChatMessage } | null>(null);

  const lastBackPressRef = useRef<number>(0);

  // Initialize storage from idb on launch
  useEffect(() => {
    StorageService.initStorage().then(() => {
      setIsOnboarded(StorageService.isOnboarded());
      setIsLoggedIn(StorageService.isLoggedIn());
      setCurrentLanguage(StorageService.getLanguage());
      setCurrentTheme(StorageService.getTheme());
      setIsSoundEnabled(StorageService.getSoundEnabled());
      setIsNotificationsEnabled(StorageService.getNotificationsEnabled());
      setCurrentUser(StorageService.getUserProfile());
      setUsers(StorageService.getUsers());
      setBlockedIds(StorageService.getBlockedIds());
      setAllChats(StorageService.getAllChats());
      setFriendRequests(StorageService.getFriendRequests());
    }).catch((e) => console.warn('Storage init failed:', e));
  }, []);

  // Apply Theme class to document root
  useEffect(() => {
    if (currentTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark', 'bg-slate-950');
      document.body.classList.remove('bg-slate-100');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark', 'bg-slate-950');
      document.body.classList.add('bg-slate-900');
    }
  }, [currentTheme]);

  // Capacitor 6 Android Back Button Handler
  useEffect(() => {
    let listenerHandle: { remove: () => void } | null = null;

    const setupBackButton = async () => {
      try {
        const handle = await CapacitorApp.addListener('backButton', () => {
          // Priority 1: Close topmost modals
          if (reportTarget) {
            setReportTarget(null);
            return;
          }
          if (showGiftPicker) {
            setShowGiftPicker(false);
            return;
          }
          if (activeProfileUser) {
            setActiveProfileUser(null);
            return;
          }
          if (showFriendsModal) {
            setShowFriendsModal(false);
            return;
          }
          if (showSettingsModal) {
            setShowSettingsModal(false);
            return;
          }

          // Priority 2: Call in progress
          if (activeCall) {
            setActiveCall(null);
            info('Call ended');
            return;
          }

          // Priority 3: Active room
          if (activeRoom) {
            setActiveRoom(null);
            info('Left room');
            return;
          }

          // Priority 4: Active Chat Conversation
          if (activeChatUser) {
            setActiveChatUser(null);
            return;
          }

          // Priority 5: Switch from other tabs to Home
          if (currentTab !== 'home') {
            setCurrentTab('home');
            return;
          }

          // Priority 6: On Home - exit app on double tap
          const now = Date.now();
          if (now - lastBackPressRef.current < 2000) {
            CapacitorApp.exitApp();
          } else {
            lastBackPressRef.current = now;
            info('Press back again to exit');
          }
        });
        listenerHandle = handle;
      } catch (e) {
        console.warn('Capacitor backButton listener not available on web:', e);
      }
    };

    setupBackButton();

    return () => {
      if (listenerHandle) {
        listenerHandle.remove();
      }
    };
  }, [
    reportTarget,
    showGiftPicker,
    activeProfileUser,
    showFriendsModal,
    showSettingsModal,
    activeCall,
    activeRoom,
    activeChatUser,
    currentTab,
    info
  ]);

  // Calculate unread chat messages
  const unreadCount = Object.values(allChats).reduce((acc, msgs) => {
    return acc + msgs.filter((m) => !m.isUser && !m.isRead).length;
  }, 0);

  // Sync state to storage
  const syncUsers = useCallback((updated: User[]) => {
    setUsers(updated);
    StorageService.saveUsers(updated);
  }, []);

  const syncUserProfile = useCallback((updated: Partial<User>) => {
    setCurrentUser((prev) => {
      const merged = { ...prev, ...updated };
      StorageService.saveUserProfile(merged);
      return merged;
    });
  }, []);

  // Onboarding & Login handlers
  const handleOnboardingComplete = () => {
    setIsOnboarded(true);
    StorageService.setOnboarded(true);
  };

  const handleLoginSuccess = (phone: string) => {
    setIsLoggedIn(true);
    StorageService.setLoggedIn(true, phone);
    success(`Welcome to ChatNest, ${currentUser.name}! 🐣`);
  };

  // Toggle Friend status
  const handleToggleFriend = (user: User) => {
    const updated = users.map((u) => {
      if (u.id === user.id) {
        if (u.isFriend) {
          return { ...u, isFriend: false, hasOutgoingRequest: false };
        } else if (u.hasOutgoingRequest) {
          return { ...u, hasOutgoingRequest: false };
        } else {
          return { ...u, hasOutgoingRequest: true };
        }
      }
      return u;
    });
    syncUsers(updated);

    if (user.isFriend) {
      info(`Removed ${user.name} from friends`);
    } else if (user.hasOutgoingRequest) {
      info(`Cancelled friend request to ${user.name}`);
    } else {
      success(`Friend request sent to ${user.name}! ✉️`);
    }
  };

  // Accept Friend Request
  const handleAcceptRequest = (req: FriendRequest) => {
    // Remove request
    const newRequests = friendRequests.filter((r) => r.id !== req.id);
    setFriendRequests(newRequests);
    StorageService.saveFriendRequests(newRequests);

    // Update user to friend
    const updated = users.map((u) => {
      if (u.id === req.user.id) {
        return { ...u, isFriend: true, hasIncomingRequest: false };
      }
      return u;
    });
    syncUsers(updated);
    success(`You and ${req.user.name} are now friends! 🤝`);
  };

  // Decline Friend Request
  const handleDeclineRequest = (req: FriendRequest) => {
    const newRequests = friendRequests.filter((r) => r.id !== req.id);
    setFriendRequests(newRequests);
    StorageService.saveFriendRequests(newRequests);
    info(`Declined request from ${req.user.name}`);
  };

  // Remove Friend
  const handleRemoveFriend = (user: User) => {
    const updated = users.map((u) => {
      if (u.id === user.id) {
        return { ...u, isFriend: false };
      }
      return u;
    });
    syncUsers(updated);
    info(`Removed ${user.name} from friends`);
  };

  // Call Handlers
  const handleStartVoiceCall = (user: User) => {
    setActiveCall({
      user,
      type: 'voice',
      status: 'ringing',
      durationSeconds: 0,
      isMuted: false,
      isSpeakerOn: true,
      isVideoMuted: false
    });
  };

  const handleStartVideoCall = (user: User) => {
    setActiveCall({
      user,
      type: 'video',
      status: 'ringing',
      durationSeconds: 0,
      isMuted: false,
      isSpeakerOn: true,
      isVideoMuted: false
    });
  };

  const handleEndCall = (durationSeconds: number) => {
    if (activeCall) {
      const minutes = Math.floor(durationSeconds / 60);
      const secs = durationSeconds % 60;
      const formatted = `${minutes}m ${secs}s`;
      info(`Call with ${activeCall.user.name} ended (${formatted})`);
    }
    setActiveCall(null);
  };

  // Chat message handlers
  const handleOpenChat = (user: User) => {
    // Mark messages as read
    const userMsgs = allChats[user.id] || [];
    if (userMsgs.some((m) => !m.isUser && !m.isRead)) {
      const updatedMsgs = userMsgs.map((m) => ({ ...m, isRead: true }));
      const newChats = { ...allChats, [user.id]: updatedMsgs };
      setAllChats(newChats);
      StorageService.saveAllChats(newChats);
    }
    setActiveChatUser(user);
  };

  const handleSendMessage = (text: string, gift?: GiftItem) => {
    if (!activeChatUser) return;

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      senderId: 'me',
      receiverId: activeChatUser.id,
      text,
      timestamp: Date.now(),
      isUser: true,
      isRead: true,
      gift: gift ? { id: gift.id, name: gift.name, emoji: gift.emoji, cost: gift.cost } : undefined
    };

    StorageService.saveChatMessage(activeChatUser.id, newMsg);
    setAllChats(StorageService.getAllChats());
  };

  const handleReceiveAutoReply = (text: string) => {
    if (!activeChatUser) return;

    const replyMsg: ChatMessage = {
      id: `reply_${Date.now()}`,
      senderId: activeChatUser.id,
      receiverId: 'me',
      text,
      timestamp: Date.now(),
      isUser: false,
      isRead: true
    };

    StorageService.saveChatMessage(activeChatUser.id, replyMsg);
    setAllChats(StorageService.getAllChats());
  };

  const handleSendGift = (gift: GiftItem) => {
    if (!activeChatUser) return;
    const currentCoins = currentUser.coins || 0;
    if (currentCoins < gift.cost) {
      error('Not enough coins to send this gift');
      return;
    }

    // Deduct coins
    const newCoins = StorageService.updateCoins(-gift.cost);
    setCurrentUser((prev) => ({ ...prev, coins: newCoins }));

    // Send gift message
    handleSendMessage(`Sent a ${gift.name} ${gift.emoji}!`, gift);
    setShowGiftPicker(false);
    success(`Sent ${gift.name} to ${activeChatUser.name}! 🎁`);
  };

  const handleClaimDailyBonus = () => {
    const newCoins = StorageService.claimDailyBonus();
    setCurrentUser((prev) => ({ ...prev, coins: newCoins }));
    success('Claimed +150 Free Nest Coins! 🪙✨');
  };

  // Safety: Block & Report Handlers
  const handleBlockUser = (user: User) => {
    StorageService.blockUser(user.id);
    const updatedBlocked = StorageService.getBlockedIds();
    setBlockedIds(updatedBlocked);

    // Hide user from active lists
    const updatedUsers = users.map((u) => (u.id === user.id ? { ...u, isBlocked: true } : u));
    syncUsers(updatedUsers);

    // Close any open screens with this user
    if (activeChatUser?.id === user.id) setActiveChatUser(null);
    if (activeProfileUser?.id === user.id) setActiveProfileUser(null);
    if (activeCall?.user.id === user.id) setActiveCall(null);

    success(`Blocked ${user.name}. They will no longer appear in your feed.`);
  };

  const handleUnblockUser = (userId: string) => {
    StorageService.unblockUser(userId);
    setBlockedIds(StorageService.getBlockedIds());
    const updatedUsers = users.map((u) => (u.id === userId ? { ...u, isBlocked: false } : u));
    syncUsers(updatedUsers);
    success('User unblocked');
  };

  const handleSubmitReport = (reason: string, details: string) => {
    const targetName = reportTarget?.user?.name || (reportTarget?.message ? 'the message' : 'content');
    setReportTarget(null);
    success(`Report submitted for ${targetName}. Thank you for keeping ChatNest safe! 🛡️`);
  };

  const handleClearChat = () => {
    if (!activeChatUser) return;
    const all = { ...allChats };
    delete all[activeChatUser.id];
    setAllChats(all);
    StorageService.saveAllChats(all);
    info('Conversation cleared');
  };

  // Settings Handlers
  const handleResetDemoData = () => {
    StorageService.resetAllDemoData();
    setCurrentUser(StorageService.getUserProfile());
    setUsers(StorageService.getUsers());
    setAllChats(StorageService.getAllChats());
    setFriendRequests(StorageService.getFriendRequests());
    setBlockedIds([]);
    setShowSettingsModal(false);
    success('Demo data restored to initial state! 🔄');
  };

  const handleLogout = () => {
    StorageService.logout();
    setIsLoggedIn(false);
    setShowSettingsModal(false);
    info('Logged out of demo session');
  };

  // Screen 1: Onboarding
  if (!isOnboarded) {
    return (
      <OnboardingModal
        currentLanguage={currentLanguage}
        onSelectLanguage={(lang) => {
          setCurrentLanguage(lang);
          StorageService.setLanguage(lang);
        }}
        onComplete={handleOnboardingComplete}
      />
    );
  }

  // Screen 2: Fake Login
  if (!isLoggedIn) {
    return (
      <PhoneLoginModal
        language={currentLanguage}
        onLoginSuccess={handleLoginSuccess}
        onBackToOnboarding={() => setIsOnboarded(false)}
      />
    );
  }

  // Active Call Screen (Voice or Video)
  if (activeCall) {
    return (
      <CallScreen
        session={activeCall}
        language={currentLanguage}
        onEndCall={handleEndCall}
      />
    );
  }

  // Active Voice Room Screen
  if (activeRoom) {
    return (
      <RoomDetailScreen
        room={activeRoom}
        language={currentLanguage}
        onLeaveRoom={() => setActiveRoom(null)}
      />
    );
  }

  // Active Chat Screen
  if (activeChatUser) {
    return (
      <>
        <ChatConversationScreen
          peerUser={activeChatUser}
          messages={allChats[activeChatUser.id] || []}
          language={currentLanguage}
          onBack={() => setActiveChatUser(null)}
          onSendMessage={handleSendMessage}
          onReceiveAutoReply={handleReceiveAutoReply}
          onStartVoiceCall={handleStartVoiceCall}
          onStartVideoCall={handleStartVideoCall}
          onOpenGiftPicker={() => setShowGiftPicker(true)}
          onOpenUserProfile={(u) => setActiveProfileUser(u)}
          onBlockUser={handleBlockUser}
          onReportUser={(u) => setReportTarget({ user: u })}
          onReportMessage={(m) => setReportTarget({ message: m })}
          onClearChat={handleClearChat}
        />

        {/* Gift Picker Modal */}
        {showGiftPicker && (
          <GiftPickerModal
            userCoins={currentUser.coins || 0}
            recipientName={activeChatUser.name}
            recipientAvatar={activeChatUser.avatar}
            language={currentLanguage}
            onSelectGift={handleSendGift}
            onClaimDailyBonus={handleClaimDailyBonus}
            onClose={() => setShowGiftPicker(false)}
          />
        )}

        {/* User Profile Modal */}
        {activeProfileUser && (
          <UserProfileModal
            user={activeProfileUser}
            language={currentLanguage}
            onOpenChat={handleOpenChat}
            onStartVoiceCall={handleStartVoiceCall}
            onStartVideoCall={handleStartVideoCall}
            onToggleFriend={handleToggleFriend}
            onBlockUser={handleBlockUser}
            onReportUser={(u) => setReportTarget({ user: u })}
            onClose={() => setActiveProfileUser(null)}
          />
        )}

        {/* Report Modal */}
        {reportTarget && (
          <ReportModal
            targetUser={reportTarget.user}
            messageText={reportTarget.message?.text}
            language={currentLanguage}
            onSubmitReport={handleSubmitReport}
            onClose={() => setReportTarget(null)}
          />
        )}
      </>
    );
  }

  const blockedUsersList = users.filter((u) => blockedIds.includes(u.id));
  const friendsList = users.filter((u) => u.isFriend && !u.isBlocked);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <Header
        coins={currentUser.coins || 0}
        pendingRequestsCount={friendRequests.length}
        language={currentLanguage}
        onOpenRequests={() => setShowFriendsModal(true)}
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenDailyBonus={handleClaimDailyBonus}
      />

      {/* Main Tab Screen */}
      <main className="flex-1 overflow-y-auto">
        {currentTab === 'home' && (
          <HomeView
            users={users}
            currentLanguage={currentLanguage}
            onOpenChat={handleOpenChat}
            onStartVoiceCall={handleStartVoiceCall}
            onStartVideoCall={handleStartVideoCall}
            onToggleFriend={handleToggleFriend}
            onSelectUserDetail={(u) => setActiveProfileUser(u)}
          />
        )}

        {currentTab === 'rooms' && (
          <RoomsView
            rooms={INITIAL_ROOMS}
            language={currentLanguage}
            onSelectRoom={(r) => setActiveRoom(r)}
          />
        )}

        {currentTab === 'chats' && (
          <ChatsView
            users={users}
            allChats={allChats}
            language={currentLanguage}
            onOpenConversation={handleOpenChat}
            onNewChat={() => setCurrentTab('home')}
          />
        )}

        {currentTab === 'profile' && (
          <ProfileView
            user={currentUser}
            friendsCount={friendsList.length}
            giftsCount={3}
            language={currentLanguage}
            onUpdateProfile={syncUserProfile}
            onClaimDailyBonus={handleClaimDailyBonus}
            canClaimDaily={StorageService.canClaimDailyBonus()}
            onOpenSettings={() => setShowSettingsModal(true)}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        unreadChatCount={unreadCount}
        language={currentLanguage}
      />

      {/* User Profile Modal */}
      {activeProfileUser && (
        <UserProfileModal
          user={activeProfileUser}
          language={currentLanguage}
          onOpenChat={handleOpenChat}
          onStartVoiceCall={handleStartVoiceCall}
          onStartVideoCall={handleStartVideoCall}
          onToggleFriend={handleToggleFriend}
          onBlockUser={handleBlockUser}
          onReportUser={(u) => setReportTarget({ user: u })}
          onClose={() => setActiveProfileUser(null)}
        />
      )}

      {/* Friends & Requests Modal */}
      {showFriendsModal && (
        <FriendsModal
          friends={friendsList}
          requests={friendRequests}
          allUsers={users}
          language={currentLanguage}
          onAcceptRequest={handleAcceptRequest}
          onDeclineRequest={handleDeclineRequest}
          onRemoveFriend={handleRemoveFriend}
          onOpenChat={handleOpenChat}
          onStartVoiceCall={handleStartVoiceCall}
          onStartVideoCall={handleStartVideoCall}
          onSendFriendRequest={handleToggleFriend}
          onClose={() => setShowFriendsModal(false)}
        />
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <SettingsModal
          currentLanguage={currentLanguage}
          currentTheme={currentTheme}
          isSoundEnabled={isSoundEnabled}
          isNotificationsEnabled={isNotificationsEnabled}
          blockedUsers={blockedUsersList}
          onChangeLanguage={(lang) => {
            setCurrentLanguage(lang);
            StorageService.setLanguage(lang);
            success(`Language changed to ${lang.toUpperCase()}`);
          }}
          onToggleTheme={() => {
            const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
            setCurrentTheme(nextTheme);
            StorageService.setTheme(nextTheme);
          }}
          onToggleSound={() => {
            const next = !isSoundEnabled;
            setIsSoundEnabled(next);
            StorageService.setSoundEnabled(next);
            info(`Sound effects ${next ? 'enabled' : 'disabled'}`);
          }}
          onToggleNotifications={() => {
            const next = !isNotificationsEnabled;
            setIsNotificationsEnabled(next);
            StorageService.setNotificationsEnabled(next);
            info(`Notifications ${next ? 'enabled' : 'disabled'}`);
          }}
          onUnblockUser={handleUnblockUser}
          onResetDemoData={handleResetDemoData}
          onLogout={handleLogout}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {/* Safety Report Modal */}
      {reportTarget && (
        <ReportModal
          targetUser={reportTarget.user}
          messageText={reportTarget.message?.text}
          language={currentLanguage}
          onSubmitReport={handleSubmitReport}
          onClose={() => setReportTarget(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <ChatNestMain />
      </ToastProvider>
    </ErrorBoundary>
  );
}
