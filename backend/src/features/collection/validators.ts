import type { Request } from 'express';
import { ValidationError } from '../../core/errorTypes.js';
import { readString } from '../../lib/guards.js';
import type { CollectionUpload } from '../../lib/types.js';

type UploadedFiles = Request['files'];

function firstFile (files: UploadedFiles, field: string): Express.Multer.File | undefined {
    if (!files || Array.isArray(files)) {
        return undefined;
    }
    return files[field]?.[0];
}

export function validateCollectionUpload (files: UploadedFiles, body: unknown): CollectionUpload {
    const imageFile = firstFile(files, 'imageData');
    const audioFile = firstFile(files, 'audioData');

    if (!imageFile || !audioFile) {
        throw new ValidationError('Both imageData and audioData files are required');
    }

    return {
        imageData: imageFile.buffer,
        audioData: audioFile.buffer,
        location: readString(body, 'location') ?? null,
    };
}
