const sharp = require('sharp');
const fs = require('fs');

async function generateFixedIcons() {
  const original = 'public/logo.png';
  
  // Extract just the geometric part before the gap (width 900)
  const geometricPart = await sharp(original)
    .extract({ left: 0, top: 0, width: 900, height: 762 })
    .trim({ threshold: 10 })
    .toBuffer();

  // Create perfectly square icons with a forced white background (no transparency)
  
  // 192x192
  await sharp(geometricPart)
    .resize({ 
      width: 150, // leave more padding
      height: 150, 
      fit: 'contain',
      background: {r: 255, g: 255, b: 255, alpha: 1}
    })
    .extend({
      top: 21, bottom: 21, left: 21, right: 21,
      background: {r: 255, g: 255, b: 255, alpha: 1}
    })
    .flatten({ background: {r: 255, g: 255, b: 255} }) // FORCE WHITE BACKGROUND
    .toFile('public/pwa-192x192-v4.png');

  // 512x512
  await sharp(geometricPart)
    .resize({ 
      width: 400, // leave more padding
      height: 400, 
      fit: 'contain',
      background: {r: 255, g: 255, b: 255, alpha: 1}
    })
    .extend({
      top: 56, bottom: 56, left: 56, right: 56,
      background: {r: 255, g: 255, b: 255, alpha: 1}
    })
    .flatten({ background: {r: 255, g: 255, b: 255} }) // FORCE WHITE BACKGROUND
    .toFile('public/pwa-512x512-v4.png');

  console.log('Fixed icons with pure white background generated!');
}

generateFixedIcons().catch(console.error);
