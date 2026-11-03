import type { Request } from 'express';
import { Readable } from 'stream';
import { validateCollectionUpload } from '../../src/features/collection/validators.js';
import { ValidationError } from '../../src/core/errorTypes.js';

function file (fieldname: string, contents: string): Express.Multer.File {
    const buffer = Buffer.from(contents);
    return {
        fieldname,
        originalname: `${fieldname}.bin`,
        encoding: '7bit',
        mimetype: 'application/octet-stream',
        size: buffer.length,
        buffer,
        stream: Readable.from(buffer),
        destination: '',
        filename: '',
        path: '',
    };
}

describe('validateCollectionUpload', () => {
    it('extracts both file buffers and the location', () => {
        const result = validateCollectionUpload(
            { imageData: [file('imageData', 'png')], audioData: [file('audioData', 'mp3')] },
            { location: 'Lisbon' },
        );

        expect(result).toEqual({ imageData: Buffer.from('png'), audioData: Buffer.from('mp3'), location: 'Lisbon' });
    });

    it('uses null for a missing or non-string location', () => {
        const files = { imageData: [file('imageData', 'png')], audioData: [file('audioData', 'mp3')] };

        expect(validateCollectionUpload(files, {}).location).toBeNull();
        expect(validateCollectionUpload(files, { location: 7 }).location).toBeNull();
    });

    it.each<[string, Request['files']]>([
        ['no files at all', undefined],
        ['an empty files object', {}],
        ['an array of files instead of named fields', [file('imageData', 'png'), file('audioData', 'mp3')]],
        ['only the image', { imageData: [file('imageData', 'png')] }],
        ['only the audio', { audioData: [file('audioData', 'mp3')] }],
        ['an empty file array', { imageData: [], audioData: [file('audioData', 'mp3')] }],
    ])('throws ValidationError for %s', (_, files) => {
        expect(() => validateCollectionUpload(files, { location: 'Lisbon' })).toThrow(ValidationError);
    });
});
