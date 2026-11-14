import React from 'react';
import {
  QrCode,
  Send,
  Lock,
  Headphones,
  Smartphone,
  ShieldCheck,
  LogOut,
  LogIn,
  ChevronRight,
  GraduationCap
} from 'lucide-react';
import { Canteen, UserProfile } from '../types';
import { lockAppNow } from './PinLock';
import { CroukOfficialGalleryAndAbout } from './CroukOfficialGalleryAndAbout';
import { triggerHaptic } from '../utils/haptics';

interface Props {
  user: UserProfile | null;
  canteens: Canteen[];
  selectedCanteen: Canteen;
  onSelectCanteen: (c: Canteen) => void;
  onOpenAuth: () => void;
  onOpenMyTickets: () => void;
  onOpenTransfer: () => void;
  onOpenSupport: () => void;
  onOpenApkModal: () => void;
  onOpenAdmin: () => void;
  onLogout: () => void;
}

export const ProfileView: React.FC<Props> = ({
  user,
  canteens,
  selectedCanteen,
  onSelectCanteen,
  onOpenAuth,
  onOpenMyTickets,
  onOpenTransfer,
  onOpenSupport,
  onOpenApkModal,
  onOpenAdmin,
  onLogout
}) => {
  const validCount = user?.savedTickets?.filter(t => t.status === 'valid').length || 0;

  return (
    <section className="space-y-6 select-none">
      <div className="px-0.5">
        <h1 className="ios-large-title">Profil</h1>
        <p className="text-[15px] text-[var(--ios-fg-secondary)] mt-1">
          Compte étudiant CROU Korhogo & paramètres
        </p>
      </div>

      {/* Student Identity Card or Sign In Card */}
      {user ? (
        <div className="ios-card p-5 sm:p-6 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#ea580c] text-white flex items-center justify-center text-[24px] font-extrabold flex-shrink-0 shadow-md">
            {(user.displayName || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-[20px] font-extrabold truncate">{user.displayName}</h2>
            <p className="text-[14px] text-[var(--ios-fg-secondary)] flex items-center gap-1.5 mt-0.5">
              <GraduationCap className="w-4 h-4 text-[#ea580c] flex-shrink-0" />
              <span className="font-mono font-bold tabular-nums">{user.matricule}</span>
              {(user.campus || user.university) && (
                <>
                  <span>·</span>
                  <span className="truncate">{user.campus || user.university}</span>
                </>
              )}
            </p>
            {user.email && !user.email.endsWith('@upgc.ci') && (
              <p className="text-[13px] text-[var(--ios-fg-secondary)] truncate mt-0.5">
                {user.email}
              </p>
            )}
            <p className="text-[13px] font-bold text-[#ea580c] mt-1">
              {validCount} ticket{validCount > 1 ? 's' : ''} actif{validCount > 1 ? 's' : ''}
            </p>
          </div>
        </div>
      ) : (
        <div className="ios-card p-6 space-y-4">
          <div>
            <h2 className="text-[20px] font-extrabold">Compte non connecté</h2>
            <p className="text-[15px] text-[var(--ios-fg-secondary)] mt-1 leading-snug">
              Connectez-vous avec votre matricule UPGC pour retrouver vos tickets et passer au tourniquet.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onOpenAuth();
            }}
            className="ios-btn-spring w-full min-h-[56px] bg-[#ea580c] text-white font-bold text-[17px] rounded-[20px] flex items-center justify-center gap-2 shadow-sm"
          >
            <LogIn className="w-5 h-5" />
            <span>Se connecter / S'inscrire</span>
          </button>
        </div>
      )}

      {/* Restaurant Selector */}
      <div className="ios-card p-4 sm:p-5 space-y-2">
        <label className="block text-[13px] font-bold uppercase tracking-wider text-[var(--ios-fg-secondary)]">
          Restaurant universitaire par défaut
        </label>
        <select
          value={selectedCanteen.id}
          onChange={(e) => {
            const found = canteens.find(c => c.id === e.target.value);
            if (found) onSelectCanteen(found);
          }}
          className="w-full min-h-[50px] px-4 bg-[var(--ios-bg)] border border-[var(--ios-border)] rounded-[16px] text-[16px] font-semibold text-[var(--ios-fg)] focus:outline-none focus:ring-2 focus:ring-[#ea580c]"
        >
          {canteens.map(c => (
            <option key={c.id} value={c.id} className="text-[#1d1d1f] bg-white">
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Grouped iOS Action Rows */}
      <div className="ios-card overflow-hidden divide-y divide-[var(--ios-border)]">
        {user && (
          <>
            <ProfileRow
              icon={QrCode}
              label="Mes tickets & QR codes"
              detail={`${validCount} valide${validCount > 1 ? 's' : ''}`}
              onClick={onOpenMyTickets}
            />
            <ProfileRow
              icon={Send}
              label="Offrir un ticket à un étudiant"
              onClick={onOpenTransfer}
            />
            <ProfileRow
              icon={Lock}
              label="Verrouiller l'app (Code PIN)"
              onClick={lockAppNow}
            />
          </>
        )}
        <ProfileRow
          icon={Headphones}
          label="Assistance CROU Korhogo"
          onClick={onOpenSupport}
        />
        <ProfileRow
          icon={Smartphone}
          label="Application Android (APK / PWA)"
          onClick={onOpenApkModal}
        />
        <ProfileRow
          icon={ShieldCheck}
          label={user?.role === 'admin' ? 'Ouvrir le tableau Admin' : 'Administration CROU'}
          onClick={onOpenAdmin}
        />
        {user && (
          <ProfileRow
            icon={LogOut}
            label="Se déconnecter"
            destructive
            onClick={onLogout}
          />
        )}
      </div>

      {/* Campus & History Info */}
      <CroukOfficialGalleryAndAbout />
    </section>
  );
};

interface RowProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  detail?: string;
  destructive?: boolean;
  onClick: () => void;
}

const ProfileRow: React.FC<RowProps> = ({ icon: Icon, label, detail, destructive, onClick }) => (
  <button
    type="button"
    onClick={() => {
      triggerHaptic('light');
      onClick();
    }}
    className="ios-btn-spring w-full min-h-[58px] px-5 flex items-center justify-between gap-3 text-left hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
  >
    <div className="flex items-center gap-3.5 min-w-0">
      <div
        className={`w-9 h-9 rounded-[11px] flex items-center justify-center flex-shrink-0 ${
          destructive
            ? 'bg-red-500/12 text-red-600 dark:text-red-400'
            : 'bg-[#ea580c]/12 text-[#ea580c]'
        }`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <span
        className={`text-[16px] font-semibold truncate ${
          destructive ? 'text-red-600 dark:text-red-400' : 'text-[var(--ios-fg)]'
        }`}
      >
        {label}
      </span>
    </div>

    <div className="flex items-center gap-2 flex-shrink-0">
      {detail && (
        <span className="text-[14px] font-semibold text-[var(--ios-fg-secondary)] tabular-nums">
          {detail}
        </span>
      )}
      <ChevronRight className="w-4 h-4 text-[var(--ios-fg-tertiary)]" />
    </div>
  </button>
);
