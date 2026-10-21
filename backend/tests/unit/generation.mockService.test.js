const fs = require('fs');
const path = require('path');
const { generateImage, generateMusic } = require('../../features/generation/mockService.js');
const { ValidationError } = require('../../core/errorTypes.js');

const FIXTURES = path.join(__dirname, '../../fixtures');

describe('mock generation service', () => {
    const OLD_DELAY = process.env.MOCK_GENERATION_DELAY_MS;
    afterEach(() => {
        process.env.MOCK_GENERATION_DELAY_MS = OLD_DELAY;
        jest.useRealTimers();
    });

    it('returns the demo PNG', async () => {
        const image = await generateImage('anything');

        expect(image.equals(fs.readFileSync(path.join(FIXTURES, 'demo-image.png')))).toBe(true);
        expect(image.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    });

    it('returns the demo MP3', async () => {
        const audio = await generateMusic('anything');

        expect(audio.equals(fs.readFileSync(path.join(FIXTURES, 'demo-audio.mp3')))).toBe(true);
        // MPEG audio frame sync: 11 set bits
        expect(audio[0]).toBe(0xff);
        expect(audio[1] & 0xe0).toBe(0xe0);
    });

    it('rejects empty prompts like the real service', async () => {
        await expect(generateImage('')).rejects.toBeInstanceOf(ValidationError);
        await expect(generateMusic(undefined)).rejects.toBeInstanceOf(ValidationError);
    });

    it('waits MOCK_GENERATION_DELAY_MS before responding', async () => {
        jest.useFakeTimers();
        process.env.MOCK_GENERATION_DELAY_MS = '2000';

        let settled = false;
        const pending = generateImage('x').then(() => { settled = true; });

        await jest.advanceTimersByTimeAsync(1999);
        expect(settled).toBe(false);

        await jest.advanceTimersByTimeAsync(1);
        await pending;
        expect(settled).toBe(true);
    });
});
