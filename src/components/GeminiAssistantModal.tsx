import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  Send, 
  Bot, 
  User, 
  Utensils, 
  Clock, 
  ShieldCheck, 
  RefreshCw,
  Lightbulb
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
  dishes: Dish[];
  studentName?: string;
}

export const GeminiAssistantModal: React.FC<Props> = ({
  isOpen,
  onClose,
  dishes,
  studentName
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `Bonjour ${studentName || 'cher étudiant'} ! 👋 Je suis l'Assistant IA Gemini de **Programas** (Resto U CROU Korhogo).\n\nJe peux t'aider avec :\n- Le menu du jour et les recommandations de plats 🍲\n- L'achat et l'utilisation de tes tickets repas à 200 FCFA 🎫\n- Les horaires et le fonctionnement des bornes tourniquets ⏰\n\nQue puis-je faire pour toi aujourd'hui ?`,
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

  // Build real-time menu context for Gemini
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

      const aiReply = await sendGeminiChatMessage(trimmed, historyPayload, menuContext);

      setMessages(prev => [
        ...prev,
        {
          id: 'gemini_' + Date.now(),
          role: 'model',
          text: aiReply || "Je suis à votre écoute ! Que souhaitez-vous savoir sur les repas du CROU Korhogo ?",
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err: any) {
      console.error('Gemini chat error:', err);
      setMessages(prev => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          role: 'model',
          text: "Bonjour ! Le ticket restaurant est à 200 FCFA. Les services sont de 11h30 à 14h30 (déjeuner) et de 18h30 à 21h00 (dîner). Comment puis-je vous aider ?",
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
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                  Assistant IA Gemini
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-200 dark:border-orange-800/40 uppercase">
                  Programas Flash
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                CROU Korhogo • Réponses instantanées
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Suggestion Chips */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 overflow-x-auto scrollbar-none flex gap-2">
          <button
            type="button"
            onClick={() => handleSuggestionClick("Qu'y a-t-il au menu aujourd'hui au Resto U ?")}
            className="whitespace-nowrap px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:border-orange-500 transition-colors shadow-2xs"
          >
            🍲 Menu du jour
          </button>
          <button
            type="button"
            onClick={() => handleSuggestionClick("Comment acheter mon ticket et payer avec Wave ?")}
            className="whitespace-nowrap px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:border-orange-500 transition-colors shadow-2xs"
          >
            🎫 Acheter un ticket
          </button>
          <button
            type="button"
            onClick={() => handleSuggestionClick("Quels sont les horaires du déjeuner et du dîner ?")}
            className="whitespace-nowrap px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:border-orange-500 transition-colors shadow-2xs"
          >
            ⏰ Horaires CROU
          </button>
          <button
            type="button"
            onClick={() => handleSuggestionClick("Comment fonctionne le code de verrouillage PIN à 4 chiffres ?")}
            className="whitespace-nowrap px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:border-orange-500 transition-colors shadow-2xs"
          >
            🔒 Code PIN
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
                    : 'bg-gradient-to-tr from-orange-500 to-amber-500 text-white shadow-xs'
                }`}
              >
                {m.role === 'user' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Sparkles className="w-4 h-4" />
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
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-none px-4 py-3 text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-500" />
                <span>Gemini réfléchit...</span>
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
            placeholder="Pose ta question à Gemini..."
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
