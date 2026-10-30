import React, { useState, useEffect } from 'react';
import { RefreshCw, ImageOff } from 'lucide-react';

interface ImageWithLoaderProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  fallbackIcon?: React.ReactNode;
  showSpiralText?: boolean;
  spiralLabel?: string;
}

const globalImageCache = new Set<string>();

/**
 * Image component that shows a fast-loading animated spiral (🌀) while fetching,
 * with instantaneous cache recognition, smooth opacity fade-in, and error retry.
 */
export const ImageWithLoader: React.FC<ImageWithLoaderProps> = ({
  src,
  alt,
  className = '',
  imgClassName = '',
  fallbackIcon,
  showSpiralText = true,
  spiralLabel = 'Téléchargement...',
  ...imgProps
}) => {
  const isInitiallyCached = Boolean(src && globalImageCache.has(src));
  const [loaded, setLoaded] = useState<boolean>(isInitiallyCached);
  const [error, setError] = useState<boolean>(false);
  const [retryKey, setRetryKey] = useState<number>(0);

  // Check if image is already cached by browser
  useEffect(() => {
    if (!src) {
      setError(true);
      return;
    }

    if (globalImageCache.has(src)) {
      setLoaded(true);
      setError(false);
      return;
    }

    const testImg = new Image();
    testImg.src = src;
    if (testImg.complete && testImg.naturalWidth > 0) {
      globalImageCache.add(src);
      setLoaded(true);
      setError(false);
    }
  }, [src, retryKey]);

  const handleLoad = () => {
    if (src) globalImageCache.add(src);
    setLoaded(true);
    setError(false);
  };

  const handleError = () => {
    setLoaded(false);
    setError(true);
  };

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    setError(false);
    setLoaded(false);
    setRetryKey(prev => prev + 1);
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* 🌀 Spiral Loading State */}
      {!loaded && !error && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/10 backdrop-blur-xs p-3 transition-opacity duration-300">
          <div className="relative flex items-center justify-center">
            {/* Outer spinning glow */}
            <div className="absolute w-12 h-12 rounded-full bg-gradient-to-tr from-orange-500/30 to-amber-400/20 animate-ping opacity-60"></div>
            
            {/* SVG Spiral 🌀 Graphic */}
            <svg 
              className="w-9 h-9 text-orange-500 animate-spin" 
              viewBox="0 0 50 50" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              style={{ animationDuration: '0.9s' }}
            >
              <defs>
                <linearGradient id="spiralGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f97316" />
                  <stop offset="50%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#ea580c" />
                </linearGradient>
              </defs>
              {/* Concentric spiral arms */}
              <circle cx="25" cy="25" r="20" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.15" />
              <path
                d="M25 5C13.9543 5 5 13.9543 5 25C5 30.5 7.2 35.5 10.8 39.1C14.4 42.7 19.4 45 25 45C36.0457 45 45 36.0457 45 25"
                stroke="url(#spiralGrad)"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <path
                d="M25 12C17.8203 12 12 17.8203 12 25C12 32.1797 17.8203 38 25 38"
                stroke="#f97316"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeOpacity="0.8"
              />
              <path
                d="M25 19C21.6863 19 19 21.6863 19 25"
                stroke="#ea580c"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="25" cy="25" r="2.5" fill="#f97316" />
            </svg>
          </div>

          {showSpiralText && (
            <span className="mt-2 text-[10px] font-bold text-slate-700 bg-white/90 px-2 py-0.5 rounded-full shadow-xs tracking-wider flex items-center space-x-1">
              <span>🌀</span>
              <span>{spiralLabel}</span>
            </span>
          )}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-100 text-slate-500 p-3 text-center">
          {fallbackIcon || <ImageOff className="w-8 h-8 text-slate-400 mb-1" />}
          <span className="text-[11px] font-medium text-slate-600">Image indisponible</span>
          <button
            type="button"
            onClick={handleRetry}
            className="mt-1.5 inline-flex items-center space-x-1 px-2.5 py-1 text-[10px] font-bold bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 shadow-xs"
          >
            <RefreshCw className="w-3 h-3 text-orange-500" />
            <span>Réessayer</span>
          </button>
        </div>
      )}

      {/* Target Image */}
      <img
        {...imgProps}
        key={`${src}-${retryKey}`}
        src={src}
        alt={alt}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        } ${imgClassName}`}
      />
    </div>
  );
};
