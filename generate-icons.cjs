const sharp = require('sharp');

async function generateIcons() {
  const logoPath = 'public/logo.png';
  
  // 192x192 icon with white background
  await sharp({
    create: {
      width: 192,
      height: 192,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
  .composite([{
    input: await sharp(logoPath).resize({ width: 160, fit: 'contain' }).toBuffer(),
    gravity: 'center'
  }])
  .png()
  .toFile('public/pwa-192x192.png');

  // 512x512 icon with white background
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
  .composite([{
    input: await sharp(logoPath).resize({ width: 460, fit: 'contain' }).toBuffer(),
    gravity: 'center'
  }])
  .png()
  .toFile('public/pwa-512x512.png');

  console.log('Icons generated successfully.');
}

generateIcons().catch(console.error);
