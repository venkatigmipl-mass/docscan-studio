import React, { useState, useEffect, useCallback, useRef } from 'react';
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

  // Hidden multi-file input for home screen import
  const homeFileInputRef = useRef<HTMLInputElement>(null);

  // Load Settings and Documents on Mount
  useEffect(() => {
    const initApp = async () => {
      try {
        const loadedSettings = await dbService.getSettings();
        setSettings(loadedSettings);
        applyThemeClass(loadedSettings.theme);

        const loadedDocs = await dbService.getAllDocuments();
        setDocuments(loadedDocs);
      } catch (err: unknown) {
        console.warn('Initialization error:', err);
        toast.error('Failed loading saved documents from storage.');
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
    const updated = await dbService.saveSettings({ theme: nextTheme });
    setSettings(updated);
  };

  const handleUpdateSettings = async (partial: Partial<AppSettings>) => {
    if (partial.theme) {
      applyThemeClass(partial.theme);
    }
    const updated = await dbService.saveSettings(partial);
    setSettings(updated);
    toast.success('Settings saved');
  };

  // Current active document
  const activeDocument = documents.find((d) => d.id === activeDocId) || null;

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
          setDocuments((prev) => prev.map((d) => (d.id === updatedDoc.id ? updatedDoc : d)));
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
        thumbnail: newPages[0].processedDataUrl,
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

  // Filter step completed -> Save Page into Document
  const handleSavePage = async (
    processedDataUrl: string,
    filter: FilterType,
    brightness: number,
    contrast: number,
    rotation: number,
    width: number,
    height: number
  ) => {
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
            // Replace existing page
            updatedPages[pipelineEditingPageIndex] = {
              ...pageData,
              id: target.pages[pipelineEditingPageIndex].id,
            };
          } else {
            // Append as new page
            updatedPages.push(pageData);
          }

          const updatedDoc: ScannedDocument = {
            ...target,
            pages: updatedPages,
            pageCount: updatedPages.length,
            thumbnail: updatedPages[0]?.processedDataUrl || '',
            updatedAt: Date.now(),
          };

          await dbService.saveDocument(updatedDoc);
          setDocuments((prev) => prev.map((d) => (d.id === updatedDoc.id ? updatedDoc : d)));
          setActiveDocId(updatedDoc.id);
          setActiveScreen('document-detail');
          toast.success(pipelineEditingPageIndex !== null ? 'Page updated' : 'Page added to document');
          return;
        }
      }

      // Creating a new document with this initial page
      const newDoc: ScannedDocument = {
        id: Math.random().toString(36).substring(2, 9),
        name: generateDefaultDocName(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        pageCount: 1,
        thumbnail: processedDataUrl,
        pages: [pageData],
      };

      await dbService.saveDocument(newDoc);
      setDocuments((prev) => [newDoc, ...prev]);
      setActiveDocId(newDoc.id);
      setActiveScreen('document-detail');
      toast.success('Document created & saved');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error saving page';
      toast.error(msg);
      setActiveScreen('home');
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
    await dbService.saveDocument(updated);
    setDocuments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
  };

  const handleDeleteDocument = async (id: string) => {
    await dbService.deleteDocument(id);
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    if (activeDocId === id) {
      setActiveDocId(null);
      setActiveScreen('home');
    }
    toast.success('Document deleted');
  };

  const handleRenameDocument = async (id: string, newName: string) => {
    const doc = documents.find((d) => d.id === id);
    if (!doc) return;
    const updated = { ...doc, name: newName, updatedAt: Date.now() };
    await dbService.saveDocument(updated);
    setDocuments((prev) => prev.map((d) => (d.id === id ? updated : d)));
    toast.success('Document renamed');
  };

  const handleClearAllData = async () => {
    await dbService.clearAllData();
    setDocuments([]);
    setActiveDocId(null);
    setActiveScreen('home');
  };

  // Direct gallery file select from Home or Detail
  const handleHomeGalleryInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const processed: Array<{ dataUrl: string; width: number; height: number }> = [];
      for (let i = 0; i < files.length; i++) {
        const res = await compressImage(files[i], 1600);
        processed.push(res);
      }

      if (processed.length === 1) {
        handleCameraCapture(processed[0].dataUrl, processed[0].width, processed[0].height);
      } else {
        handleImportMultiple(processed);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error reading image';
      toast.error(msg);
    } finally {
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
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Hidden file input for direct photo pick */}
      <input
        ref={homeFileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleHomeGalleryInput}
        className="hidden"
      />

      {/* Primary Top Bar (hidden during full-screen camera/crop/filter and doc detail which has its own header) */}
      {activeScreen !== 'camera' && activeScreen !== 'crop' && activeScreen !== 'filter' && activeScreen !== 'document-detail' && (
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
