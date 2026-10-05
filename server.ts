import express from 'express';
import type { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  getRestaurantData,
  saveRestaurantData,
  resetToDefaults,
} from './server/db.ts';
import {
  getAdminStatus,
  setupInitialAdmin,
  loginAdmin,
  verifySessionToken,
  updateAdminCredentials,
} from './server/auth.ts';
import { parseMenuImageWithGemini } from './server/gemini.ts';
import type { RestaurantData, ServiceMenu } from './src/types.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const app = express();

// Enable high payload limit for mobile menu photos (JPEG/PNG camera captures)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper to check admin authorization via secure session token
function isAuthorized(req: Request): boolean {
  const authHeader = req.headers.authorization;
  return verifySessionToken(authHeader);
}

// ------------------- API ROUTES -------------------

// 1. GET /api/menu - Public: fetch restaurant info, hours, pricing, and current menu
app.get('/api/menu', (req: Request, res: Response) => {
  try {
    const data = getRestaurantData();
    res.json(data);
  } catch (error) {
    console.error('Error fetching menu:', error);
    res.status(500).json({ error: 'Impossible de récupérer le menu' });
  }
});

// 2. Authentication endpoints
// GET /api/auth/status - Check if an admin account is initialized
app.get('/api/auth/status', (req: Request, res: Response) => {
  try {
    const status = getAdminStatus();
    res.json(status);
  } catch (error) {
    console.error('Auth status error:', error);
    res.status(500).json({ error: 'Erreur statut authentification' });
  }
});

// POST /api/auth/setup - First-time personalized account initialization
app.post('/api/auth/setup', (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const result = setupInitialAdmin(username, password);
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }
    return res.json({
      success: true,
      token: result.token,
      username: username.trim(),
      message: 'Compte gestionnaire configuré avec succès !',
    });
  } catch (error) {
    console.error('Setup error:', error);
    return res.status(500).json({ error: 'Erreur lors de la configuration du compte' });
  }
});

// POST /api/auth/login - Admin login with personalized Pseudo and Password
app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Veuillez saisir votre pseudo et votre mot de passe.',
      });
    }

    const result = loginAdmin(username, password);
    if (!result.success) {
      return res.status(401).json({
        success: false,
        error: result.error,
      });
    }

    return res.json({
      success: true,
      token: result.token,
      username: result.username,
      message: 'Connexion gestionnaire réussie',
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Erreur lors de la tentative de connexion' });
  }
});

// POST /api/auth/update-credentials - Change pseudo or password
app.post('/api/auth/update-credentials', (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || '';
    const { oldPassword, newUsername, newPassword } = req.body;

    if (!oldPassword) {
      return res.status(400).json({ success: false, error: 'L\'ancien mot de passe est obligatoire pour confirmer la modification.' });
    }

    const result = updateAdminCredentials(token, oldPassword, newUsername, newPassword);
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    return res.json({
      success: true,
      username: result.username,
      message: 'Identifiants mis à jour avec succès.',
    });
  } catch (error) {
    console.error('Update credentials error:', error);
    return res.status(500).json({ error: 'Erreur lors de la mise à jour des identifiants' });
  }
});

// 3. POST /api/menu - Admin: update the current menu (items, date, service, theme)
app.post('/api/menu', (req: Request, res: Response) => {
  try {
    if (!isAuthorized(req)) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    const { menu } = req.body as { menu: ServiceMenu };
    if (!menu || !Array.isArray(menu.items)) {
      return res.status(400).json({ error: 'Données de menu invalides' });
    }

    const currentData = getRestaurantData();
    currentData.currentMenu = menu;
    saveRestaurantData(currentData);

    return res.json({
      success: true,
      message: 'Menu mis à jour avec succès',
      data: currentData,
    });
  } catch (error) {
    console.error('Error updating menu:', error);
    return res.status(500).json({ error: 'Erreur lors de la mise à jour du menu' });
  }
});

// 4. POST /api/info - Admin: update hours, announcement, pricing, crowd level
app.post('/api/info', (req: Request, res: Response) => {
  try {
    if (!isAuthorized(req)) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    const { announcement, hours, pricing, name, campus } = req.body;
    const currentData = getRestaurantData();

    if (announcement !== undefined) currentData.announcement = announcement;
    if (hours) currentData.hours = { ...currentData.hours, ...hours };
    if (pricing) currentData.pricing = { ...currentData.pricing, ...pricing };
    if (name) currentData.name = name;
    if (campus) currentData.campus = campus;

    saveRestaurantData(currentData);
    return res.json({
      success: true,
      message: 'Informations du restaurant mises à jour',
      data: currentData,
    });
  } catch (error) {
    console.error('Error updating restaurant info:', error);
    return res.status(500).json({ error: 'Erreur lors de la mise à jour des informations' });
  }
});

// 5. POST /api/menu/scan - Admin: OCR extraction of menu picture via Gemini 3.8 Flash
app.post('/api/menu/scan', async (req: Request, res: Response) => {
  try {
    if (!isAuthorized(req)) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "Aucune image n'a été fournie pour l'analyse" });
    }

    const extraction = await parseMenuImageWithGemini(imageBase64, mimeType || 'image/jpeg');
    return res.json({
      success: true,
      data: extraction,
    });
  } catch (error: any) {
    console.error('OCR analysis error:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || "Erreur lors de l'analyse IA de l'image du menu",
    });
  }
});

// 6. POST /api/menu/reset - Admin: reset data to default demo menu
app.post('/api/menu/reset', (req: Request, res: Response) => {
  try {
    if (!isAuthorized(req)) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    const freshData = resetToDefaults();
    return res.json({
      success: true,
      message: 'Menu réinitialisé avec les données par défaut du CROU',
      data: freshData,
    });
  } catch (error) {
    console.error('Reset error:', error);
    return res.status(500).json({ error: 'Erreur de réinitialisation' });
  }
});

// ------------------- VITE / STATIC SERVING -------------------
async function startServer() {
  if (!isProd) {
    // Development mode: attach Vite middlewares
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: serve built static files
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CROU Resto U] Serveur opérationnel sur http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
