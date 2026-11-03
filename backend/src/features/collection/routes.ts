import { Router } from 'express';
import upload from '../../core/upload.js';
import { collectionAddController, collectionDeleteController, collectionGetController } from './controller.js';

const router = Router();

router.post('/', upload.fields([{ name: 'imageData', maxCount: 1 }, { name: 'audioData', maxCount: 1 }]), collectionAddController);

router.get('/', collectionGetController);

router.delete('/:id', collectionDeleteController);

export default router;
