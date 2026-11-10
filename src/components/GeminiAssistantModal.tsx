import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Send, 
  User, 
  Headphones,
  RefreshCw,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { Dish } from '../types';
import { sendGeminiChatMessage } from '../services/geminiClient';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  time: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenVoice?: () => void;
  dishes: Dish[];
  studentName?: string;
}

export const GeminiAssistantModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onOpenVoice,
  dishes,
  studentName
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `Bonjour ${studentName || 'cher étudiant'} ! 👋 Je suis **M. Kouassi**, votre conseiller d'assistance au Service Restauration du CROU Korhogo (UPGC).\n\nJe suis à votre entière disposition pour vous guider en direct :\n- Le menu du jour et les plats préparés 🍲\n- L'achat et la validation de vos tickets repas à 200 FCFA 🎫\n- Les horaires de service midi & soir et les bornes tourniquets ⏰\n- La protection de votre compte étudiant et code PIN 🔒\n\nQue puis-je faire pour vous aujourd'hui ?`,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
    }
  }, [isOpen, messages]);

  if (!isOpen) return null;

  // Build real-time menu context
  const menuContext = dishes
    .filter(d => d.isAvailable)
    .map(d => `${d.name} (${d.category}, ${d.mealType}, ${d.price} FCFA)`)
    .join(', ');

  const handleSend = async (userText: string = input) => {
    const trimmed = userText.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = {
      id: 'msg_' + Date.now(),
      role: 'user',
      text: trimmed,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const historyPayload = messages.slice(-6).map(m => ({
        role: m.role,
        text: m.text
      }));

      const reply = await sendGeminiChatMessage(trimmed, historyPayload, menuContext);

      setMessages(prev => [
        ...prev,
        {
          id: 'reply_' + Date.now(),
          role: 'model',
          text: reply || "Je suis bien à votre écoute ! Que souhaitez-vous savoir concernant les repas ou les tickets du CROU Korhogo ?",
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setMessages(prev => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          role: 'model',
          text: "Bonjour cher étudiant ! Je suis à votre service. Le ticket de repas est à 200 FCFA et nos restaurants universitaires vous accueillent de 11h30 à 14h30 pour le midi et de 18h30 à 21h00 pour le soir. Comment puis-je vous aider ?",
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (text: string) => {
    handleSend(text);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-[32px] sm:rounded-3xl shadow-2xl flex flex-col h-[85vh] sm:h-[650px] border border-slate-200 dark:border-slate-800 overflow-hidden"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' }}
      >
        
        {/* Header - Humanized Student Support Desk */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 text-white flex items-center justify-center shadow-md shadow-orange-500/25">
                <Headphones className="w-5 h-5 text-white" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full flex items-center justify-center">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                  Conseiller CROU Korhogo
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  En direct
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Service Restauration • UPGC Korhogo
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center transition-all active:scale-95 shadow-md cursor-pointer flex-shrink-0"
            aria-label="Fermer l'assistance"
            title="Fermer"
          >
            <X className="w-5 h-5 text-white stroke-[2.5]" />
          </button>
        </div>

        {/* Suggestion & Live Voice Bar */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 overflow-x-auto scrollbar-none flex gap-2 items-center">
          {onOpenVoice && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenVoice();
              }}
              className="whitespace-nowrap px-3.5 py-1.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-[11px] font-bold shadow-md shadow-orange-500/20 flex items-center gap-1.5 transition-all active:scale-95 flex-shrink-0 cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span>🎙️ Parler de vive voix (Live)</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => handleSuggestionClick("Qu'y a-t-il au menu aujourd'hui au Resto U ?")}
            className="whitespace-nowrap px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:border-orange-500 transition-colors shadow-2xs"
          >
            🍲 Menu du jour
          </button>
          <button
            type="button"
            onClick={() => handleSuggestionClick("Comment acheter mon ticket et payer avec Wave ?")}
            className="whitespace-nowrap px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:border-orange-500 transition-colors shadow-2xs"
          >
            🎫 Acheter un ticket
          </button>
          <button
            type="button"
            onClick={() => handleSuggestionClick("Quels sont les horaires du déjeuner et du dîner ?")}
            className="whitespace-nowrap px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:border-orange-500 transition-colors shadow-2xs"
          >
            ⏰ Horaires CROU
          </button>
          <button
            type="button"
            onClick={() => handleSuggestionClick("Comment fonctionne la sécurité du compte et le code PIN ?")}
            className="whitespace-nowrap px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:border-orange-500 transition-colors shadow-2xs"
          >
            🔒 Sécurité & PIN
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50 dark:bg-slate-950/20">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-2.5 ${
                m.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                  m.role === 'user'
                    ? 'bg-slate-900 text-white dark:bg-slate-700'
                    : 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-xs'
                }`}
              >
                {m.role === 'user' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Headphones className="w-4 h-4" />
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[82%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-xs ${
                  m.role === 'user'
                    ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-tr-none'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 rounded-tl-none whitespace-pre-wrap'
                }`}
              >
                {m.role === 'model' && (
                  <div className="text-[10px] font-bold text-orange-600 dark:text-orange-400 mb-1 flex items-center gap-1">
                    <span>M. Kouassi (Conseiller CROU)</span>
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  </div>
                )}
                {m.text}
                <div
                  className={`text-[9px] mt-1 text-right ${
                    m.role === 'user'
                      ? 'text-orange-200'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {m.time}
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <Headphones className="w-4 h-4" />
              </div>
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-none px-4 py-3 text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-500" />
                <span>Le conseiller vous répond...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Input Field */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Écrivez votre message à notre conseiller..."
            disabled={isLoading}
            className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 text-white flex items-center justify-center transition-all shadow-md shadow-orange-500/20 active:scale-95 cursor-pointer flex-shrink-0"
            title="Envoyer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
