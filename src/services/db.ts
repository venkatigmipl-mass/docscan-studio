import { openDB, IDBPDatabase } from 'idb';
import { AppSettings, DocPage, FilterType, ScannedDocument } from '../types/scanner';

const DB_NAME = 'DocScanStudioCapacitorDB';
const DB_VERSION = 1;
const DOCS_STORE = 'documents';
const SETTINGS_STORE = 'settings';

export const DEFAULT_SETTINGS: AppSettings = {
  defaultPdfSize: 'a4',
  defaultFilter: 'original',
  theme: 'light',
};

export interface StoredDocPage {
  id: string;
  originalBlob: Blob;
  processedBlob: Blob;
  width: number;
  height: number;
  filter: FilterType;
  brightness: number;
  contrast: number;
  rotation: number;
  cropPoints?: DocPage['cropPoints'];
}

export interface StoredDocument {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  pageCount: number;
  thumbnail: string; // small compressed thumbnail dataUrl
  pages: StoredDocPage[];
}

/**
 * Helper to convert a data URL or blob URL to a real Blob object
 */
export async function urlToBlob(urlOrData: string): Promise<Blob> {
  if (urlOrData.startsWith('data:')) {
    const arr = urlOrData.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  const res = await fetch(urlOrData);
  return await res.blob();
}

/**
 * Generate a lightweight thumbnail (<= 160px) from a Blob or DataURL
 */
export async function generateSmallThumbnail(source: Blob | string, maxDimension = 160): Promise<string> {
  return new Promise((resolve, reject) => {
    let objectUrl = '';
    const img = new Image();

    img.onload = () => {
      try {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve('');
          return;
        }

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const thumbData = canvas.toDataURL('image/jpeg', 0.7);
        resolve(thumbData);
      } finally {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
      }
    };

    img.onerror = (e) => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to generate thumbnail: ' + e));
    };

    if (typeof source === 'string') {
      img.src = source;
    } else {
      objectUrl = URL.createObjectURL(source);
      img.src = objectUrl;
    }
  });
}

class DatabaseService {
  private dbPromise: Promise<IDBPDatabase> | null = null;

