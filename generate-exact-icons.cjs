const sharp = require('sharp');
const fs = require('fs');

async function generateIcons() {
  const cropPath = 'public/test-crop.png';
  
  // Create PWA 192x192
  await sharp(cropPath)
    .resize({ width: 192, height: 192, fit: 'contain', background: {r: 255, g: 255, b: 255, alpha: 1} })
    .png()
    .toFile('public/pwa-192x192.png');

  // Create PWA 512x512
  await sharp(cropPath)
    .resize({ width: 512, height: 512, fit: 'contain', background: {r: 255, g: 255, b: 255, alpha: 1} })
    .png()
    .toFile('public/pwa-512x512.png');

  console.log('Icons regenerated from exact geometric logo successfully.');
}

generateIcons().catch(console.error);
