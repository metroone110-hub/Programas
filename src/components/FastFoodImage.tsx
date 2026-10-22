import React, { useState } from 'react';
import { Utensils, Sparkles } from 'lucide-react';

interface FastFoodImageProps {
  src?: string;
  alt: string;
  className?: string;
  category?: string;
}

export const FastFoodImage: React.FC<FastFoodImageProps> = ({
  src,
  alt,
  className = '',
  category
}) => {
  const [loaded, setLoaded] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);

  // Fallback category color palette
  const getGradient = () => {
    switch (category) {
      case 'Plat Chaud':
      case 'plat':
        return 'from-amber-600/90 via-orange-600/80 to-red-700/90';
      case 'Accompagnement':
      case 'accompagnement':
        return 'from-amber-500/90 via-yellow-600/80 to-orange-600/90';
      case 'Dessert & Fraîcheur':
      case 'dessert':
        return 'from-emerald-600/90 via-teal-600/80 to-lime-600/90';
      case 'Ticket Numérique':
      case 'tickets':
      case 'souches':
        return 'from-orange-500 via-amber-600 to-rose-600';
      default:
        return 'from-orange-600 via-amber-700 to-zinc-800';
    }
  };

  return (
    <div className={`relative overflow-hidden bg-slate-100 ${className}`}>
      {/* Instant Warm Gradient Backdrop & Placeholder - Renders in 0ms (no blank square) */}
      <div 
        className={`absolute inset-0 bg-gradient-to-br ${getGradient()} flex flex-col items-center justify-center p-3 text-white transition-opacity duration-300 ${
          loaded && !error ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center mb-1">
          <Utensils className="w-5 h-5 text-white drop-shadow-sm" />
        </div>
        <span className="text-[10px] font-extrabold text-white/90 text-center line-clamp-1 drop-shadow-xs">
          CROU Korhogo
        </span>
      </div>

      {/* Real Food Image with Eager Loading & Smooth Fade-in */}
      {src && !error && (
        <img
          src={src}
          alt={alt}
          loading="eager"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`w-full h-full object-cover transition-all duration-300 ${
            loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        />
      )}
    </div>
  );
};
