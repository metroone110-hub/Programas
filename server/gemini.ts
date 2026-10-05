import { GoogleGenAI, Type } from '@google/genai';
import type { ScanMenuResult, MealCategory, DietaryTag, ServiceType } from '../src/types.ts';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export async function parseMenuImageWithGemini(
  base64Data: string,
  mimeType: string = 'image/jpeg'
): Promise<ScanMenuResult> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("La clé d'API GEMINI_API_KEY n'est pas configurée sur le serveur.");
  }

  // Clean data url prefix if present
  let cleanBase64 = base64Data;
  if (base64Data.includes('base64,')) {
    const parts = base64Data.split('base64,');
    cleanBase64 = parts[1];
    const mimeMatch = parts[0].match(/:(.*?);/);
    if (mimeMatch && mimeMatch[1]) {
      mimeType = mimeMatch[1];
    }
  }

  const promptText = `Tu es un expert en restauration universitaire en Côte d'Ivoire pour le CROU de Korhogo (Université Peleforo Gon Coulibaly - UPGC).
Analyse l'image fournie représentant le tableau de menu du Resto U (ardoise manuscrite à la craie, tableau blanc au marqueur, feuille affichée ou écran).
Effectue une reconnaissance OCR intelligente et structure les plats détectés dans les spécialités ivoiriennes et internationales :

Règles de classification :
- "entree" : salades de crudités, salades composées, avocat, œufs durs, etc.
- "plat" : plats en sauce (sauce graine, sauce gombo, sauce feuille, sauce arachide, sauce claire), kedjenou de poulet ou pintade, ragoûts de viande, poissons braisés, poulet bicyclette, etc.
- "vegetarien" : plats sans viande/poisson, sauces aux légumes, haricots cornille, etc.
- "accompagnement" : attiéké, foutou (banane ou igname), placali, alloco, riz blanc, riz gras/tchep, frites d'igname, etc.
- "dessert" : fruits frais de saison (mangues de Korhogo, ananas, papaye, bananes douces), dêguê, yaourts locaux, etc.

Détecte si possible :
- Les tags alimentaires ("local", "fait_maison", "halal", "sans_porc", "veggie", "bio").
- Les allergènes majeurs (Arachides, Poisson, Crustacés, etc.).
- Les tarifs en FCFA s'ils sont affichés (ex: 100 FCFA, 200 FCFA, 500 FCFA).
- Le service ("dejeuner" pour midi, "diner" pour le soir).
- Toute remarque (menu du jour, rupture de stock).`;

  const imagePart = {
    inlineData: {
      mimeType,
      data: cleanBase64,
    },
  };

  const textPart = {
    text: promptText,
  };

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: {
      parts: [imagePart, textPart],
    },
    config: {
      systemInstruction: 'Tu es un parseur JSON strict pour menu de cantine CROUS. Tu retournes toujours un objet JSON valide correspondant au schéma demandé.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          date: { type: Type.STRING, description: 'Date identifiée ou vide' },
          service: { type: Type.STRING, description: 'dejeuner ou diner' },
          theme: { type: Type.STRING, description: 'Thème ou intitulé du menu' },
          items: {
            type: Type.ARRAY,
            description: 'Plats et éléments du menu',
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: 'Nom du plat' },
                category: {
                  type: Type.STRING,
                  description: 'entree, plat, vegetarien, accompagnement ou dessert',
                },
                description: { type: Type.STRING, description: 'Garniture ou détails' },
                tags: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'veggie, vegan, bio, fait_maison, viande_francaise, local, sans_porc, halal',
                },
                allergens: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Liste des allergènes',
                },
                priceExtra: { type: Type.STRING, description: 'Prix ou supplément' },
              },
              required: ['title', 'category'],
            },
          },
          pricing: {
            type: Type.OBJECT,
            properties: {
              boursier: { type: Type.NUMBER },
              nonBoursier: { type: Type.NUMBER },
              personnel: { type: Type.NUMBER },
            },
          },
          detectedNotes: {
            type: Type.STRING,
            description: 'Notes et mentions manuscrites ou imprimées lues sur le panneau',
          },
        },
        required: ['items'],
      },
    },
  });

  const rawJson = response.text || '{}';
  const parsed = JSON.parse(rawJson);

  // Normalize categories and tags safely
  const validCategories: MealCategory[] = ['entree', 'plat', 'vegetarien', 'accompagnement', 'dessert'];
  const validTags: DietaryTag[] = ['veggie', 'vegan', 'bio', 'fait_maison', 'viande_francaise', 'local', 'sans_porc', 'halal'];

  const normalizedItems = (parsed.items || []).map((item: any) => {
    let category: MealCategory = 'plat';
    if (validCategories.includes(item.category?.toLowerCase())) {
      category = item.category.toLowerCase() as MealCategory;
    }

    const tags: DietaryTag[] = Array.isArray(item.tags)
      ? item.tags
          .map((t: string) => t.toLowerCase())
          .filter((t: string): t is DietaryTag => validTags.includes(t as DietaryTag))
      : [];

    return {
      title: String(item.title || 'Plat non nommé').trim(),
      category,
      description: item.description ? String(item.description).trim() : '',
      tags,
      allergens: Array.isArray(item.allergens) ? item.allergens.map(String) : [],
      priceExtra: item.priceExtra ? String(item.priceExtra) : undefined,
    };
  });

  let service: ServiceType = 'dejeuner';
  if (parsed.service === 'diner' || parsed.service === 'soir') {
    service = 'diner';
  }

  return {
    date: parsed.date || new Date().toISOString().split('T')[0],
    service,
    theme: parsed.theme || 'Menu scanné par IA',
    items: normalizedItems,
    pricing: parsed.pricing,
    detectedNotes: parsed.detectedNotes || '',
  };
}
