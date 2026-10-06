import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '..', 'public');
const iconSvgPath = path.join(publicDir, 'icon.svg');

// 1200x630 OpenGraph & Social Preview Banner SVG
const pochetteSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#18181B"/>
      <stop offset="60%" stop-color="#1F1F23"/>
      <stop offset="100%" stop-color="#09090B"/>
    </linearGradient>
    <linearGradient id="ivoryBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ea580c"/>
      <stop offset="50%" stop-color="#f97316"/>
      <stop offset="100%" stop-color="#15803d"/>
    </linearGradient>
    <linearGradient id="goldAcc" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>
    <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f97316" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#16a34a" stop-opacity="0.15"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-opacity="0.5"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bgGrad)"/>
  
  <!-- Subtle ambient glow circles -->
  <circle cx="280" cy="315" r="320" fill="url(#glow)"/>
  <circle cx="950" cy="180" r="240" fill="#f59e0b" fill-opacity="0.08"/>

  <!-- Top Tricolore Côte d'Ivoire line -->
  <g>
    <rect x="0" y="0" width="400" height="8" fill="#f97316"/>
    <rect x="400" y="0" width="400" height="8" fill="#ffffff"/>
    <rect x="800" y="0" width="400" height="8" fill="#16a34a"/>
  </g>

  <!-- Left: The Official Icon Embedded at 420x420 -->
  <g transform="translate(100, 105)" filter="url(#shadow)">
    <!-- Squircle Background -->
    <rect width="420" height="420" rx="105" fill="url(#ivoryBg)"/>

    <!-- Tricolor Flag inside Icon -->
    <g transform="translate(52, 32)">
      <rect x="0" y="0" width="105" height="8" rx="4" fill="#f97316"/>
      <rect x="105" y="0" width="105" height="8" fill="#ffffff"/>
      <rect x="210" y="0" width="105" height="8" rx="4" fill="#16a34a"/>
    </g>

    <!-- Subtle inner border ring -->
    <rect x="20" y="20" width="380" height="380" rx="88" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-opacity="0.25"/>

    <!-- Cloche Center -->
    <g transform="translate(210, 195)">
      <!-- Plate base -->
      <path d="M-125,70 Q0,95 125,70 L132,90 Q0,115 -132,90 Z" fill="#ffffff" fill-opacity="0.95"/>
      <ellipse cx="0" cy="70" rx="125" ry="13" fill="url(#goldAcc)"/>

      <!-- Cloche dome -->
      <path d="M-102,62 C-102,-45 102,-45 102,62 Z" fill="#ffffff"/>

      <!-- Knob -->
      <circle cx="0" cy="-52" r="16" fill="url(#goldAcc)"/>
      <rect x="-6" y="-40" width="12" height="12" rx="3" fill="url(#goldAcc)"/>

      <!-- Bold "P" -->
      <path d="M-24,-16 L-24,36 L-8,36 L-8,14 L12,14 C30,14 36,4 36,-4 C36,-14 28,-16 12,-16 Z M-8,-4 L10,-4 C16,-4 20,-2 20,4 C20,8 16,10 10,10 L-8,10 Z" fill="#ea580c"/>

      <!-- Fork -->
      <g transform="translate(-135, -5) rotate(-15)">
        <rect x="-2.5" y="8" width="5" height="58" rx="2.5" fill="#ffffff" fill-opacity="0.9"/>
        <path d="M-10,-28 L-10,-8 C-10,4 10,4 10,-8 L10,-28 L6.5,-28 L6.5,-10 C6.5,0 -6.5,0 -6.5,-10 L-6.5,-28 L-3.5,-28 L-3.5,-10 L-1.5,-10 L-1.5,-28 Z" fill="#ffffff" fill-opacity="0.9"/>
      </g>

      <!-- Knife -->
      <g transform="translate(135, -5) rotate(15)">
        <rect x="-2.5" y="8" width="5" height="58" rx="2.5" fill="#ffffff" fill-opacity="0.9"/>
        <path d="M-3.5,-28 Q8,-16 5,8 L-3.5,8 Z" fill="#ffffff" fill-opacity="0.9"/>
      </g>
    </g>

    <!-- PROGRAMAS Banner Badge inside Icon -->
    <g transform="translate(210, 345)">
      <rect x="-90" y="-18" width="180" height="36" rx="18" fill="#ffffff" fill-opacity="0.95"/>
      <text x="0" y="7" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="18" fill="#ea580c" text-anchor="middle" letter-spacing="3">PROGRAMAS</text>
    </g>
    <text x="210" y="374" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="10" fill="#ffffff" text-anchor="middle" opacity="0.95">UPGC KORHOGO • CROU-K</text>
  </g>

  <!-- Right: Descriptive Presentation & Branding -->
  <g transform="translate(580, 150)">
    <!-- Campus Badge -->
    <g>
      <rect x="0" y="0" width="280" height="36" rx="18" fill="#F5B726"/>
      <text x="140" y="23" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="13" fill="#18181B" text-anchor="middle" letter-spacing="1">🇨🇮 RESTO U · CROU-KORHOGO</text>
    </g>

    <!-- Main Title -->
    <text x="0" y="105" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="62" fill="#ffffff" letter-spacing="-1">PROGRAMAS</text>
    
    <!-- Subtitle -->
    <text x="0" y="145" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="22" fill="#F5B726">Restaurant Universitaire · UPGC Korhogo</text>
    
    <text x="0" y="185" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="500" font-size="16" fill="#A1A1AA">Menu du jour, alertes plats favoris &amp; rappels incessants Duolingo.</text>

    <!-- Feature Pills -->
    <g transform="translate(0, 225)">
      <!-- Pill 1: 200 FCFA -->
      <g>
        <rect x="0" y="0" width="165" height="42" rx="21" fill="#27272A" stroke="#3F3F46" stroke-width="1.5"/>
        <text x="82" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="15" fill="#ffffff" text-anchor="middle">🎟️ Tarif 200 FCFA</text>
      </g>
      <!-- Pill 2: Midi & Soir -->
      <g transform="translate(175, 0)">
        <rect x="0" y="0" width="160" height="42" rx="21" fill="#27272A" stroke="#3F3F46" stroke-width="1.5"/>
        <text x="80" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="15" fill="#ffffff" text-anchor="middle">🍽️ Déjeuner &amp; Dîner</text>
      </g>
      <!-- Pill 3: Alertes 11h30 / 14h30 / 18h30 -->
      <g transform="translate(345, 0)">
        <rect x="0" y="0" width="180" height="42" rx="21" fill="#27272A" stroke="#3F3F46" stroke-width="1.5"/>
        <text x="90" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="15" fill="#ffffff" text-anchor="middle">🔔 Alertes Automatiques</text>
      </g>
    </g>

    <!-- Campus footer note -->
    <text x="0" y="320" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="13" fill="#71717A">Centre Régional des Œuvres Universitaires de Korhogo (CROU-K)</text>
  </g>
