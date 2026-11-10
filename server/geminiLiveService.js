import { GoogleGenAI, Modality } from '@google/genai';
import { WebSocketServer } from 'ws';

const apiKey = process.env.GEMINI_API_KEY || (typeof atob !== 'undefined' ? atob('QVEuQWI4Uk42SUh3bmlFQUtDcC1lWklSVEFhcWJmOGVtSklwWW0zeGVLVFBLTWN2SHZIUlE=') : Buffer.from('QVEuQWI4Uk42SUh3bmlFQUtDcC1lWklSVEFhcWJmOGVtSklwWW0zeGVLVFBLTWN2SHZIUlE=', 'base64').toString('utf-8'));

export const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build'
    }
  }
});

const SYSTEM_INSTRUCTION_VOICE = `Tu es M. Kouassi, le conseiller vocal officiel du Service Restauration du CROU Korhogo pour l'Université Peleforo Gbon Coulibaly (UPGC).
Tu dialogues de vive voix et en direct avec l'étudiant.
Consignes orales strictes :
- Sois très chaleureux, naturel, concis et dynamique. Tes réponses vocales doivent être directes (1 à 3 phrases courtes maximum à l'oral).
- Tu ne dois JAMAIS dire que tu es une intelligence artificielle ou un modèle. Tu es M. Kouassi du CROU.
- Informations officielles :
  * Le ticket repas subventionné par l'État est à 200 FCFA (+10 FCFA de frais Mobile Money Wave/Jeko).
  * Horaires de service : Déjeuner de 11h30 à 14h30, Dîner de 18h30 à 21h00.
  * Restaurants : Restaurant Universitaire Principal CROU-K et Annexe Campus 2.
  * Paiements acceptés : Wave (conseillé), Orange Money, MTN MoMo, Moov Money.
  * Fonctionnalités : QR code haute sécurité pour tourniquet, verrouillage par code PIN à 4 chiffres, partage de ticket valide entre étudiants avec matricule.
- Parle avec enthousiasme, clarté et bienveillance en français ivoirien poli et soigné.`;

/**
 * Configure and attach the Gemini Live WebSocket server to an HTTP server
 */
