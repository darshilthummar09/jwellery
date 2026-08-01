const sharp = require('sharp');
const fs = require('fs');

async function generateFixedIcons() {
  const original = 'public/logo.png';
  
  // Extract just the geometric part before the gap (width 900 will safely include it without hitting the text at 961)
  const geometricPart = await sharp(original)
    .extract({ left: 0, top: 0, width: 900, height: 762 })
    .trim({ threshold: 10 }) // trim the white space so the logo is perfectly tight
    .toBuffer();

  // Now create the square icons with this perfectly cropped logo
  
  // 192x192
  await sharp(geometricPart)
    .resize({ 
      width: 170, // leave a tiny bit of padding in the 192 square
      height: 170, 
      fit: 'contain',
      background: {r: 255, g: 255, b: 255, alpha: 1}
    })
    .extend({
      top: 11, bottom: 11, left: 11, right: 11,
      background: {r: 255, g: 255, b: 255, alpha: 1}
    })
    .toFile('public/pwa-192x192-v3.png');

  // 512x512
  await sharp(geometricPart)
    .resize({ 
      width: 450, // leave padding
      height: 450, 
      fit: 'contain',
      background: {r: 255, g: 255, b: 255, alpha: 1}
    })
    .extend({
      top: 31, bottom: 31, left: 31, right: 31,
      background: {r: 255, g: 255, b: 255, alpha: 1}
    })
    .toFile('public/pwa-512x512-v3.png');

  console.log('Fixed icons generated!');
}

generateFixedIcons().catch(console.error);
