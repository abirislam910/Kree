import { Router } from 'express';
import { generateImageController, generateMusicController } from './controller.js';

const router = Router();

router.post('/image', generateImageController);
router.post('/music', generateMusicController);

export default router;