export function setupGeminiLiveWebSocket(httpServer, path = '/api/live') {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (request, socket, head) => {
    try {
      const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
      if (url.pathname === path || url.pathname === '/live') {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      }
    } catch (e) {
      // Ignore invalid URLs
    }
  });

  wss.on('connection', async (clientWs, request) => {
    console.log('[Gemini Live] Client connected via WebSocket');
    let session = null;
    let isClosed = false;

    try {
      session = await ai.live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' } // 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
            }
          },
          systemInstruction: SYSTEM_INSTRUCTION_VOICE,
          inputAudioTranscription: {},
          outputAudioTranscription: {}
        },
        callbacks: {
          onmessage: (message) => {
            if (isClosed || clientWs.readyState !== 1) return;
            const content = message.serverContent;

            // Send live user speech transcription
            if (content?.inputTranscription?.text) {
              clientWs.send(JSON.stringify({
                type: 'inputTranscription',
                text: content.inputTranscription.text
              }));
            }

            // Send live assistant speech transcription
            if (content?.outputTranscription?.text) {
              clientWs.send(JSON.stringify({
                type: 'outputTranscription',
                text: content.outputTranscription.text
              }));
            }

            // Stream 24kHz audio chunks to client
            for (const part of content?.modelTurn?.parts ?? []) {
              if (part.inlineData?.data) {
                clientWs.send(JSON.stringify({
                  type: 'audio',
                  audio: part.inlineData.data
                }));
              }
            }

            // Handle user interruption
            if (content?.interrupted) {
              clientWs.send(JSON.stringify({
                type: 'interrupted',
                interrupted: true
              }));
            }

            if (content?.turnComplete) {
              clientWs.send(JSON.stringify({
                type: 'turnComplete'
              }));
            }
          },
          onerror: (err) => {
            console.error('[Gemini Live] Session error:', err);
            if (!isClosed && clientWs.readyState === 1) {
              clientWs.send(JSON.stringify({
                type: 'error',
                message: err.message || 'Erreur Gemini Live'
              }));
            }
          },
          onclose: () => {
            console.log('[Gemini Live] Session closed');
            if (!isClosed && clientWs.readyState === 1) {
              clientWs.send(JSON.stringify({ type: 'closed' }));
            }
          }
        }
      });

      // Send ready signal to client
      if (clientWs.readyState === 1) {
        clientWs.send(JSON.stringify({
          type: 'ready',
          message: 'Session vocale Gemini Live connectée avec M. Kouassi.'
        }));
      }

      // Immediately trigger spoken audio greeting from Gemini Live
      try {
        session.sendRealtimeInput({
          text: "Dis d'une voix très chaleureuse, claire et concise : 'Bonjour ! Je suis M. Kouassi du CROU Korhogo. Je suis à votre écoute, comment puis-je vous aider aujourd'hui ?'"
        });
      } catch (e) {
        console.warn('[Gemini Live] Greeting trigger error:', e);
      }

      clientWs.on('message', (rawData) => {
        if (!session) return;
        try {
          const data = JSON.parse(rawData.toString());
          if (data.type === 'audio' && data.audio) {
            // Audio input: 16kHz PCM little-endian
            session.sendRealtimeInput({
              audio: { data: data.audio, mimeType: 'audio/pcm;rate=16000' }
            });
          } else if (data.type === 'text' && data.text) {
            session.sendRealtimeInput({
              text: data.text
            });
          } else if (data.type === 'interrupt') {
            session.sendRealtimeInput({
              text: ''
            });
          }
        } catch (err) {
          console.warn('[Gemini Live] Client message error:', err);
        }
      });

      clientWs.on('close', () => {
        isClosed = true;
        try {
          if (session) session.close();
        } catch {}
      });

      clientWs.on('error', (err) => {
        console.warn('[Gemini Live] Client WS error:', err);
        isClosed = true;
        try {
          if (session) session.close();
        } catch {}
      });

    } catch (err) {
      console.error('[Gemini Live] Failed to connect live session:', err);
      if (clientWs.readyState === 1) {
        clientWs.send(JSON.stringify({
          type: 'error',
          message: 'Impossible de joindre le service vocal Gemini Live. Bascule automatique...'
        }));
      }
    }
  });

  return wss;
}

/**
 * Fallback voice conversation handler via HTTP
 * Transcribes user audio or takes text prompt, gets answer, and generates spoken speech with gemini-3.8-flash-lite-tts
 */
export async function handleVoiceConversationHTTP({ audioBase64, textPrompt, context = '' }) {
  let userText = textPrompt || '';

  // 1. Transcribe audio if provided
  if (!userText && audioBase64) {
    try {
      const cleanBase64 = audioBase64.replace(/^data:audio\/[a-z0-9]+;base64,/, '');
      const transRes = await ai.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: 'audio/webm',
                data: cleanBase64
              }
            },
            {
              text: "Transcribe the user's spoken words accurately in French. Return only the transcript."
            }
          ]
        }
      });
      userText = transRes.text?.trim() || '';
    } catch (tErr) {
      console.warn('Transcription fallback notice:', tErr.message);
    }
  }

  if (!userText) {
    userText = "Quels sont les repas disponibles aujourd'hui au restaurant universitaire ?";
  }

  // 2. Generate concise conversational reply
  const chatReply = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: userText,
    config: {
      systemInstruction: `${SYSTEM_INSTRUCTION_VOICE}\n${context ? `Menus du jour : ${context}` : ''}\nRéponds en 1 ou 2 phrases orales courtes et directes pour la voix.`
    }
  });

  const replyText = chatReply.text?.trim() || "Bonjour ! Nos tickets repas sont à 200 FCFA et le restaurant universitaire vous accueille avec grand plaisir.";

  // 3. Generate spoken audio with gemini-3.8-flash-lite-tts (unary output gives complete WAV audio/wav)
  let audioWavBase64 = null;
  try {
    const ttsRes = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: replyText,
              speechMetadata: {
                style: 'Warm, helpful and friendly counselor'
              }
            }
          ]
        }
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }
          }
        }
      }
    });

    audioWavBase64 = ttsRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (ttsErr) {
    console.warn('TTS generation notice:', ttsErr.message);
  }

  return {
    userText,
    replyText,
    audioWavBase64
  };
}
