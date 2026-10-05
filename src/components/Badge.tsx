import React from 'react';
import { Leaf, Award, ChefHat, MapPin, ShieldCheck, Heart } from 'lucide-react';
import type { DietaryTag } from '../types';

interface BadgeProps {
  tag: DietaryTag;
  size?: 'sm' | 'md';
}

export const TAG_LABELS: Record<DietaryTag, { label: string; bg: string; text: string; border: string; icon: React.ReactNode }> = {
  veggie: {
    label: 'Végétarien',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: <Leaf className="w-3 h-3 text-emerald-600 inline mr-1" />
  },
  vegan: {
    label: 'Végétalien',
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    border: 'border-teal-200',
    icon: <Leaf className="w-3 h-3 text-teal-600 inline mr-1" />
  },
  bio: {
    label: 'Bio',
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
    icon: <Award className="w-3 h-3 text-green-600 inline mr-1" />
  },
  fait_maison: {
    label: 'Fait Maison',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    icon: <ChefHat className="w-3 h-3 text-amber-600 inline mr-1" />
  },
  viande_francaise: {
    label: 'Viande 100% France (VBF)',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: <span className="inline mr-1 text-xs">🇫🇷</span>
  },
  local: {
    label: 'Circuit Court & Local',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    icon: <MapPin className="w-3 h-3 text-indigo-600 inline mr-1" />
  },
  sans_porc: {
    label: 'Sans Porc',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    icon: <ShieldCheck className="w-3 h-3 text-slate-500 inline mr-1" />
  },
  halal: {
    label: 'Viande Halal',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    icon: <Heart className="w-3 h-3 text-purple-600 inline mr-1" />
  }
};

export const DietaryBadge: React.FC<BadgeProps> = ({ tag, size = 'sm' }) => {
  const config = TAG_LABELS[tag];
  if (!config) return null;

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${config.bg} ${config.text} ${config.border} ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      }`}
    >
      {config.icon}
      {config.label}
    </span>
  );
};
