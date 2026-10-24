import { openDB, IDBPDatabase } from 'idb';
import { User, ChatMessage, FriendRequest, AppLanguage } from '../types/chatnest';
import { INITIAL_USER, INITIAL_USERS, INITIAL_CHATS, INITIAL_FRIEND_REQUESTS } from './mockData';

const DB_NAME = 'chatnest_db';
const DB_VERSION = 1;
const STORE_NAME = 'app_store';

const STORAGE_KEYS = {
  USER: 'chatnest_user_profile',
  USERS_LIST: 'chatnest_users_list',
  CHATS: 'chatnest_chats_map',
  FRIEND_REQUESTS: 'chatnest_friend_requests',
  BLOCKED_IDS: 'chatnest_blocked_ids',
  IS_ONBOARDED: 'chatnest_is_onboarded',
  IS_LOGGED_IN: 'chatnest_is_logged_in',
  USER_PHONE: 'chatnest_user_phone',
  THEME: 'chatnest_theme',
  LANGUAGE: 'chatnest_language',
  SOUNDS_ENABLED: 'chatnest_sounds_enabled',
  NOTIFICATIONS_ENABLED: 'chatnest_notifs_enabled',
  LAST_DAILY_CLAIM: 'chatnest_last_daily_claim'
};

// In-Memory Fallback Cache (initialized with defaults)
const memoryCache: Record<string, unknown> = {
  [STORAGE_KEYS.USER]: INITIAL_USER,
  [STORAGE_KEYS.USERS_LIST]: INITIAL_USERS,
  [STORAGE_KEYS.CHATS]: INITIAL_CHATS,
  [STORAGE_KEYS.FRIEND_REQUESTS]: INITIAL_FRIEND_REQUESTS,
  [STORAGE_KEYS.BLOCKED_IDS]: [],
  [STORAGE_KEYS.IS_ONBOARDED]: false,
  [STORAGE_KEYS.IS_LOGGED_IN]: false,
  [STORAGE_KEYS.USER_PHONE]: '+91 98765 43210',
  [STORAGE_KEYS.THEME]: 'dark',
  [STORAGE_KEYS.LANGUAGE]: 'en',
  [STORAGE_KEYS.SOUNDS_ENABLED]: true,
  [STORAGE_KEYS.NOTIFICATIONS_ENABLED]: true,
  [STORAGE_KEYS.LAST_DAILY_CLAIM]: 0
};

let dbPromise: Promise<IDBPDatabase | null> | null = null;

function getDb(): Promise<IDBPDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      }
    }).catch((err) => {
      console.warn('idb openDB failed, falling back to memory cache:', err);
      return null;
    });
  }
  return dbPromise;
}

async function readFromIdb<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const db = await getDb();
    if (!db) return memoryCache[key] !== undefined ? (memoryCache[key] as T) : defaultValue;
    const val = await db.get(STORE_NAME, key);
    if (val !== undefined && val !== null) {
      memoryCache[key] = val;
      return val as T;
    }
  } catch (err) {
    console.warn(`idb get("${key}") failed:`, err);
  }
  return memoryCache[key] !== undefined ? (memoryCache[key] as T) : defaultValue;
}

function writeToIdb<T>(key: string, value: T): void {
  // Always update in-memory cache immediately for sync access
  memoryCache[key] = value;
  // Write to IndexedDB with try/catch
  getDb().then((db) => {
    if (!db) return;
    db.put(STORE_NAME, value, key).catch((err) => {
      console.warn(`idb put("${key}") failed:`, err);
    });
  }).catch((err) => {
    console.warn(`idb access error for key "${key}":`, err);
  });
}

