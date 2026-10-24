import React, { useState, useEffect, useCallback } from 'react';
import { FilterType } from '../types/scanner';
import { processImageFilters, rotateImage, createThumbnail } from '../services/imageProcessing';
import { RotateCcw, RotateCw, Check, X, Sliders, Sparkles } from 'lucide-react';
import { useToast } from './Toast';

interface FilterEditorProps {
  unfilteredDataUrl: string; // The perspective-cropped image
  initialFilter?: FilterType;
  initialBrightness?: number;
  initialContrast?: number;
  initialRotation?: number;
  onSavePage: (
    processedDataUrl: string,
    filter: FilterType,
    brightness: number,
    contrast: number,
    rotation: number,
    width: number,
    height: number
  ) => void;
  onCancel: () => void;
}

const FILTER_PRESETS: Array<{ id: FilterType; label: string }> = [
  { id: 'original', label: 'Original' },
  { id: 'color', label: 'Color' },
  { id: 'bw', label: 'B&W' },
  { id: 'grayscale', label: 'Grayscale' },
  { id: 'lighten', label: 'Lighten' },
  { id: 'dark', label: 'Dark' },
  { id: 'noise', label: 'Noise Removal' },
];

export const FilterEditor: React.FC<FilterEditorProps> = ({
  unfilteredDataUrl,
  initialFilter = 'color',
  initialBrightness = 0,
  initialContrast = 0,
  initialRotation = 0,
  onSavePage,
  onCancel,
}) => {
  const toast = useToast();

  const [filter, setFilter] = useState<FilterType>(initialFilter);
  const [brightness, setBrightness] = useState<number>(initialBrightness);
  const [contrast, setContrast] = useState<number>(initialContrast);
  const [rotation, setRotation] = useState<number>(initialRotation);

  const [activeTab, setActiveTab] = useState<'presets' | 'adjust'>('presets');
  const [currentPreviewUrl, setCurrentPreviewUrl] = useState<string>(unfilteredDataUrl);
  const [previewDims, setPreviewDims] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter thumbnails previews
  const [filterThumbs, setFilterThumbs] = useState<Record<FilterType, string>>({} as Record<FilterType, string>);

  // Generate mini previews for each filter on mount
  useEffect(() => {
    let isMounted = true;
    const generatePreviews = async () => {
      try {
        const miniThumb = await createThumbnail(unfilteredDataUrl, 90);
        const thumbs: Partial<Record<FilterType, string>> = {};

        for (const preset of FILTER_PRESETS) {
          const res = await processImageFilters(miniThumb, preset.id, 0, 0);
          thumbs[preset.id] = res.dataUrl;
        }

        if (isMounted) {
          setFilterThumbs(thumbs as Record<FilterType, string>);
        }
      } catch (err) {
        console.warn('Failed generating filter thumbnails:', err);
      }
    };

    generatePreviews();
    return () => {
      isMounted = false;
    };
  }, [unfilteredDataUrl]);

  // Re-run pipeline whenever filter, brightness, contrast, or rotation changes
  const applyPipeline = useCallback(async () => {
    setIsProcessing(true);
    try {
      // Step 1: Rotate if needed
      let base = unfilteredDataUrl;
      if (rotation !== 0) {
        const rotRes = await rotateImage(unfilteredDataUrl, rotation);
        base = rotRes.dataUrl;
      }

      // Step 2: Apply filter & adjustments
      const res = await processImageFilters(base, filter, brightness, contrast);
      setCurrentPreviewUrl(res.dataUrl);
      setPreviewDims({ width: res.width, height: res.height });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error rendering filter preview';
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  }, [unfilteredDataUrl, filter, brightness, contrast, rotation, toast]);

  useEffect(() => {
    // Debounce slider updates slightly for smoothness
    const timer = setTimeout(() => {
      applyPipeline();
    }, 60);
    return () => clearTimeout(timer);
  }, [applyPipeline]);

  // Rotation handlers
  const handleRotateLeft = () => {
    setRotation((prev) => (prev - 90 + 360) % 360);
  };

  const handleRotateRight = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleDone = () => {
    if (isProcessing) return;
    onSavePage(
      currentPreviewUrl,
      filter,
      brightness,
      contrast,
      rotation,
      previewDims.width || 1200,
      previewDims.height || 1600
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between max-w-md mx-auto select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between p-4 pt-safe bg-slate-900/90 border-b border-slate-800 text-white z-20">
        <button
          type="button"
          onClick={onCancel}
          disabled={isProcessing}
          aria-label="Back"
          className="min-h-[44px] min-w-[44px] -ml-2 flex items-center justify-center text-slate-300 hover:text-white rounded-xl active:scale-95"
        >
          <X className="w-5 h-5" />
        </button>

        <span className="text-xs font-semibold text-white tracking-wide">Enhance & Filter</span>

        {/* Rotate buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleRotateLeft}
            disabled={isProcessing}
            aria-label="Rotate left"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-300 hover:text-white active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleRotateRight}
            disabled={isProcessing}
            aria-label="Rotate right"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-300 hover:text-white active:scale-95"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Image Preview Area */}
      <div className="relative flex-1 flex items-center justify-center p-4 overflow-hidden">
        <img
          src={currentPreviewUrl}
          alt="Filter Preview"
          className="max-h-[55vh] max-w-full w-auto h-auto object-contain rounded-lg shadow-2xl"
          referrerPolicy="no-referrer"
        />

        {isProcessing && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center">
            <div className="bg-slate-900/90 px-4 py-2.5 rounded-2xl border border-slate-700 flex items-center gap-2.5 text-xs text-white">
              <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              <span>Updating filter...</span>
            </div>
          </div>
        )}
      </div>

      {/* Filter and Adjustment Bottom Panel */}
      <div className="bg-slate-900 border-t border-slate-800 z-20 pb-safe">
        {/* Sub-tabs: Presets vs Adjust */}
        <div className="flex border-b border-slate-800/80 px-4">
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`flex-1 min-h-[44px] text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'presets'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Presets
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('adjust')}
            className={`flex-1 min-h-[44px] text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'adjust'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Adjust ({brightness !== 0 || contrast !== 0 ? 'Active' : '0'})
          </button>
        </div>

        {/* Tab 1: Presets Carousel */}
        {activeTab === 'presets' && (
          <div className="flex items-center gap-3 overflow-x-auto p-4 scrollbar-none">
            {FILTER_PRESETS.map((preset) => {
              const isSelected = filter === preset.id;
              const thumbUrl = filterThumbs[preset.id] || unfilteredDataUrl;

              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setFilter(preset.id)}
                  disabled={isProcessing}
                  className={`flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none min-h-[44px] ${
                    isSelected ? 'opacity-100' : 'opacity-80 hover:opacity-100'
                  }`}
                >
                  <div
                    className={`w-14 h-16 rounded-xl overflow-hidden border-2 transition-all p-0.5 ${
                      isSelected
                        ? 'border-indigo-500 ring-2 ring-indigo-500/30 scale-105'
                        : 'border-slate-700 group-hover:border-slate-600'
                    }`}
                  >
                    <img
                      src={thumbUrl}
                      alt={preset.label}
                      className="w-full h-full object-cover rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span
                    className={`text-[10px] whitespace-nowrap transition-colors ${
                      isSelected ? 'font-bold text-indigo-400' : 'text-slate-400'
                    }`}
                  >
                    {preset.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Tab 2: Brightness and Contrast Sliders */}
        {activeTab === 'adjust' && (
          <div className="p-4 flex flex-col gap-3">
            {/* Brightness Slider */}
            <div>
              <div className="flex justify-between items-center text-xs text-slate-300 mb-1">
                <span>Brightness</span>
                <span className="font-mono text-indigo-400 tabular-nums">
                  {brightness > 0 ? `+${brightness}` : brightness}
                </span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
              />
            </div>

            {/* Contrast Slider */}
            <div>
              <div className="flex justify-between items-center text-xs text-slate-300 mb-1">
                <span>Contrast</span>
                <span className="font-mono text-indigo-400 tabular-nums">
                  {contrast > 0 ? `+${contrast}` : contrast}
                </span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={contrast}
                onChange={(e) => setContrast(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
              />
            </div>

            {/* Reset Adjustments */}
            {(brightness !== 0 || contrast !== 0) && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setBrightness(0);
                    setContrast(0);
                  }}
                  className="text-[11px] text-slate-400 hover:text-indigo-400 underline py-1"
                >
                  Reset Sliders
                </button>
              </div>
            )}
          </div>
        )}

        {/* Bottom Save Action */}
        <div className="px-4 pb-4 pt-1 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            {previewDims.width > 0 && `${previewDims.width} × ${previewDims.height} px`}
          </div>

          <button
            type="button"
            onClick={handleDone}
            disabled={isProcessing}
            className="min-h-[46px] px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 active:scale-95 transition-all disabled:opacity-50"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Save Page</span>
          </button>
        </div>
      </div>
    </div>
  );
};
