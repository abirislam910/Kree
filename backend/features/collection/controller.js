const { collectionAdd, collectionDelete, collectionGet } = require('./service.js')
const { validateCollectionUpload } = require('./validators.js');
const { createClient } = require("../../core/supabase.js");

async function collectionAddController (req, res, next) {
    try {
      const { imageData, audioData, location } = validateCollectionUpload(req);
      const supabase = createClient({ req, res });
      await collectionAdd(supabase, imageData, audioData, location);
      res.sendStatus(200);
    } catch (error) {
      return next(error);
    }
};

async function collectionGetController (req, res, next) { 
    const supabase = createClient({ req, res });
    try {
      const collection = await collectionGet(supabase);
      res.json({ collection: collection });
    } catch (error) {
      return next(error);
     }
};

async function collectionDeleteController (req, res, next) { 
    const contentId = req.params.id;
    const supabase = createClient({ req, res });
    try {
      await collectionDelete(supabase, contentId);
      res.sendStatus(200);
    } catch (error) {
      return next(error);
     }
};

module.exports = {
    collectionAddController,
    collectionGetController,
    collectionDeleteController
};