export const StorageService = {
  // Initialize storage from idb on app launch
  async initStorage(): Promise<void> {
    try {
      const keys = Object.values(STORAGE_KEYS);
      await Promise.all(
        keys.map(async (k) => {
          const val = await readFromIdb(k, memoryCache[k]);
          memoryCache[k] = val;
        })
      );
    } catch (e) {
      console.warn('initStorage failed, using memory fallback:', e);
    }
  },

  // Onboarding & Login
  isOnboarded(): boolean {
    return Boolean(memoryCache[STORAGE_KEYS.IS_ONBOARDED]);
  },
  setOnboarded(value: boolean): void {
    writeToIdb(STORAGE_KEYS.IS_ONBOARDED, value);
  },

  isLoggedIn(): boolean {
    return Boolean(memoryCache[STORAGE_KEYS.IS_LOGGED_IN]);
  },
  setLoggedIn(value: boolean, phone?: string): void {
    writeToIdb(STORAGE_KEYS.IS_LOGGED_IN, value);
    if (phone) writeToIdb(STORAGE_KEYS.USER_PHONE, phone);
  },
  getPhone(): string {
    return (memoryCache[STORAGE_KEYS.USER_PHONE] as string) || '+91 98765 43210';
  },

  // User Profile
  getUserProfile(): User {
    return (memoryCache[STORAGE_KEYS.USER] as User) || INITIAL_USER;
  },
  saveUserProfile(user: User): void {
    writeToIdb(STORAGE_KEYS.USER, user);
  },
  updateCoins(delta: number): number {
    const user = this.getUserProfile();
    const newCoins = Math.max(0, (user.coins || 0) + delta);
    user.coins = newCoins;
    this.saveUserProfile(user);
    return newCoins;
  },

  // Daily Bonus
  canClaimDailyBonus(): boolean {
    const lastClaim = (memoryCache[STORAGE_KEYS.LAST_DAILY_CLAIM] as number) || 0;
    return Date.now() - lastClaim > 24 * 3600 * 1000;
  },
  claimDailyBonus(): number {
    const bonus = 150;
    writeToIdb(STORAGE_KEYS.LAST_DAILY_CLAIM, Date.now());
    return this.updateCoins(bonus);
  },

  // Users Pool
  getUsers(): User[] {
    return (memoryCache[STORAGE_KEYS.USERS_LIST] as User[]) || INITIAL_USERS;
  },
  saveUsers(users: User[]): void {
    writeToIdb(STORAGE_KEYS.USERS_LIST, users);
  },

  // Blocked Users
  getBlockedIds(): string[] {
    return (memoryCache[STORAGE_KEYS.BLOCKED_IDS] as string[]) || [];
  },
  blockUser(userId: string): void {
    const blocked = this.getBlockedIds();
    if (!blocked.includes(userId)) {
      const updated = [...blocked, userId];
      writeToIdb(STORAGE_KEYS.BLOCKED_IDS, updated);
    }
  },
  unblockUser(userId: string): void {
    const blocked = this.getBlockedIds().filter((id) => id !== userId);
    writeToIdb(STORAGE_KEYS.BLOCKED_IDS, blocked);
  },

  // Friends & Requests
  getFriendRequests(): FriendRequest[] {
    return (memoryCache[STORAGE_KEYS.FRIEND_REQUESTS] as FriendRequest[]) || INITIAL_FRIEND_REQUESTS;
  },
  saveFriendRequests(requests: FriendRequest[]): void {
    writeToIdb(STORAGE_KEYS.FRIEND_REQUESTS, requests);
  },

  // Chat Messages
  getAllChats(): Record<string, ChatMessage[]> {
    return (memoryCache[STORAGE_KEYS.CHATS] as Record<string, ChatMessage[]>) || INITIAL_CHATS;
  },
  getChatMessages(userId: string): ChatMessage[] {
    const chats = this.getAllChats();
    return chats[userId] || [];
  },
  saveChatMessage(userId: string, message: ChatMessage): void {
    const chats = { ...this.getAllChats() };
    if (!chats[userId]) {
      chats[userId] = [];
    }
    chats[userId] = [...chats[userId], message];
    writeToIdb(STORAGE_KEYS.CHATS, chats);
  },
  saveAllChats(chats: Record<string, ChatMessage[]>): void {
    writeToIdb(STORAGE_KEYS.CHATS, chats);
  },

  // Settings
  getTheme(): 'dark' | 'light' {
    return (memoryCache[STORAGE_KEYS.THEME] as 'dark' | 'light') || 'dark';
  },
  setTheme(theme: 'dark' | 'light'): void {
    writeToIdb(STORAGE_KEYS.THEME, theme);
  },

  getLanguage(): AppLanguage {
    return (memoryCache[STORAGE_KEYS.LANGUAGE] as AppLanguage) || 'en';
  },
  setLanguage(lang: AppLanguage): void {
    writeToIdb(STORAGE_KEYS.LANGUAGE, lang);
  },

  getSoundEnabled(): boolean {
    const val = memoryCache[STORAGE_KEYS.SOUNDS_ENABLED];
    return val !== undefined ? Boolean(val) : true;
  },
  setSoundEnabled(enabled: boolean): void {
    writeToIdb(STORAGE_KEYS.SOUNDS_ENABLED, enabled);
  },

  getNotificationsEnabled(): boolean {
    const val = memoryCache[STORAGE_KEYS.NOTIFICATIONS_ENABLED];
    return val !== undefined ? Boolean(val) : true;
  },
  setNotificationsEnabled(enabled: boolean): void {
    writeToIdb(STORAGE_KEYS.NOTIFICATIONS_ENABLED, enabled);
  },

  // Reset demo data to initial state in idb and memory
  resetAllDemoData(): void {
    memoryCache[STORAGE_KEYS.USER] = INITIAL_USER;
    memoryCache[STORAGE_KEYS.USERS_LIST] = INITIAL_USERS;
    memoryCache[STORAGE_KEYS.CHATS] = INITIAL_CHATS;
    memoryCache[STORAGE_KEYS.FRIEND_REQUESTS] = INITIAL_FRIEND_REQUESTS;
    memoryCache[STORAGE_KEYS.BLOCKED_IDS] = [];
    memoryCache[STORAGE_KEYS.LAST_DAILY_CLAIM] = 0;

    getDb().then((db) => {
      if (!db) return;
      db.clear(STORE_NAME).then(() => {
        // Re-write fresh defaults
        writeToIdb(STORAGE_KEYS.USER, INITIAL_USER);
        writeToIdb(STORAGE_KEYS.USERS_LIST, INITIAL_USERS);
        writeToIdb(STORAGE_KEYS.CHATS, INITIAL_CHATS);
        writeToIdb(STORAGE_KEYS.FRIEND_REQUESTS, INITIAL_FRIEND_REQUESTS);
        writeToIdb(STORAGE_KEYS.BLOCKED_IDS, []);
        writeToIdb(STORAGE_KEYS.IS_ONBOARDED, true);
        writeToIdb(STORAGE_KEYS.IS_LOGGED_IN, true);
      }).catch((err) => console.warn('Failed clearing idb:', err));
    }).catch((err) => console.warn('Failed accessing idb during reset:', err));
  },

  logout(): void {
    memoryCache[STORAGE_KEYS.IS_LOGGED_IN] = false;
    writeToIdb(STORAGE_KEYS.IS_LOGGED_IN, false);
  }
};
