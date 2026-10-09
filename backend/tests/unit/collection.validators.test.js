const { validateCollectionUpload } = require('../../features/collection/validators.js');
const { ValidationError } = require('../../core/errorTypes.js');

function uploadRequest(files, body = { location: 'Lisbon' }) {
    return { files, body };
}

describe('validateCollectionUpload', () => {
    it('extracts both file buffers and the location', () => {
        const image = Buffer.from('png');
        const audio = Buffer.from('mp3');

        const result = validateCollectionUpload(uploadRequest({
            imageData: [{ buffer: image }],
            audioData: [{ buffer: audio }],
        }));

        expect(result).toEqual({ imageData: image, audioData: audio, location: 'Lisbon' });
    });

    it.each([
        ['no files at all', undefined],
        ['an empty files object', {}],
        ['only the image', { imageData: [{ buffer: Buffer.from('png') }] }],
        ['only the audio', { audioData: [{ buffer: Buffer.from('mp3') }] }],
        ['an empty file array', { imageData: [], audioData: [{ buffer: Buffer.from('mp3') }] }],
    ])('throws ValidationError for %s', (_, files) => {
        expect(() => validateCollectionUpload(uploadRequest(files))).toThrow(ValidationError);
    });
});
