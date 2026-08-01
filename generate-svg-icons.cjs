const sharp = require('sharp');
const fs = require('fs');

const svgCode = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="512" height="512">
  <rect width="100" height="100" fill="#0a0608"/>
  <polygon points="50,20 80,42 50,85 20,42" fill="#c9a84c"/>
  <polygon points="50,20 65,42 50,37 35,42" fill="#fff8e7"/>
</svg>`;

async function generateIcons() {
  const svgBuffer = Buffer.from(svgCode);

  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile('public/pwa-192x192.png');

  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile('public/pwa-512x512.png');

  console.log('Icons regenerated from SVG successfully.');
}

generateIcons().catch(console.error);