  private async getDB(): Promise<IDBPDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(DOCS_STORE)) {
            const store = db.createObjectStore(DOCS_STORE, { keyPath: 'id' });
            store.createIndex('by-updatedAt', 'updatedAt');
          }
          if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
            db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
          }
        },
      });
    }
    return this.dbPromise;
  }

  /**
   * Loads all documents from IndexedDB and constructs Object URLs for pages
   */
  async getAllDocuments(): Promise<ScannedDocument[]> {
    try {
      const db = await this.getDB();
      const storedDocs: StoredDocument[] = await db.getAll(DOCS_STORE);

      // Sort descending by updatedAt
      storedDocs.sort((a, b) => b.updatedAt - a.updatedAt);

      const docs: ScannedDocument[] = storedDocs.map((sDoc) => {
        const pages: DocPage[] = sDoc.pages.map((sp) => {
          const originalUrl = sp.originalBlob ? URL.createObjectURL(sp.originalBlob) : '';
          const processedUrl = sp.processedBlob ? URL.createObjectURL(sp.processedBlob) : originalUrl;

          return {
            id: sp.id,
            originalBlob: sp.originalBlob,
            processedBlob: sp.processedBlob,
            originalDataUrl: originalUrl,
            processedDataUrl: processedUrl,
            width: sp.width,
            height: sp.height,
            filter: sp.filter,
            brightness: sp.brightness,
            contrast: sp.contrast,
            rotation: sp.rotation,
            cropPoints: sp.cropPoints,
          };
        });

        return {
          id: sDoc.id,
          name: sDoc.name,
          createdAt: sDoc.createdAt,
          updatedAt: sDoc.updatedAt,
          pageCount: sDoc.pageCount || pages.length,
          thumbnail: sDoc.thumbnail || pages[0]?.processedDataUrl || '',
          pages,
        };
      });

      return docs;
    } catch (err) {
      console.error('Error fetching documents from idb:', err);
      throw new Error('Failed to retrieve documents from storage');
    }
  }

  /**
   * Retrieves a single document by ID
   */
  async getDocument(id: string): Promise<ScannedDocument | null> {
    const db = await this.getDB();
    const sDoc: StoredDocument | undefined = await db.get(DOCS_STORE, id);
    if (!sDoc) return null;

    const pages: DocPage[] = sDoc.pages.map((sp) => {
      const originalUrl = sp.originalBlob ? URL.createObjectURL(sp.originalBlob) : '';
      const processedUrl = sp.processedBlob ? URL.createObjectURL(sp.processedBlob) : originalUrl;

      return {
        id: sp.id,
        originalBlob: sp.originalBlob,
        processedBlob: sp.processedBlob,
        originalDataUrl: originalUrl,
        processedDataUrl: processedUrl,
        width: sp.width,
        height: sp.height,
        filter: sp.filter,
        brightness: sp.brightness,
        contrast: sp.contrast,
        rotation: sp.rotation,
        cropPoints: sp.cropPoints,
      };
    });

    return {
      id: sDoc.id,
      name: sDoc.name,
      createdAt: sDoc.createdAt,
      updatedAt: sDoc.updatedAt,
      pageCount: sDoc.pageCount,
      thumbnail: sDoc.thumbnail || pages[0]?.processedDataUrl || '',
      pages,
    };
  }

  /**
   * Persists a document to IndexedDB. Converts images to Blobs and generates a small thumbnail.
   */
  async saveDocument(doc: ScannedDocument): Promise<void> {
    const db = await this.getDB();

    // Prepare stored pages with Blobs
    const storedPages: StoredDocPage[] = [];

    for (const page of doc.pages) {
      let origBlob = page.originalBlob;
      if (!origBlob && page.originalDataUrl) {
        origBlob = await urlToBlob(page.originalDataUrl);
      } else if (!origBlob) {
        origBlob = new Blob([], { type: 'image/jpeg' });
      }

      let procBlob = page.processedBlob;
      if (!procBlob && page.processedDataUrl) {
        procBlob = await urlToBlob(page.processedDataUrl);
      } else if (!procBlob) {
        procBlob = origBlob;
      }

      // Update page object with the Blobs for immediate in-memory reference
      page.originalBlob = origBlob;
      page.processedBlob = procBlob;

      storedPages.push({
        id: page.id,
        originalBlob: origBlob,
        processedBlob: procBlob,
        width: page.width,
        height: page.height,
        filter: page.filter,
        brightness: page.brightness,
        contrast: page.contrast,
        rotation: page.rotation,
        cropPoints: page.cropPoints,
      });
    }

    // Generate lightweight thumbnail (< 160px) from first page
    let thumbnail = doc.thumbnail;
    if (storedPages.length > 0) {
      try {
        thumbnail = await generateSmallThumbnail(storedPages[0].processedBlob, 160);
      } catch {
        thumbnail = doc.thumbnail || '';
      }
    }

    const storedDoc: StoredDocument = {
      id: doc.id,
      name: doc.name,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt || Date.now(),
      pageCount: storedPages.length,
      thumbnail,
      pages: storedPages,
    };

    await db.put(DOCS_STORE, storedDoc);
  }

  /**
   * Deletes a document from IndexedDB
   */
  async deleteDocument(id: string): Promise<void> {
    const db = await this.getDB();
    await db.delete(DOCS_STORE, id);
  }

  /**
   * Loads settings from IndexedDB
   */
  async getSettings(): Promise<AppSettings> {
    try {
      const db = await this.getDB();
      const entry = await db.get(SETTINGS_STORE, 'app_settings');
      if (entry && entry.value) {
        return { ...DEFAULT_SETTINGS, ...entry.value };
      }
      return DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  /**
   * Saves settings to IndexedDB
   */
  async saveSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    const current = await this.getSettings();
    const updated: AppSettings = { ...current, ...settings };
    const db = await this.getDB();
    await db.put(SETTINGS_STORE, { key: 'app_settings', value: updated });
    return updated;
  }

  /**
   * Clears all stored documents and settings
   */
  async clearAllData(): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction([DOCS_STORE, SETTINGS_STORE], 'readwrite');
    await Promise.all([
      tx.objectStore(DOCS_STORE).clear(),
      tx.objectStore(SETTINGS_STORE).clear(),
      tx.done,
    ]);
  }

  /**
   * Calculates approximate storage usage
   */
  async getStorageEstimate(): Promise<{ docCount: number; estimatedSizeMb: number }> {
    try {
      const db = await this.getDB();
      const storedDocs: StoredDocument[] = await db.getAll(DOCS_STORE);
      let totalBytes = 0;

      for (const d of storedDocs) {
        totalBytes += (d.thumbnail || '').length;
        for (const p of d.pages) {
          totalBytes += (p.originalBlob?.size || 0) + (p.processedBlob?.size || 0);
        }
      }

      const mb = totalBytes / (1024 * 1024);
      return {
        docCount: storedDocs.length,
        estimatedSizeMb: Number(mb.toFixed(2)),
      };
    } catch {
      return { docCount: 0, estimatedSizeMb: 0 };
    }
  }
}

export const dbService = new DatabaseService();
