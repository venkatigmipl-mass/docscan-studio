export type AppLanguage = 'en' | 'ta' | 'hi' | 'te';

export interface User {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  age: number;
  bio: string;
  language: AppLanguage;
  interests: string[];
  isOnline: boolean;
  isFriend: boolean;
  hasIncomingRequest?: boolean;
  hasOutgoingRequest?: boolean;
  isBlocked?: boolean;
  coins?: number;
  city?: string;
  storyText?: string;
  voiceIntroSeconds?: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: number;
  isUser: boolean;
  gift?: {
    id: string;
    name: string;
    emoji: string;
    cost: number;
  };
  isRead?: boolean;
}

export interface ChatConversation {
  id: string;
  userId: string;
  lastMessage: string;
  lastTimestamp: number;
  unreadCount: number;
  isPinned?: boolean;
}

export interface RoomSpeaker {
  id: string;
  name: string;
  avatar: string;
  isSpeaking: boolean;
  isMuted: boolean;
  isHost?: boolean;
  role?: string;
}

export interface RoomChatMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  timestamp: number;
}

export interface Room {
  id: string;
  title: string;
  topic: string;
  category: string;
  badge: string;
  emoji: string;
  bannerGradient: string;
  speakers: RoomSpeaker[];
  listenersCount: number;
  language: string;
  preparedMessages: string[];
}

export interface GiftItem {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  tag: string;
}

export interface FriendRequest {
  id: string;
  user: User;
  mutualCount: number;
  timestamp: number;
}

export type MainTab = 'home' | 'rooms' | 'chats' | 'profile';

export interface ToastItem {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title?: string;
  message: string;
}

export interface CallSession {
  user: User;
  type: 'voice' | 'video';
  status: 'ringing' | 'connected' | 'ended';
  durationSeconds: number;
  isMuted: boolean;
  isSpeakerOn: boolean;
  isVideoMuted: boolean;
  activeFilter?: string;
}
