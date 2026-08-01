const sharp = require('sharp');

async function analyzeLogo() {
  const image = sharp('public/logo.png');
  const metadata = await image.metadata();
  console.log(`Original: ${metadata.width}x${metadata.height}`);
  
  // Let's crop the first 1000 pixels to investigate
  const leftPart = image.clone().extract({ left: 0, top: 0, width: 1000, height: metadata.height });
  
  // Let's find columns of white space. We can do this by getting raw pixel data.
  const raw = await leftPart.raw().toBuffer();
  
  // A column is white if all pixels in the column are white.
  // We're looking for the gap between the logo and the text "Dream"
  let gapStart = -1;
  let gapEnd = -1;
  let inLogo = false;
  
  for (let x = 0; x < 1000; x++) {
    let isWhiteColumn = true;
    for (let y = 0; y < metadata.height; y++) {
      const idx = (y * 1000 + x) * (metadata.channels || 4); // assuming 4 channels
      const r = raw[idx];
      const g = raw[idx+1];
      const b = raw[idx+2];
      const a = metadata.channels === 4 ? raw[idx+3] : 255;
      
      // If it's not white (or transparent)
      if (!(r > 240 && g > 240 && b > 240) && a > 10) {
        isWhiteColumn = false;
        break;
      }
    }
    
    if (!isWhiteColumn) {
      if (!inLogo) inLogo = true;
      if (gapStart !== -1 && gapEnd === -1) {
        gapEnd = x;
        console.log(`Found gap from x=${gapStart} to x=${gapEnd}`);
        break;
      }
    } else {
      if (inLogo && gapStart === -1) {
        gapStart = x;
      }
    }
  }
  
  console.log(`Gap starts at ${gapStart}, ends at ${gapEnd}`);
}

analyzeLogo().catch(console.error);
