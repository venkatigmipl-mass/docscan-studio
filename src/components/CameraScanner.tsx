import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Zap, ZapOff, Image as ImageIcon, X, AlertTriangle, RefreshCw } from 'lucide-react';
import { compressImage } from '../services/imageProcessing';
import { useToast } from './Toast';

interface CameraScannerProps {
  onCaptureImage: (compressedDataUrl: string, width: number, height: number) => void;
  onImportMultiple: (images: Array<{ dataUrl: string; width: number; height: number }>) => void;
  onCancel: () => void;
}

export const CameraScanner: React.FC<CameraScannerProps> = ({
  onCaptureImage,
  onImportMultiple,
  onCancel,
}) => {
  const toast = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isShutterActive, setIsShutterActive] = useState(false);

  // Initialize camera
  const startCamera = useCallback(async () => {
    setErrorMessage(null);
    setHasPermission(null);

    // Stop existing stream if any
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by this browser.');
      }

      // Prefer rear environment camera with high resolution
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      setHasPermission(true);

      // Check torch capability
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = videoTrack.getCapabilities ? (videoTrack.getCapabilities() as Record<string, unknown>) : null;
        if (capabilities && 'torch' in capabilities) {
          setTorchSupported(true);
        } else {
          setTorchSupported(false);
        }
      }
    } catch (err: unknown) {
      console.warn('Camera error:', err);
      setHasPermission(false);
      let msg = 'Could not access camera. Please allow camera permissions.';
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          msg = 'Camera permission was denied. You can still scan by picking photos from your gallery.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          msg = 'No camera found on this device. You can pick photos from your gallery instead.';
        } else {
          msg = err.message || msg;
        }
      }
      setErrorMessage(msg);
      toast.error(msg);
    }
  }, [toast]);

  useEffect(() => {
    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [startCamera]);

  // Toggle flash/torch
  const handleToggleTorch = async () => {
    if (!streamRef.current || !torchSupported) return;
    try {
      const track = streamRef.current.getVideoTracks()[0];
      const nextTorch = !torchOn;
      // applyConstraints expects torch boolean
      await (track as MediaStreamTrack & { applyConstraints: (c: Record<string, unknown>) => Promise<void> }).applyConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setTorchOn(nextTorch);
    } catch (err) {
      toast.error('Torch could not be toggled on this device.');
      console.warn('Torch error', err);
    }
  };

  // Capture current video frame
  const handleCapture = async () => {
    if (isProcessing || !videoRef.current) return;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      toast.error('Camera video is not ready yet');
      return;
    }

    setIsProcessing(true);
    setIsShutterActive(true);
    setTimeout(() => setIsShutterActive(false), 200);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context unavailable');

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const rawDataUrl = canvas.toDataURL('image/jpeg', 0.95);

      // Compress to max 1600px
      const compressed = await compressImage(rawDataUrl, 1600);
      onCaptureImage(compressed.dataUrl, compressed.width, compressed.height);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to capture frame';
      toast.error(msg);
      setIsProcessing(false);
    }
  };

  // Handle multi-select from gallery
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    try {
      const processedList: Array<{ dataUrl: string; width: number; height: number }> = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const compressed = await compressImage(file, 1600);
        processedList.push(compressed);
      }

      if (processedList.length === 1) {
        onCaptureImage(processedList[0].dataUrl, processedList[0].width, processedList[0].height);
      } else if (processedList.length > 1) {
        onImportMultiple(processedList);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error processing gallery image';
      toast.error(msg);
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between max-w-md mx-auto overflow-hidden">
      {/* Top Camera Controls */}
      <div className="flex items-center justify-between p-4 z-20 bg-gradient-to-b from-black/80 to-transparent">
        <button
          type="button"
          onClick={onCancel}
          disabled={isProcessing}
          aria-label="Cancel Scan"
          className="min-h-[44px] min-w-[44px] rounded-full bg-white/15 backdrop-blur-md text-white flex items-center justify-center active:scale-95 transition-transform"
        >
          <X className="w-5 h-5" />
        </button>

        <span className="text-xs font-semibold tracking-wider uppercase text-white/90 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md">
          Document Scanner
        </span>

        {torchSupported ? (
          <button
            type="button"
            onClick={handleToggleTorch}
            disabled={isProcessing}
            aria-label="Toggle Flash"
            className={`min-h-[44px] min-w-[44px] rounded-full backdrop-blur-md flex items-center justify-center active:scale-95 transition-all ${
              torchOn ? 'bg-amber-400 text-slate-900' : 'bg-white/15 text-white'
            }`}
          >
            {torchOn ? <Zap className="w-5 h-5 fill-current" /> : <ZapOff className="w-5 h-5" />}
          </button>
        ) : (
          <div className="w-11 h-11" />
        )}
      </div>

      {/* Main Camera Viewfinder or Fallback */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden bg-slate-950">
        {hasPermission === false ? (
          <div className="p-6 text-center text-white max-w-xs">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-base font-semibold mb-2">Camera Unavailable</h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              {errorMessage || 'Camera access was blocked or not detected.'}
            </p>
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="min-h-[48px] px-5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-2xl flex items-center justify-center gap-2 active:scale-95 shadow-md shadow-indigo-600/30"
              >
                <ImageIcon className="w-4 h-4" />
                Pick from Gallery
              </button>
              <button
                type="button"
                onClick={startCamera}
                className="min-h-[44px] px-4 bg-white/10 hover:bg-white/20 text-white font-medium text-xs rounded-2xl flex items-center justify-center gap-2 active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                Retry Camera
              </button>
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="w-full h-full object-cover"
            />

            {/* Document Frame Guide Overlay */}
            <div className="absolute inset-8 pointer-events-none border-2 border-white/40 rounded-2xl flex flex-col justify-between p-3">
              <div className="flex justify-between">
                <div className="w-6 h-6 border-t-4 border-l-4 border-indigo-400 rounded-tl-lg" />
                <div className="w-6 h-6 border-t-4 border-r-4 border-indigo-400 rounded-tr-lg" />
              </div>
              <div className="text-center">
                <span className="text-[11px] font-medium text-white/80 bg-black/50 px-2.5 py-1 rounded-full backdrop-blur-xs">
                  Align document within frame
                </span>
              </div>
              <div className="flex justify-between">
                <div className="w-6 h-6 border-b-4 border-l-4 border-indigo-400 rounded-bl-lg" />
                <div className="w-6 h-6 border-b-4 border-r-4 border-indigo-400 rounded-br-lg" />
              </div>
            </div>

            {/* Shutter Flash Animation */}
            {isShutterActive && (
              <div className="absolute inset-0 bg-white opacity-80 pointer-events-none transition-opacity duration-150" />
            )}
          </>
        )}
      </div>

      {/* Hidden File Input for Gallery Fallback / Multi-Select */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Bottom Controls Bar */}
      <div className="p-6 bg-gradient-to-t from-black via-black/80 to-transparent flex items-center justify-between z-20 pb-safe">
        {/* Gallery Pick Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="min-h-[48px] min-w-[48px] p-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white flex flex-col items-center justify-center active:scale-95 transition-transform"
          aria-label="Pick from gallery"
        >
          <ImageIcon className="w-5 h-5" />
          <span className="text-[9px] mt-1 font-medium">Gallery</span>
        </button>

        {/* Shutter Capture Button */}
        <button
          type="button"
          onClick={handleCapture}
          disabled={isProcessing || hasPermission === false}
          aria-label="Take picture"
          className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1.5 active:scale-90 transition-transform disabled:opacity-40"
        >
          <div className="w-full h-full bg-white rounded-full flex items-center justify-center shadow-lg">
            {isProcessing && (
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            )}
          </div>
        </button>

        {/* Placeholder to balance layout */}
        <div className="w-12 h-12" />
      </div>
    </div>
  );
};
