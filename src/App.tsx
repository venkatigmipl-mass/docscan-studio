import React, { useState, useEffect, useRef } from 'react';
import { App as CapApp } from '@capacitor/app';
import {
  ActiveScreen,
  AppSettings,
  CornerPoints,
  DocPage,
  FilterType,
  ScannedDocument,
} from './types/scanner';
import { dbService, DEFAULT_SETTINGS } from './services/db';
import { compressImage } from './services/imageProcessing';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { DocumentList } from './components/DocumentList';
import { CameraScanner } from './components/CameraScanner';
import { CropEditor } from './components/CropEditor';
import { FilterEditor } from './components/FilterEditor';
import { DocumentDetail } from './components/DocumentDetail';
import { ExportModal } from './components/ExportModal';
import { ImagesToPdfModal } from './components/ImagesToPdfModal';
import { QrBarcodeView } from './components/QrBarcodeView';
import { SettingsModal } from './components/SettingsModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider, useToast } from './components/Toast';

const AppContent: React.FC = () => {
  const toast = useToast();

  // Settings & Theme
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Navigation & Screens
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('home');
  const [documents, setDocuments] = useState<ScannedDocument[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);

  // Intermediate Scanning Pipeline State
  const [pipelineTargetDocId, setPipelineTargetDocId] = useState<string | null>(null);
  const [pipelineEditingPageIndex, setPipelineEditingPageIndex] = useState<number | null>(null);

  // Crop step state
  const [pendingOriginalUrl, setPendingOriginalUrl] = useState<string>('');
  const [pendingCropPoints, setPendingCropPoints] = useState<CornerPoints | undefined>(undefined);

  // Filter step state
  const [pendingCroppedUrl, setPendingCroppedUrl] = useState<string>('');
  const [pendingFilter, setPendingFilter] = useState<FilterType>('original');
  const [pendingBrightness, setPendingBrightness] = useState<number>(0);
  const [pendingContrast, setPendingContrast] = useState<number>(0);
  const [pendingRotation, setPendingRotation] = useState<number>(0);

  // Export Modal state
  const [exportDoc, setExportDoc] = useState<ScannedDocument | null>(null);

  // Loading indicator for background operations
  const [isAppLoading, setIsAppLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  // Hidden multi-file input for home screen import
  const homeFileInputRef = useRef<HTMLInputElement>(null);

  // Current active document
  const activeDocument = documents.find((d) => d.id === activeDocId) || null;

  // Refs for Android hardware Back Button listener
  const exportDocRef = useRef(exportDoc);
  exportDocRef.current = exportDoc;

  const isSettingsOpenRef = useRef(isSettingsOpen);
  isSettingsOpenRef.current = isSettingsOpen;

  const activeScreenRef = useRef(activeScreen);
  activeScreenRef.current = activeScreen;

  const pipelineTargetDocIdRef = useRef(pipelineTargetDocId);
  pipelineTargetDocIdRef.current = pipelineTargetDocId;

  // Android Back Button Handler via @capacitor/app
  useEffect(() => {
    let removeListener: (() => void) | null = null;

    const setupBackButton = async () => {
      try {
        const handler = await CapApp.addListener('backButton', () => {
          // Priority 1: Close open modals first
          if (exportDocRef.current) {
            setExportDoc(null);
            return;
          }
          if (isSettingsOpenRef.current) {
            setIsSettingsOpen(false);
            return;
          }

          // Priority 2: Navigate back one screen
          const current = activeScreenRef.current;
          if (current === 'filter') {
            setActiveScreen('crop');
            return;
          }
          if (current === 'crop') {
            if (pipelineTargetDocIdRef.current) {
              setActiveScreen('document-detail');
            } else {
              setActiveScreen('camera');
            }
            return;
          }
          if (current === 'camera') {
            if (pipelineTargetDocIdRef.current) {
              setActiveScreen('document-detail');
            } else {
              setActiveScreen('home');
            }
            return;
          }
          if (current === 'document-detail') {
            setActiveDocId(null);
            setActiveScreen('home');
            return;
          }
          if (current === 'images-to-pdf' || current === 'qr-tools') {
            setActiveScreen('home');
            return;
          }

          // Priority 3: On Docs home screen with no modals -> Exit app
          if (current === 'home') {
            CapApp.exitApp();
          }
        });

        removeListener = () => {
          handler.remove();
        };
      } catch {
        // Safe fallback in standard browser preview
      }
    };

    setupBackButton();

    return () => {
      if (removeListener) removeListener();
    };
  }, []);

  // Load Settings and Documents on Mount using idb
  useEffect(() => {
    const initApp = async () => {
      try {
        setIsAppLoading(true);
        setLoadingMessage('Loading saved documents...');

        const loadedSettings = await dbService.getSettings();
        setSettings(loadedSettings);
        applyThemeClass(loadedSettings.theme);

        const loadedDocs = await dbService.getAllDocuments();
        setDocuments(loadedDocs);
      } catch (err: unknown) {
        console.warn('Initialization error:', err);
        toast.error('Failed loading saved documents from storage.');
      } finally {
        setIsAppLoading(false);
      }
    };
    initApp();
  }, [toast]);

  // Apply dark/light class to <html>
  const applyThemeClass = (theme: 'dark' | 'light') => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleToggleTheme = async () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    applyThemeClass(nextTheme);
    try {
      const updated = await dbService.saveSettings({ theme: nextTheme });
      setSettings(updated);
    } catch {
      toast.error('Failed saving theme preference');
    }
  };

  const handleUpdateSettings = async (partial: Partial<AppSettings>) => {
    try {
      if (partial.theme) {
        applyThemeClass(partial.theme);
      }
      const updated = await dbService.saveSettings(partial);
      setSettings(updated);
      toast.success('Settings saved');
    } catch {
      toast.error('Failed saving settings');
    }
  };

  // Generate default name "Scan_YYYY-MM-DD_HHmm"
  const generateDefaultDocName = () => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `Scan_${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
  };

  // --- Scanning & Page Creation Flow ---

  // Start Scan for a brand new document
  const handleStartNewScan = () => {
    setPipelineTargetDocId(null);
    setPipelineEditingPageIndex(null);
    setActiveScreen('camera');
  };

  // Add a page to an existing document via camera
  const handleAddPageCamera = (docId: string) => {
    setPipelineTargetDocId(docId);
    setPipelineEditingPageIndex(null);
    setActiveScreen('camera');
  };

  // Camera captured an image or single image picked
  const handleCameraCapture = (dataUrl: string, _width: number, _height: number) => {
    setPendingOriginalUrl(dataUrl);
    setPendingCropPoints(undefined);
    setActiveScreen('crop');
  };

  // Multiple images picked from gallery at once
  const handleImportMultiple = async (
    images: Array<{ dataUrl: string; width: number; height: number }>
  ) => {
    if (images.length === 0) return;

    setIsAppLoading(true);
    setLoadingMessage('Importing photos...');
    try {
      const newPages: DocPage[] = images.map((img) => ({
        id: Math.random().toString(36).substring(2, 9),
        originalDataUrl: img.dataUrl,
        processedDataUrl: img.dataUrl,
        width: img.width,
        height: img.height,
        filter: settings.defaultFilter || 'original',
        brightness: 0,
        contrast: 0,
        rotation: 0,
      }));

      if (pipelineTargetDocId) {
        // Append to existing document
        const targetDoc = documents.find((d) => d.id === pipelineTargetDocId);
        if (targetDoc) {
          const updatedPages = [...targetDoc.pages, ...newPages];
          const updatedDoc: ScannedDocument = {
            ...targetDoc,
            pages: updatedPages,
            pageCount: updatedPages.length,
            updatedAt: Date.now(),
          };

          await dbService.saveDocument(updatedDoc);
          setDocuments((prev) => [updatedDoc, ...prev.filter((d) => d.id !== updatedDoc.id)]);
          setActiveDocId(updatedDoc.id);
          setActiveScreen('document-detail');
          toast.success(`Added ${newPages.length} pages to ${updatedDoc.name}`);
          return;
        }
      }

      // Create new document with all imported pages
      const newDoc: ScannedDocument = {
        id: Math.random().toString(36).substring(2, 9),
        name: generateDefaultDocName(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        pageCount: newPages.length,
        thumbnail: '',
        pages: newPages,
      };

      await dbService.saveDocument(newDoc);
      setDocuments((prev) => [newDoc, ...prev]);
      setActiveDocId(newDoc.id);
      setActiveScreen('document-detail');
      toast.success(`Created document with ${newPages.length} pages`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error importing pages';
      toast.error(msg);
      setActiveScreen('home');
    } finally {
      setIsAppLoading(false);
    }
  };

  // Crop step completed -> Move to Filter step
  const handleApplyCrop = (
    croppedDataUrl: string,
    _width: number,
    _height: number,
    corners: CornerPoints
  ) => {
    setPendingCroppedUrl(croppedDataUrl);
    setPendingCropPoints(corners);

    // If editing existing page, preserve previous filter settings
    if (pipelineTargetDocId && pipelineEditingPageIndex !== null) {
      const doc = documents.find((d) => d.id === pipelineTargetDocId);
      const page = doc?.pages[pipelineEditingPageIndex];
      if (page) {
        setPendingFilter(page.filter);
        setPendingBrightness(page.brightness);
        setPendingContrast(page.contrast);
        setPendingRotation(page.rotation);
      }
    } else {
      setPendingFilter(settings.defaultFilter || 'original');
      setPendingBrightness(0);
      setPendingContrast(0);
      setPendingRotation(0);
    }

    setActiveScreen('filter');
  };

  // Filter step completed -> Save Page into Document in IndexedDB
  const handleSavePage = async (
    processedDataUrl: string,
    filter: FilterType,
    brightness: number,
    contrast: number,
    rotation: number,
    width: number,
    height: number
  ) => {
    setIsAppLoading(true);
    setLoadingMessage('Saving page...');
    try {
      const pageData: DocPage = {
        id: Math.random().toString(36).substring(2, 9),
        originalDataUrl: pendingOriginalUrl,
        processedDataUrl,
        width,
        height,
        filter,
        brightness,
        contrast,
        rotation,
        cropPoints: pendingCropPoints,
      };

      if (pipelineTargetDocId) {
        // Updating or adding page to existing document
        const target = documents.find((d) => d.id === pipelineTargetDocId);
        if (target) {
          let updatedPages = [...target.pages];
          if (pipelineEditingPageIndex !== null && pipelineEditingPageIndex >= 0) {
            updatedPages[pipelineEditingPageIndex] = {
              ...pageData,
              id: target.pages[pipelineEditingPageIndex].id,
            };
          } else {
            updatedPages.push(pageData);
          }

          const updatedDoc: ScannedDocument = {
            ...target,
            pages: updatedPages,
            pageCount: updatedPages.length,
            thumbnail: target.thumbnail || '',
            updatedAt: Date.now(),
          };

          await dbService.saveDocument(updatedDoc);
          setDocuments((prev) => [updatedDoc, ...prev.filter((d) => d.id !== updatedDoc.id)]);
          setActiveDocId(updatedDoc.id);
          setActiveScreen('document-detail');
          toast.success(pipelineEditingPageIndex !== null ? 'Page updated' : 'Page added to document');
          return;
        }
      }

      // Creating a brand new document with this initial page
      const newDoc: ScannedDocument = {
        id: Math.random().toString(36).substring(2, 9),
        name: generateDefaultDocName(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        pageCount: 1,
        thumbnail: '',
        pages: [pageData],
      };

      await dbService.saveDocument(newDoc);
      setDocuments((prev) => [newDoc, ...prev]);
      setActiveDocId(newDoc.id);
      setActiveScreen('document-detail');
      toast.success('Document saved to device');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error saving page to storage';
      toast.error(msg);
      setActiveScreen('home');
    } finally {
      setIsAppLoading(false);
    }
  };

  // Re-crop existing page
  const handleEditPageCrop = (page: DocPage, pageIndex: number) => {
    if (!activeDocId) return;
    setPipelineTargetDocId(activeDocId);
    setPipelineEditingPageIndex(pageIndex);
    setPendingOriginalUrl(page.originalDataUrl);
    setPendingCropPoints(page.cropPoints);
    setActiveScreen('crop');
  };

  // Re-filter existing page
  const handleEditPageFilter = (page: DocPage, pageIndex: number) => {
    if (!activeDocId) return;
    setPipelineTargetDocId(activeDocId);
    setPipelineEditingPageIndex(pageIndex);
    setPendingOriginalUrl(page.originalDataUrl);
    setPendingCroppedUrl(page.processedDataUrl);
    setPendingFilter(page.filter);
    setPendingBrightness(page.brightness);
    setPendingContrast(page.contrast);
    setPendingRotation(page.rotation);
    setActiveScreen('filter');
  };

  // Document Operations
  const handleOpenDocument = (doc: ScannedDocument) => {
    setActiveDocId(doc.id);
    setActiveScreen('document-detail');
  };

  const handleUpdateDocument = async (updated: ScannedDocument) => {
    try {
      await dbService.saveDocument(updated);
      setDocuments((prev) => [updated, ...prev.filter((d) => d.id !== updated.id)]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update document in storage';
      toast.error(msg);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    try {
      await dbService.deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      if (activeDocId === id) {
        setActiveDocId(null);
        setActiveScreen('home');
      }
      toast.success('Document deleted');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete document';
      toast.error(msg);
    }
  };

  const handleRenameDocument = async (id: string, newName: string) => {
    try {
      const doc = documents.find((d) => d.id === id);
      if (!doc) return;
      const updated = { ...doc, name: newName, updatedAt: Date.now() };
      await dbService.saveDocument(updated);
      setDocuments((prev) => prev.map((d) => (d.id === id ? updated : d)));
      toast.success('Document renamed');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to rename document';
      toast.error(msg);
    }
  };

  const handleClearAllData = async () => {
    try {
      await dbService.clearAllData();
      setDocuments([]);
      setActiveDocId(null);
      setActiveScreen('home');
      toast.success('All documents erased');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to clear stored data';
      toast.error(msg);
    }
  };

  // Direct gallery file select from Home
  const handleHomeGalleryInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsAppLoading(true);
    setLoadingMessage('Processing images...');
    try {
      const processed: Array<{ dataUrl: string; width: number; height: number }> = [];
      for (let i = 0; i < files.length; i++) {
        const res = await compressImage(files[i], 1600);
        processed.push(res);
      }

      if (processed.length === 1) {
        handleCameraCapture(processed[0].dataUrl, processed[0].width, processed[0].height);
      } else {
        await handleImportMultiple(processed);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error reading image file';
      toast.error(msg);
    } finally {
      setIsAppLoading(false);
      if (homeFileInputRef.current) homeFileInputRef.current.value = '';
    }
  };

  // Dynamic header titles
  const getHeaderTitle = () => {
    switch (activeScreen) {
      case 'images-to-pdf':
        return 'Images to PDF';
      case 'qr-tools':
        return 'QR & Barcode';
      case 'document-detail':
        return activeDocument?.name || 'Document';
      default:
        return 'DocScan Studio';
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors overscroll-none select-none">
      {/* Hidden file input for direct photo pick from Home */}
      <input
        ref={homeFileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleHomeGalleryInput}
        className="hidden"
      />

      {/* Global Loading Overlay */}
      {isAppLoading && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {loadingMessage || 'Processing...'}
            </span>
          </div>
        </div>
      )}

      {/* Primary Top Bar */}
      {activeScreen !== 'camera' &&
        activeScreen !== 'crop' &&
        activeScreen !== 'filter' &&
        activeScreen !== 'document-detail' && (
          <Header
            settings={settings}
            onToggleTheme={handleToggleTheme}
            onOpenSettings={() => setIsSettingsOpen(true)}
            title={getHeaderTitle()}
            showBack={activeScreen !== 'home'}
            onBack={() => setActiveScreen('home')}
          />
        )}

      {/* Screen Routing */}
      {activeScreen === 'home' && (
        <DocumentList
          documents={documents}
          onOpenDocument={handleOpenDocument}
          onStartScan={handleStartNewScan}
          onImportGallery={() => homeFileInputRef.current?.click()}
          onDeleteDocument={handleDeleteDocument}
          onRenameDocument={handleRenameDocument}
          onExportDocument={(doc) => setExportDoc(doc)}
        />
      )}

      {activeScreen === 'camera' && (
        <CameraScanner
          onCaptureImage={handleCameraCapture}
          onImportMultiple={handleImportMultiple}
          onCancel={() => {
            if (pipelineTargetDocId) {
              setActiveScreen('document-detail');
            } else {
              setActiveScreen('home');
            }
          }}
        />
      )}

      {activeScreen === 'crop' && (
        <CropEditor
          originalDataUrl={pendingOriginalUrl}
          initialCorners={pendingCropPoints}
          onApplyCrop={handleApplyCrop}
          onCancel={() => {
            if (pipelineTargetDocId) {
              setActiveScreen('document-detail');
            } else {
              setActiveScreen('home');
            }
          }}
        />
      )}

      {activeScreen === 'filter' && (
        <FilterEditor
          unfilteredDataUrl={pendingCroppedUrl}
          initialFilter={pendingFilter}
          initialBrightness={pendingBrightness}
          initialContrast={pendingContrast}
          initialRotation={pendingRotation}
          onSavePage={handleSavePage}
          onCancel={() => setActiveScreen('crop')}
        />
      )}

      {activeScreen === 'document-detail' && activeDocument && (
        <DocumentDetail
          document={activeDocument}
          onBack={() => {
            setActiveDocId(null);
            setActiveScreen('home');
          }}
          onUpdateDocument={handleUpdateDocument}
          onDeleteDocument={handleDeleteDocument}
          onAddPageCamera={() => handleAddPageCamera(activeDocument.id)}
          onAddPageGallery={() => {
            setPipelineTargetDocId(activeDocument.id);
            setPipelineEditingPageIndex(null);
            homeFileInputRef.current?.click();
          }}
          onEditPageCrop={handleEditPageCrop}
          onEditPageFilter={handleEditPageFilter}
          onOpenExportModal={() => setExportDoc(activeDocument)}
        />
      )}

      {activeScreen === 'images-to-pdf' && (
        <ImagesToPdfModal
          defaultPageSize={settings.defaultPdfSize}
          onSaveAsDocument={async (newDoc) => {
            await dbService.saveDocument(newDoc);
            setDocuments((prev) => [newDoc, ...prev]);
            setActiveDocId(newDoc.id);
            setActiveScreen('document-detail');
          }}
          onClose={() => setActiveScreen('home')}
        />
      )}

      {activeScreen === 'qr-tools' && <QrBarcodeView />}

      {/* Bottom Navigation */}
      <BottomNav
        activeScreen={activeScreen}
        onNavigate={(screen) => {
          if (screen === 'camera') {
            handleStartNewScan();
          } else {
            setActiveScreen(screen);
          }
        }}
      />

      {/* Global Export PDF Modal */}
      {exportDoc && (
        <ExportModal
          document={exportDoc}
          defaultPageSize={settings.defaultPdfSize}
          isOpen={Boolean(exportDoc)}
          onClose={() => setExportDoc(null)}
        />
      )}

      {/* Global Settings Modal */}
      <SettingsModal
        settings={settings}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onUpdateSettings={handleUpdateSettings}
        onClearAllData={handleClearAllData}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;
