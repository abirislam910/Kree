const router = require('express').Router();
const upload = require('../../core/upload.js');

const { collectionAddController, collectionDeleteController, collectionGetController } = require('./controller.js');

router.post('/', upload.fields([{ name: 'imageData', maxCount: 1 }, { name: 'audioData', maxCount: 1 }]), collectionAddController);

router.get('/', collectionGetController);

router.delete('/:id', collectionDeleteController);

module.exports = router;