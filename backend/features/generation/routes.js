const router = require('express').Router();
const { generateImageController, generateMusicController } = require('./controller.js');

router.post('/image', generateImageController);
router.post('/music', generateMusicController);

module.exports = router;