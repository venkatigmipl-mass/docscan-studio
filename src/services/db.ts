import { AppSettings, ScannedDocument } from '../types/scanner';

const DB_NAME = 'DocScanStudioDB';
const DB_VERSION = 1;
const DOCS_STORE = 'documents';
const SETTINGS_STORE = 'settings';

export const DEFAULT_SETTINGS: AppSettings = {
  defaultPdfSize: 'a4',
  defaultFilter: 'original',
  theme: 'light',
};

class DatabaseService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(DOCS_STORE)) {
            const store = db.createObjectStore(DOCS_STORE, { keyPath: 'id' });
            store.createIndex('updatedAt', 'updatedAt', { unique: false });
          }
          if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
            db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
          }
        };

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = () => {
          reject(new Error(`Failed to open IndexedDB: ${request.error?.message}`));
        };
      });
    }
    return this.dbPromise;
  }

  // --- Document Operations ---

  async getAllDocuments(): Promise<ScannedDocument[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(DOCS_STORE, 'readonly');
        const store = transaction.objectStore(DOCS_STORE);
        const index = store.index('updatedAt');
        // Retrieve descending order by updatedAt
        const request = index.openCursor(null, 'prev');
        const results: ScannedDocument[] = [];

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor) {
            results.push(cursor.value);
            cursor.continue();
          } else {
            resolve(results);
          }
        };

        request.onerror = () => {
          reject(new Error(`Failed to fetch documents: ${request.error?.message}`));
        };
      });
    } catch (err) {
      console.error('Error fetching documents from IndexedDB', err);
      return [];
    }
  }

  async getDocument(id: string): Promise<ScannedDocument | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(DOCS_STORE, 'readonly');
      const store = transaction.objectStore(DOCS_STORE);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(new Error(`Failed to get document: ${request.error?.message}`));
      };
    });
  }

  async saveDocument(doc: ScannedDocument): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(DOCS_STORE, 'readwrite');
      const store = transaction.objectStore(DOCS_STORE);
      const request = store.put(doc);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error(`Failed to save document: ${request.error?.message}`));
      };
    });
  }

  async deleteDocument(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(DOCS_STORE, 'readwrite');
      const store = transaction.objectStore(DOCS_STORE);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error(`Failed to delete document: ${request.error?.message}`));
      };
    });
  }

  // --- Settings Operations ---

  async getSettings(): Promise<AppSettings> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const transaction = db.transaction(SETTINGS_STORE, 'readonly');
        const store = transaction.objectStore(SETTINGS_STORE);
        const request = store.get('app_settings');

        request.onsuccess = () => {
          if (request.result && request.result.value) {
            resolve({ ...DEFAULT_SETTINGS, ...request.result.value });
          } else {
            resolve(DEFAULT_SETTINGS);
          }
        };

        request.onerror = () => {
          resolve(DEFAULT_SETTINGS);
        };
      });
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  async saveSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    const current = await this.getSettings();
    const updated: AppSettings = { ...current, ...settings };
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(SETTINGS_STORE, 'readwrite');
      const store = transaction.objectStore(SETTINGS_STORE);
      const request = store.put({ key: 'app_settings', value: updated });

      request.onsuccess = () => {
        resolve(updated);
      };

      request.onerror = () => {
        reject(new Error(`Failed to save settings: ${request.error?.message}`));
      };
    });
  }

  async clearAllData(): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([DOCS_STORE, SETTINGS_STORE], 'readwrite');
      const docStore = transaction.objectStore(DOCS_STORE);
      const settingsStore = transaction.objectStore(SETTINGS_STORE);
      
      const req1 = docStore.clear();
      const req2 = settingsStore.clear();

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error('Failed to clear database'));
    });
  }

  async getStorageEstimate(): Promise<{ docCount: number; estimatedSizeMb: number }> {
    try {
      const docs = await this.getAllDocuments();
      let totalChars = 0;
      for (const doc of docs) {
        totalChars += JSON.stringify(doc).length;
      }
      const mb = totalChars / (1024 * 1024);
      return {
        docCount: docs.length,
        estimatedSizeMb: Number(mb.toFixed(2)),
      };
    } catch {
      return { docCount: 0, estimatedSizeMb: 0 };
    }
  }
}

export const dbService = new DatabaseService();
