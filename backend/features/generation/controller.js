const { generateImage, generateMusic } = require('./service.js');

async function generateImageController (req, res, next) {
    const { prompt } = req.body;
    try {
      const imageData = await generateImage(prompt);
      res.set('Content-Type', 'image/png');
      res.send(imageData);
    } catch (error) {
      return next(error);
    }
};

async function generateMusicController (req, res, next) {
    const { prompt } = req.body;
    try {
      const musicData = await generateMusic(prompt);
      res.set('Content-Type', 'audio/mpeg');
      res.send(musicData);
    } catch (error) {
      return next(error);
    }
};

module.exports = {
    generateImageController,
    generateMusicController,
}