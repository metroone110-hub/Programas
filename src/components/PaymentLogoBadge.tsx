import React from 'react';
import { CreditCard } from 'lucide-react';

export type PaymentBrand = 'wave' | 'orange' | 'mtn' | 'moov' | 'djamo' | 'mobile_money' | 'carte';

interface Props {
  brand: PaymentBrand;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<Props['size']>, string> = {
  xs: 'w-7 h-7 rounded-[9px]',
  sm: 'w-9 h-9 rounded-[11px]',
  md: 'w-12 h-12 rounded-[14px]',
  lg: 'w-14 h-14 rounded-[16px]',
};

export const PAYMENT_LOGOS: Record<Exclude<PaymentBrand, 'carte'>, { src: string; label: string; bg: string }> = {
  wave: {
    src: '/assets/aistudio/IMG_1716_f2afec1f.jpeg',
    label: 'Wave',
    bg: 'bg-[#19b5fe]',
  },
  orange: {
    src: '/assets/payments/orange-money.png',
    label: 'Orange Money',
    bg: 'bg-black',
  },
  mtn: {
    src: '/assets/payments/mtn-momo.png',
    label: 'MTN MoMo',
    bg: 'bg-[#ffcc00]',
  },
  moov: {
    src: '/assets/payments/moov-money.png',
    label: 'Moov Money',
    bg: 'bg-white',
  },
  djamo: {
    src: '/assets/aistudio/IMG_1717_3a1d1b2c.jpeg',
    label: 'Djamo',
    bg: 'bg-[#252631]',
  },
  mobile_money: {
    src: '/assets/aistudio/IMG_1715_483931a6.png',
    label: 'Mobile Money',
    bg: 'bg-white',
  },
};

export const PaymentLogoBadge: React.FC<Props> = ({ brand, size = 'sm', className = '' }) => {
  const sizeClass = SIZE_CLASSES[size];

  if (brand === 'carte') {
    return (
      <div
        className={`${sizeClass} bg-slate-100 dark:bg-zinc-800 border border-black/10 dark:border-white/15 flex items-center justify-center flex-shrink-0 ${className}`}
      >
        <CreditCard className="w-1/2 h-1/2 text-[#1d1d1f] dark:text-white" />
      </div>
    );
  }

  const asset = PAYMENT_LOGOS[brand];
  const isContain = brand === 'mobile_money' || brand === 'moov';

  return (
    <div
      className={`${sizeClass} ${asset.bg} overflow-hidden flex items-center justify-center flex-shrink-0 border border-black/10 dark:border-white/15 shadow-xs ${className}`}
    >
      <img
        src={asset.src}
        alt={asset.label}
        loading="eager"
        className={`w-full h-full ${isContain ? 'object-contain p-0.5' : 'object-cover'}`}
      />
    </div>
  );
};
