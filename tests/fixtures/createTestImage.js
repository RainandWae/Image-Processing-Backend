const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const createTestImage = async () => {
  const fixtureDir = path.join(__dirname);
  const imagePath = path.join(fixtureDir, 'test-image.jpg');

  if (!fs.existsSync(imagePath)) {
    await sharp({
      create: {
        width: 400,
        height: 300,
        channels: 3,
        background: {
          r: 120,
          g: 80,
          b: 200,
        },
      },
    })
      .jpeg()
      .toFile(imagePath);
  }

  return imagePath;
};

module.exports = createTestImage;