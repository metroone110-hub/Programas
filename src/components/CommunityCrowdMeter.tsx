import React, { useState } from 'react';
import { Users, Clock, CheckCircle2, Flame, RefreshCw } from 'lucide-react';
import type { CommunityCrowdData } from '../types';

interface CommunityCrowdMeterProps {
  crowdReport?: CommunityCrowdData;
  onVoteRecorded?: (newReport: CommunityCrowdData) => void;
}

export const CommunityCrowdMeter: React.FC<CommunityCrowdMeterProps> = ({
  crowdReport,
  onVoteRecorded
}) => {
  const [isVoting, setIsVoting] = useState(false);
  const [voteFeedback, setVoteFeedback] = useState<string | null>(null);

  const level = crowdReport?.currentLevel || 'fluide';
  const totalVotes = crowdReport?.totalVotes || 1;

  const handleVote = async (status: 'fluide' | 'moyen' | 'fort') => {
    setIsVoting(true);
    try {
      const res = await fetch('/api/crowd/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data && onVoteRecorded) {
          onVoteRecorded(json.data);
        }
        const label = status === 'fluide' ? 'Fluide (< 5 min)' : status === 'moyen' ? 'Moyenne (10-15 min)' : 'Grosse file (> 20 min)';
        setVoteFeedback(`✓ Merci ! Tu as signalé la file comme « ${label} ». Affluence mise à jour pour tous les étudiants.`);
        setTimeout(() => setVoteFeedback(null), 4000);
      }
    } catch (e) {
      console.error('Erreur vote affluence:', e);
    } finally {
      setIsVoting(false);
    }
  };

  const getLevelConfig = () => {
    switch (level) {
      case 'fort':
        return {
          color: 'bg-rose-500',
          textColor: 'text-rose-950',
          badgeBg: 'bg-rose-100 text-rose-900 border-rose-200',
          title: 'Forte Affluence · Grosse Queue',
          waitTime: 'Attente estimée : > 20 minutes',
          description: 'Longue file sous le préau. Si vous êtes pressé, patientez 20 à 30 minutes.',
          barWidth: 'w-full'
        };
      case 'moyen':
        return {
          color: 'bg-amber-500',
          textColor: 'text-amber-950',
          badgeBg: 'bg-[#FEF3C7] text-amber-950 border-amber-200',
          title: 'Affluence Modérée',
          waitTime: 'Attente estimée : 10 à 15 minutes',
          description: 'File normale qui avance de façon régulière vers les guichets.',
          barWidth: 'w-2/3'
        };
      case 'fluide':
      default:
        return {
          color: 'bg-emerald-500',
          textColor: 'text-emerald-950',
          badgeBg: 'bg-[#DCFCE7] text-emerald-950 border-emerald-200',
          title: 'Queue Fluide & Rapide',
          waitTime: 'Attente estimée : Moins de 5 minutes',
          description: 'Accès quasi-immédiat aux plateaux ! C\'est le moment idéal pour manger.',
          barWidth: 'w-1/3'
        };
    }
  };

  const config = getLevelConfig();

  return (
    <div className="bg-white rounded-[26px] p-4 sm:p-5 border border-black/5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full bg-[#FEF3C7] flex items-center justify-center text-xl shrink-0 font-bold border border-amber-200/50">
            👥
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-black text-slate-950 text-sm tracking-tight">
                Affluence en Direct (Waze UPGC)
              </h3>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#18181B] text-white">
                Live
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Signalé en temps réel par les étudiants sur place
            </p>
          </div>
        </div>

        {/* Live status badge */}
        <span className={`px-3 py-1 rounded-full text-xs font-black border flex items-center gap-1.5 ${config.badgeBg}`}>
          <span className={`w-2 h-2 rounded-full ${config.color} animate-pulse`}></span>
          <span>{level === 'fluide' ? 'Fluide' : level === 'moyen' ? 'Moyenne' : 'Forte'}</span>
        </span>
      </div>

      {/* Main Status Gauge Card */}
      <div className="bg-[#F5F0E8] p-3.5 sm:p-4 rounded-[22px] border border-black/5 space-y-2">
        <div className="flex items-center justify-between text-xs font-black text-slate-950">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#F5B726]" />
            <span>{config.title}</span>
          </span>
          <span className="text-slate-600 font-bold text-[11px]">
            {config.waitTime}
          </span>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full bg-slate-200/80 h-2.5 rounded-full overflow-hidden flex">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              level === 'fluide' ? 'bg-emerald-500 w-1/3' : level === 'moyen' ? 'bg-amber-500 w-2/3' : 'bg-rose-500 w-full'
            }`}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium pt-0.5">
          <span>{config.description}</span>
          <span className="text-slate-400 font-bold shrink-0 ml-2">
            {totalVotes} vote(s) récent(s)
          </span>
        </div>
      </div>

      {/* Voting Bar: Students can report crowd in 1 tap */}
      <div className="space-y-2 pt-1 border-t border-slate-100">
        <div className="flex items-center justify-between text-xs">
          <span className="font-extrabold text-slate-900 flex items-center gap-1">
            <span>📍 Tu es à la cantine ?</span>
            <span className="text-slate-500 font-medium">Signale la file en 1 clic :</span>
          </span>
          {isVoting && <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleVote('fluide')}
            disabled={isVoting}
            className="py-2.5 px-2 rounded-full bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-emerald-950 text-xs font-black border border-emerald-200/60 transition-all flex flex-col items-center gap-0.5"
          >
            <span>🟢 Fluide</span>
            <span className="text-[10px] font-semibold text-emerald-700">&lt; 5 min</span>
          </button>

          <button
            onClick={() => handleVote('moyen')}
            disabled={isVoting}
            className="py-2.5 px-2 rounded-full bg-amber-50 hover:bg-amber-100 active:scale-95 text-amber-950 text-xs font-black border border-amber-200/60 transition-all flex flex-col items-center gap-0.5"
          >
            <span>🟡 Moyen</span>
            <span className="text-[10px] font-semibold text-amber-700">10-15 min</span>
          </button>

          <button
            onClick={() => handleVote('fort')}
            disabled={isVoting}
            className="py-2.5 px-2 rounded-full bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-950 text-xs font-black border border-rose-200/60 transition-all flex flex-col items-center gap-0.5"
          >
            <span>🔴 Grosse queue</span>
            <span className="text-[10px] font-semibold text-rose-700">&gt; 20 min</span>
          </button>
        </div>

        {voteFeedback && (
          <div className="p-2.5 rounded-2xl bg-[#DCFCE7] text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-150">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" />
            <span>{voteFeedback}</span>
          </div>
        )}
      </div>
    </div>
  );
};
