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
    bg: 'bg-[#DCFCE7]',
    text: 'text-[#166534]',
    border: 'border-emerald-200/60',
    icon: <Leaf className="w-2.5 h-2.5 text-emerald-700 inline mr-1" />
  },
  vegan: {
    label: 'Végétalien',
    bg: 'bg-[#DCFCE7]',
    text: 'text-[#166534]',
    border: 'border-emerald-200/60',
    icon: <Leaf className="w-2.5 h-2.5 text-emerald-700 inline mr-1" />
  },
  bio: {
    label: 'Bio',
    bg: 'bg-[#FEF3C7]',
    text: 'text-[#92400E]',
    border: 'border-amber-200/60',
    icon: <Award className="w-2.5 h-2.5 text-amber-700 inline mr-1" />
  },
  fait_maison: {
    label: 'Fait Maison',
    bg: 'bg-[#FDE2E4]',
    text: 'text-[#991B1B]',
    border: 'border-rose-200/60',
    icon: <ChefHat className="w-2.5 h-2.5 text-rose-700 inline mr-1" />
  },
  viande_francaise: {
    label: 'Viande Locale',
    bg: 'bg-[#E0F2FE]',
    text: 'text-[#075985]',
    border: 'border-sky-200/60',
    icon: <span className="inline mr-1 text-[10px]">🇨🇮</span>
  },
  local: {
    label: 'Terroir Ivoirien',
    bg: 'bg-[#FEF3C7]',
    text: 'text-[#92400E]',
    border: 'border-amber-200/60',
    icon: <MapPin className="w-2.5 h-2.5 text-amber-700 inline mr-1" />
  },
  sans_porc: {
    label: 'Sans Porc',
    bg: 'bg-[#F4EFE6]',
    text: 'text-[#44403C]',
    border: 'border-stone-200',
    icon: <ShieldCheck className="w-2.5 h-2.5 text-stone-600 inline mr-1" />
  },
  halal: {
    label: 'Viande Halal',
    bg: 'bg-[#EDE9FE]',
    text: 'text-[#5B21B6]',
    border: 'border-purple-200/60',
    icon: <Heart className="w-2.5 h-2.5 text-purple-700 inline mr-1" />
  }
};

export const DietaryBadge: React.FC<BadgeProps> = ({ tag, size = 'sm' }) => {
  const config = TAG_LABELS[tag];
  if (!config) return null;

  return (
    <span
      className={`inline-flex items-center font-bold rounded-full ${config.bg} ${config.text} ${config.border} border ${
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
      }`}
    >
      {config.icon}
      {config.label}
    </span>
  );
};
