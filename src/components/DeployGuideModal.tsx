import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, Server, Globe, Shield, Terminal } from 'lucide-react';

interface DeployGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeployGuideModal: React.FC<DeployGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'render' | 'vercel' | 'firebase' | 'docker'>('render');
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8 animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-200">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
              Guide Déploiement Gratuit (Render)
            </span>
            <h3 className="text-xl font-black text-slate-900 mt-1.5 flex items-center gap-2">
              Héberger & Mettre en ligne Programas sur Render
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Hébergement 100% gratuit, certificat HTTPS inclus et compatible Full-Stack Node.js.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Platform Tabs */}
        <div className="flex items-center gap-2 mt-5 border-b border-slate-200 overflow-x-auto pb-2">
          {[
            { id: 'render', label: 'Render (Recommandé 100% Gratuit)', icon: '⚡' },
            { id: 'vercel', label: 'Vercel', icon: '▲' },
            { id: 'firebase', label: 'Firebase / Cloud Run', icon: '🔥' },
            { id: 'docker', label: 'Docker / Serveur VPS', icon: '🐳' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mt-5 space-y-4 text-xs text-slate-700 leading-relaxed">
          {activeTab === 'render' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-green-50 border border-green-200 rounded-xl text-green-950 text-xs font-medium">
                ✅ <strong>Pourquoi Render est la solution idéale :</strong> Comme Programas est une application Full-Stack (Backend Express + Frontend Vite + Scan OCR Gemini 3.8 Flash), Render héberge le serveur Node.js gratuitement sans aucune configuration compliquée ! Un fichier <code className="bg-white px-1 py-0.5 rounded border border-green-300 font-bold">render.yaml</code> est déjà inclus dans votre projet.
              </div>

              <div className="space-y-2">
                <h4 className="font-extrabold text-slate-900 text-sm">
                  Étapes pas à pas pour déployer sur Render (render.com) :
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-slate-600 ml-1">
                  <li>
                    Créez un compte gratuit sur <strong>render.com</strong> et reliez votre compte GitHub.
                  </li>
                  <li>
                    Cliquez sur <strong>"New +"</strong> puis <strong>"Web Service"</strong> et sélectionnez votre dépôt.
                  </li>
                  <li>
                    Renseignez les paramètres suivants :
                    <div className="mt-1.5 p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] space-y-1">
                      <div>Runtime: <span className="text-orange-400 font-bold">Node</span></div>
                      <div>Build Command: <span className="text-amber-400 font-bold">npm install && npm run build</span></div>
                      <div>Start Command: <span className="text-green-400 font-bold">npm run start</span></div>
                    </div>
                  </li>
                  <li>
                    Dans la section <strong>"Environment Variables"</strong>, ajoutez vos variables :
                    <div className="mt-1.5 p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] space-y-1">
                      <div>GEMINI_API_KEY = <span className="text-amber-300">Votre clé Google AI Studio</span></div>
                      <div>NODE_ENV = <span className="text-amber-300">production</span></div>
                    </div>
                  </li>
                  <li>
                    Cliquez sur <strong>"Create Web Service"</strong> : votre application est en ligne en ~2 minutes avec son URL sécurisée HTTPS gratuite (ex: <code>programas.onrender.com</code>) !
                  </li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'vercel' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-medium">
                ▲ <strong>Vercel (Frontend + Serverless) :</strong>
                Idéal si vous préférez séparer les fonctions serverless.
              </div>

              <ol className="list-decimal list-inside space-y-2 text-slate-600 ml-1">
                <li>Installez le CLI Vercel ou connectez votre repo sur <strong>vercel.com</strong>.</li>
                <li>Le framework est automatiquement détecté comme <strong>Vite</strong>.</li>
                <li>Définissez la variable d'environnement <code>GEMINI_API_KEY</code> et <code>ADMIN_PASSWORD</code> dans les paramètres du projet.</li>
                <li>Pour les routes <code>/api/*</code>, Vercel utilise le fichier de configuration standard <code>vercel.json</code>.</li>
              </ol>

              <div className="relative">
                <pre className="p-3 bg-slate-900 text-amber-300 rounded-xl font-mono text-[11px] overflow-x-auto">
{`// vercel.json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/server.ts" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}`}
                </pre>
                <button
                  onClick={() => copyToClipboard(`{\n  "rewrites": [\n    { "source": "/api/(.*)", "destination": "/server.ts" },\n    { "source": "/(.*)", "destination": "/index.html" }\n  ]\n}`, 'vercel')}
                  className="absolute top-2 right-2 p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white text-[10px] flex items-center gap-1"
                >
                  {copiedSnippet === 'vercel' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSnippet === 'vercel' ? 'Copié' : 'Copier'}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'firebase' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-medium">
                🔥 <strong>Firebase Hosting & Google Cloud Run :</strong>
                Vous bénéficiez de l'infrastructure Google et de son niveau gratuit permanent (Free Tier Cloud Run : 2 millions de requêtes/mois gratuites).
              </div>

              <ol className="list-decimal list-inside space-y-2 text-slate-600 ml-1">
                <li>Activez un projet Google Cloud / Firebase (console.firebase.google.com).</li>
                <li>Déployez le conteneur Node sur <strong>Cloud Run</strong> en 1 clic via GitHub.</li>
                <li>Liez votre domaine personnalisé gratuitement avec certificat SSL inclus.</li>
              </ol>
            </div>
          )}

          {activeTab === 'docker' && (
            <div className="space-y-4">
              <p>Si vous possédez un VPS (OVH, Hetzner, Scaleway) ou un serveur de l'université :</p>
              <div className="relative">
                <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] overflow-x-auto">
{`# Dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "server.ts"]`}
                </pre>
                <button
                  onClick={() => copyToClipboard(`FROM node:22-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm install\nCOPY . .\nRUN npm run build\nEXPOSE 3000\nCMD ["node", "server.ts"]`, 'docker')}
                  className="absolute top-2 right-2 p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white text-[10px] flex items-center gap-1"
                >
                  {copiedSnippet === 'docker' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSnippet === 'docker' ? 'Copié' : 'Copier'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Besoin d'aide ? Consultez la documentation officielle du CROU Menu.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Fermer le guide
          </button>
        </div>
      </div>
    </div>
  );
};
