import type { NextFunction, Request, Response } from 'express';
import { collectionAdd, collectionDelete, collectionGet } from './service.js';
import { validateCollectionUpload } from './validators.js';
import { createClient } from '../../core/supabase.js';
import type { CollectionItem } from '../../lib/types.js';

interface CollectionResponseBody {
    collection: CollectionItem[];
}

// A type alias (not an interface) so it satisfies Express's ParamsDictionary.
type CollectionItemParams = {
    id: string;
};

export async function collectionAddController (req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const upload = validateCollectionUpload(req.files, req.body);
      const supabase = createClient({ req, res });
      await collectionAdd(supabase, upload);
      res.sendStatus(200);
    } catch (error) {
      return next(error);
    }
};

export async function collectionGetController (req: Request, res: Response<CollectionResponseBody>, next: NextFunction): Promise<void> {
    try {
      const supabase = createClient({ req, res });
      const collection = await collectionGet(supabase);
      res.json({ collection: collection });
    } catch (error) {
      return next(error);
     }
};

export async function collectionDeleteController (req: Request<CollectionItemParams>, res: Response, next: NextFunction): Promise<void> {
    try {
      const supabase = createClient({ req, res });
      await collectionDelete(supabase, req.params.id);
      res.sendStatus(200);
    } catch (error) {
      return next(error);
     }
};
