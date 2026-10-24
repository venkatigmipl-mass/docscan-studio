import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CornerPoints, Point } from '../types/scanner';
import { applyPerspectiveWarp } from '../services/imageProcessing';
import { RotateCcw, Check, X } from 'lucide-react';
import { useToast } from './Toast';

interface CropEditorProps {
  originalDataUrl: string;
  initialCorners?: CornerPoints;
  onApplyCrop: (croppedDataUrl: string, width: number, height: number, corners: CornerPoints) => void;
  onCancel: () => void;
}

type ActiveHandle = 'tl' | 'tr' | 'br' | 'bl' | null;

export const CropEditor: React.FC<CropEditorProps> = ({
  originalDataUrl,
  initialCorners,
  onApplyCrop,
  onCancel,
}) => {
  const toast = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const loupeCanvasRef = useRef<HTMLCanvasElement>(null);

  // Normalized points (0 to 1)
  const [corners, setCorners] = useState<CornerPoints>(() => {
    return (
      initialCorners || {
        tl: { x: 0.08, y: 0.08 },
        tr: { x: 0.92, y: 0.08 },
        br: { x: 0.92, y: 0.92 },
        bl: { x: 0.08, y: 0.92 },
      }
    );
  });

  const [activeHandle, setActiveHandle] = useState<ActiveHandle>(null);
  const [touchPos, setTouchPos] = useState<{ clientX: number; clientY: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  // Load natural image size
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = originalDataUrl;
  }, [originalDataUrl]);

  // Reset to full boundaries
  const handleResetAuto = () => {
    setCorners({
      tl: { x: 0.02, y: 0.02 },
      tr: { x: 0.98, y: 0.02 },
      br: { x: 0.98, y: 0.98 },
      bl: { x: 0.02, y: 0.98 },
    });
  };

  // Convert client coordinate (touch or mouse) to normalized (0..1) relative to image
  const getNormalizedPoint = useCallback((clientX: number, clientY: number): Point | null => {
    if (!imageRef.current) return null;
    const rect = imageRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;

    const rawX = (clientX - rect.left) / rect.width;
    const rawY = (clientY - rect.top) / rect.height;

    // Clamp within 0..1
    return {
      x: Math.max(0, Math.min(1, rawX)),
      y: Math.max(0, Math.min(1, rawY)),
    };
  }, []);

  // Update loupe magnifier canvas
  useEffect(() => {
    if (!activeHandle || !imageRef.current || !loupeCanvasRef.current) return;
    const canvas = loupeCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentPoint = corners[activeHandle];
    const img = imageRef.current;
    const naturalW = img.naturalWidth;
    const naturalH = img.naturalHeight;

    // Center in original pixels
    const cx = currentPoint.x * naturalW;
    const cy = currentPoint.y * naturalH;

    // Zoom window of 100x100 source pixels
    const cropSize = 90;
    const sx = Math.max(0, Math.min(naturalW - cropSize, cx - cropSize / 2));
    const sy = Math.max(0, Math.min(naturalH - cropSize, cy - cropSize / 2));

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, sx, sy, cropSize, cropSize, 0, 0, canvas.width, canvas.height);

    // Crosshairs
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
  }, [activeHandle, corners]);

  // Handle pointer down (mouse or touch)
  const handlePointerDown = (handle: ActiveHandle, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setActiveHandle(handle);
    setTouchPos({ clientX: e.clientX, clientY: e.clientY });
  };

  // Handle pointer move
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeHandle) return;
    e.preventDefault();
    setTouchPos({ clientX: e.clientX, clientY: e.clientY });

    const pt = getNormalizedPoint(e.clientX, e.clientY);
    if (!pt) return;

    setCorners((prev) => ({
      ...prev,
      [activeHandle]: pt,
    }));
  };

  // Handle pointer up
  const handlePointerUp = (e: React.PointerEvent) => {
    if (activeHandle) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Safe ignore
      }
      setActiveHandle(null);
      setTouchPos(null);
    }
  };

  // Apply perspective warp
  const handleApply = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const result = await applyPerspectiveWarp(originalDataUrl, corners);
      onApplyCrop(result.dataUrl, result.width, result.height, corners);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error applying crop';
      toast.error(msg);
      setIsProcessing(false);
    }
  };

  // SVG coordinate helpers (percentage strings)
  const pTl = `${corners.tl.x * 100}% ${corners.tl.y * 100}%`;
  const pTr = `${corners.tr.x * 100}% ${corners.tr.y * 100}%`;
  const pBr = `${corners.br.x * 100}% ${corners.br.y * 100}%`;
  const pBl = `${corners.bl.x * 100}% ${corners.bl.y * 100}%`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between max-w-md mx-auto select-none touch-none">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 pt-safe bg-slate-900/90 border-b border-slate-800 text-white z-20">
        <button
          type="button"
          onClick={onCancel}
          disabled={isProcessing}
          aria-label="Cancel crop"
          className="min-h-[44px] min-w-[44px] -ml-2 flex items-center justify-center text-slate-300 hover:text-white rounded-xl active:scale-95"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <span className="text-xs font-semibold tracking-wide text-white">Adjust Crop Corners</span>
          <p className="text-[10px] text-slate-400">Drag corners to frame document</p>
        </div>

        <button
          type="button"
          onClick={handleResetAuto}
          disabled={isProcessing}
          className="min-h-[44px] px-3 flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 rounded-xl active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Auto
        </button>
      </div>

      {/* Main Interactive Crop Canvas */}
      <div
        ref={containerRef}
        className="relative flex-1 flex items-center justify-center p-4 overflow-hidden"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div className="relative inline-block max-w-full max-h-full">
          <img
            ref={imageRef}
            src={originalDataUrl}
            alt="Original Scan"
            className="max-h-[62vh] max-w-full w-auto h-auto object-contain pointer-events-none rounded-lg shadow-2xl block"
            referrerPolicy="no-referrer"
          />

          {/* SVG Overlay Lines and Mask */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {/* Darkened mask outside polygon */}
            <path
              d={`M 0 0 L 100 0 L 100 100 L 0 100 Z M ${corners.tl.x * 100} ${corners.tl.y * 100} L ${corners.bl.x * 100} ${corners.bl.y * 100} L ${corners.br.x * 100} ${corners.br.y * 100} L ${corners.tr.x * 100} ${corners.tr.y * 100} Z`}
              fill="rgba(0, 0, 0, 0.55)"
              fillRule="evenodd"
            />
            {/* Polygon boundary line */}
            <polygon
              points={`${corners.tl.x * 100},${corners.tl.y * 100} ${corners.tr.x * 100},${corners.tr.y * 100} ${corners.br.x * 100},${corners.br.y * 100} ${corners.bl.x * 100},${corners.bl.y * 100}`}
              fill="none"
              stroke="#6366f1"
              strokeWidth="0.75"
              strokeDasharray="1.5, 1"
            />
          </svg>

          {/* Draggable Corner Handles */}
          {(['tl', 'tr', 'br', 'bl'] as const).map((handle) => {
            const pt = corners[handle];
            const isDragging = activeHandle === handle;

            return (
              <div
                key={handle}
                onPointerDown={(e) => handlePointerDown(handle, e)}
                style={{
                  left: `${pt.x * 100}%`,
                  top: `${pt.y * 100}%`,
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-30 cursor-grab active:cursor-grabbing p-3 -m-3 touch-none"
              >
                <div
                  className={`w-7 h-7 rounded-full border-2 border-white flex items-center justify-center shadow-lg transition-transform ${
                    isDragging
                      ? 'bg-indigo-500 scale-125 ring-4 ring-indigo-400/40'
                      : 'bg-indigo-600 hover:scale-110'
                  }`}
                >
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Loupe / Magnifier window when dragging a corner handle */}
        {activeHandle && touchPos && (
          <div
            className="fixed pointer-events-none z-50 w-24 h-24 rounded-full border-3 border-white shadow-2xl overflow-hidden bg-black -translate-x-1/2 -translate-y-1/2"
            style={{
              left: Math.max(60, Math.min(window.innerWidth - 60, touchPos.clientX)),
              top: Math.max(70, touchPos.clientY - 85),
            }}
          >
            <canvas
              ref={loupeCanvasRef}
              width={100}
              height={100}
              className="w-full h-full"
            />
          </div>
        )}
      </div>

      {/* Bottom Actions Bar */}
      <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between pb-safe">
        <button
          type="button"
          onClick={handleResetAuto}
          disabled={isProcessing}
          className="min-h-[44px] px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Full Frame
        </button>

        <button
          type="button"
          onClick={handleApply}
          disabled={isProcessing}
          className="min-h-[48px] px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 active:scale-95 transition-all disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Straightening...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Apply Crop</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
