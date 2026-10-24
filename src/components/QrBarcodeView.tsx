import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  Scan,
  Download,
  Copy,
  ExternalLink,
  Check,
  AlertCircle,
  RefreshCw,
  Image as ImageIcon,
  Wifi,
  Globe,
  FileText,
} from 'lucide-react';
import { useToast } from './Toast';

// TypeScript declaration for BarcodeDetector API
declare global {
  interface Window {
    BarcodeDetector?: {
      new (options?: { formats: string[] }): {
        detect: (image: ImageBitmapSource) => Promise<Array<{ rawValue: string; format: string }>>;
      };
      getSupportedFormats?: () => Promise<string[]>;
    };
  }
}

export const QrBarcodeView: React.FC = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'generate' | 'scan'>('generate');

  // Generate State
  const [inputText, setInputText] = useState('https://example.com');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Scan State
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const [isScanningActive, setIsScanningActive] = useState(false);
  const [scannedResult, setScannedResult] = useState<{ value: string; format: string } | null>(null);
  const [barcodeSupported, setBarcodeSupported] = useState<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check BarcodeDetector support on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isSupported = 'BarcodeDetector' in window;
      setBarcodeSupported(isSupported);
    }
  }, []);

  // Generate QR Code on input change
  useEffect(() => {
    if (!inputText.trim()) {
      setQrDataUrl('');
      return;
    }

    QRCode.toDataURL(inputText.trim(), {
      width: 400,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.warn('QR generation error:', err));
  }, [inputText]);

  // Clean up camera on tab change or unmount
  const stopCamera = () => {
    if (scanIntervalRef.current) {
      window.clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsScanningActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Start BarcodeDetector camera scanning
  const startScanningCamera = async () => {
    if (!('BarcodeDetector' in window) || !window.BarcodeDetector) {
      toast.error('BarcodeDetector API is not supported in this browser.');
      return;
    }

    setScannedResult(null);
    stopCamera();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsScanningActive(true);

      const detector = new window.BarcodeDetector({
        formats: ['qr_code', 'ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'data_matrix'],
      });

      // Poll frames
      const interval = window.setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) return;
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes && barcodes.length > 0) {
            const first = barcodes[0];
            setScannedResult({ value: first.rawValue, format: first.format });
            toast.success(`Scanned ${first.format}!`);
            stopCamera();
          }
        } catch {
          // Ignore transient detection errors
        }
      }, 350);

      scanIntervalRef.current = interval;
    } catch (err: unknown) {
      console.warn('Scan camera error:', err);
      toast.error('Could not start scanner camera. Check permissions.');
    }
  };

  // Scan from photo upload using BarcodeDetector
  const handleScanFromImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!('BarcodeDetector' in window) || !window.BarcodeDetector) {
      toast.error('BarcodeDetector is not supported in this browser.');
      return;
    }

    try {
      const detector = new window.BarcodeDetector({
        formats: ['qr_code', 'ean_13', 'ean_8', 'code_128', 'code_39', 'data_matrix'],
      });

      const bitmap = await createImageBitmap(file);
      const results = await detector.detect(bitmap);

      if (results && results.length > 0) {
        const first = results[0];
        setScannedResult({ value: first.rawValue, format: first.format });
        toast.success(`Detected ${first.format}!`);
      } else {
        toast.error('No QR code or barcode found in this image.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed detecting barcode';
      toast.error(msg);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Download QR code PNG
  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `QRCode_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('QR Code saved as PNG');
  };

  // Copy text to clipboard
  const handleCopyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed copying to clipboard');
    }
  };

  const isUrl = (val: string) => /^https?:\/\//i.test(val);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 pb-36 max-w-md mx-auto">
      {/* Tab bar header */}
      <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-800 p-1">
          <button
            type="button"
            onClick={() => {
              stopCamera();
              setActiveTab('generate');
            }}
            className={`flex-1 min-h-[44px] text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'generate'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <QrCode className="w-4 h-4" />
            Generate QR
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('scan');
            }}
            className={`flex-1 min-h-[44px] text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'scan'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Scan className="w-4 h-4" />
            Scan Code
          </button>
        </div>
      </div>

      {/* Main Tab Panels */}
      <main className="flex-1 p-4 flex flex-col gap-4">
        {activeTab === 'generate' ? (
          /* Generate QR Code Tab */
          <div className="flex flex-col gap-4">
            {/* Quick Templates */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setInputText('https://')}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1 shrink-0"
              >
                <Globe className="w-3 h-3 text-indigo-500" />
                Website URL
              </button>
              <button
                type="button"
                onClick={() => setInputText('WIFI:S:MyNetwork;T:WPA;P:SecretPassword;;')}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1 shrink-0"
              >
                <Wifi className="w-3 h-3 text-emerald-500" />
                WiFi Network
              </button>
              <button
                type="button"
                onClick={() => setInputText('DocScan Studio offline scan')}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1 shrink-0"
              >
                <FileText className="w-3 h-3 text-amber-500" />
                Plain Text
              </button>
            </div>

            {/* Input Form */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Text or URL to Encode
              </label>
              <textarea
                rows={3}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Enter URL, text, email or WiFi details..."
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            {/* QR Code Preview Card */}
            {qrDataUrl && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col items-center">
                <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-inner mb-4">
                  <img
                    src={qrDataUrl}
                    alt="Generated QR Code"
                    className="w-52 h-52 object-contain"
                  />
                </div>

                <div className="flex items-center gap-2 w-full max-w-xs">
                  <button
                    type="button"
                    onClick={handleDownloadQr}
                    className="flex-1 min-h-[46px] bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-indigo-600/30 active:scale-95 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PNG</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopyText(inputText)}
                    className="min-h-[46px] min-w-[46px] px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl flex items-center justify-center active:scale-95"
                    title="Copy text"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Scan Code Tab */
          <div className="flex flex-col gap-4">
            {!barcodeSupported ? (
              /* Fallback message for unsupported browsers */
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-3xl p-5 text-amber-900 dark:text-amber-200 flex flex-col items-center text-center">
                <AlertCircle className="w-10 h-10 text-amber-500 mb-2" />
                <h3 className="text-sm font-bold mb-1">BarcodeDetector Not Supported</h3>
                <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed mb-4">
                  The native BarcodeDetector API is not supported in this browser engine. For camera-based barcode scanning, please open this app in Google Chrome, Microsoft Edge, or Android Chrome.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('generate')}
                  className="min-h-[44px] px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs active:scale-95 transition-transform"
                >
                  Switch to QR Generator
                </button>
              </div>
            ) : (
              <>
                {/* Active Camera Viewfinder */}
                <div className="relative w-full aspect-square bg-black rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md flex items-center justify-center">
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    autoPlay
                    className={`w-full h-full object-cover ${isScanningActive ? 'block' : 'hidden'}`}
                  />

                  {!isScanningActive && (
                    <div className="text-center p-6 flex flex-col items-center">
                      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3">
                        <Scan className="w-8 h-8" />
                      </div>
                      <p className="text-xs text-slate-400 mb-4">
                        Point camera at a QR code or barcode to read it instantly
                      </p>
                      <button
                        type="button"
                        onClick={startScanningCamera}
                        className="min-h-[46px] px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-2 active:scale-95 shadow-md shadow-indigo-600/30"
                      >
                        <Scan className="w-4 h-4" />
                        Start Live Scanner
                      </button>
                    </div>
                  )}

                  {isScanningActive && (
                    <>
                      {/* Scanning reticle */}
                      <div className="absolute inset-10 border-2 border-indigo-400/80 rounded-2xl pointer-events-none flex flex-col justify-between p-2">
                        <div className="w-full h-0.5 bg-rose-500 shadow-md shadow-rose-500 animate-bounce mt-10" />
                        <span className="text-[10px] text-center text-white bg-black/60 px-2 py-0.5 rounded-full mx-auto backdrop-blur-xs">
                          Scanning...
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={stopCamera}
                        className="absolute top-3 right-3 min-h-[36px] min-w-[36px] bg-black/60 text-white rounded-full flex items-center justify-center"
                      >
                        ✕
                      </button>
                    </>
                  )}
                </div>

                {/* Scan from file input fallback */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleScanFromImage}
                  className="hidden"
                />

                <div className="flex gap-2">
                  {isScanningActive ? (
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="flex-1 min-h-[44px] bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs rounded-2xl active:scale-95"
                    >
                      Stop Camera
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={startScanningCamera}
                      className="flex-1 min-h-[44px] bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-2xl flex items-center justify-center gap-2 active:scale-95"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Scan with Camera
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 min-h-[44px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-2xl flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <ImageIcon className="w-4 h-4 text-slate-500" />
                    Scan Image
                  </button>
                </div>

                {/* Scanned Result Card */}
                {scannedResult && (
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-emerald-500/30 shadow-md animate-in fade-in">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                        {scannedResult.format}
                      </span>
                    </div>

                    <p className="text-xs font-mono text-slate-800 dark:text-slate-200 break-all p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl mb-3">
                      {scannedResult.value}
                    </p>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyText(scannedResult.value)}
                        className="flex-1 min-h-[44px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Copy
                      </button>

                      {isUrl(scannedResult.value) && (
                        <a
                          href={scannedResult.value}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 min-h-[44px] bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Open Link
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
