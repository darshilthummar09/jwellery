const sharp = require('sharp');

async function fixCrop() {
  // Crop a wider area to ensure the right side isn't cut off
  // Let's try width 900, height 762
  await sharp('public/logo.png')
    .extract({ left: 0, top: 0, width: 900, height: 762 })
    .toFile('public/test-crop-wide.png');
    
  console.log('Created test-crop-wide.png');
}

fixCrop().catch(console.error);