</svg>
`;

async function generate() {
  let sharp;
  try {
    const mod = await import('sharp');
    sharp = mod.default;
  } catch (e) {
    console.log('Sharp not installed, skipping asset generation (assets are already committed in /public)');
    return;
  }

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const svgBuffer = fs.readFileSync(iconSvgPath);

  // 1. Save Pochette SVG
  const pochetteSvgPath = path.join(publicDir, 'pochette.svg');
  fs.writeFileSync(pochetteSvgPath, pochetteSvg.trim());
  console.log('✓ pochette.svg created');

  // 2. High-Res Pochette PNG 1200x630 (OpenGraph / Publication / Social Cards)
  await sharp(Buffer.from(pochetteSvg))
    .resize(1200, 630)
    .png({ quality: 95 })
    .toFile(path.join(publicDir, 'pochette.png'));
  console.log('✓ pochette.png (1200x630) created');

  // 3. Square Pochette / Cover Image (1024x1024)
  await sharp(svgBuffer)
    .resize(1024, 1024)
    .png({ quality: 95 })
    .toFile(path.join(publicDir, 'pochette-square.png'));
  console.log('✓ pochette-square.png (1024x1024) created');

  // 4. PWA 512x512
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('✓ pwa-512x512.png created');

  // 5. PWA 192x192
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('✓ pwa-192x192.png created');

  // 6. Apple Touch Icon 180x180
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('✓ apple-touch-icon.png created');

  // 7. Maskable 512x512 with safe-zone padding
  const innerSize = Math.round(512 * 0.75); // 384px inside 512px
  const innerBuffer = await sharp(svgBuffer)
    .resize(innerSize, innerSize)
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 234, g: 88, b: 12, alpha: 1 } // #ea580c orange theme
    }
  })
    .composite([{ input: innerBuffer, gravity: 'center' }])
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('✓ pwa-maskable-512x512.png created');

  // 8. Favicon 64x64 & 32x32
  await sharp(svgBuffer)
    .resize(64, 64)
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('✓ favicon.png created');
}

generate().catch(console.error);
