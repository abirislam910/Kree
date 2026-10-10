jest.mock('axios');
const axios = require('axios');

const { generateImage, generateMusic } = require('../../features/generation/service.js');
const {
    ValidationError,
    TooManyRequestsError,
    ExternalAPIError,
    InternalServerError,
} = require('../../core/errorTypes.js');

function httpError(status, headers = {}) {
    const err = new Error(`Request failed with status code ${status}`);
    err.response = { status, headers };
    return err;
}

function networkError() {
    const err = new Error('ECONNRESET');
    err.request = {};
    return err;
}

beforeEach(() => {
    jest.resetAllMocks();
});

describe('generateImage', () => {
    it('requests gpt-image-1.5 and decodes the base64 PNG into a Buffer', async () => {
        const png = Buffer.from('fake-png-bytes');
        axios.post.mockResolvedValue({ data: { data: [{ b64_json: png.toString('base64') }] } });

        const result = await generateImage('a cozy cabin');

        expect(Buffer.isBuffer(result)).toBe(true);
        expect(result.equals(png)).toBe(true);

        const [url, body] = axios.post.mock.calls[0];
        expect(url).toBe('https://api.openai.com/v1/images/generations');
        expect(body).toMatchObject({
            prompt: 'a cozy cabin',
            model: 'gpt-image-1.5',
            size: '1536x1024',
            output_format: 'png',
        });
        expect(body).not.toHaveProperty('response_format');
        expect(body).not.toHaveProperty('style');
    });

    it('rejects an empty prompt without calling OpenAI', async () => {
        await expect(generateImage('')).rejects.toBeInstanceOf(ValidationError);
        expect(axios.post).not.toHaveBeenCalled();
    });

    it.each([
        [400, ValidationError],
        [401, InternalServerError],
        [429, TooManyRequestsError],
        [503, ExternalAPIError],
    ])('maps an OpenAI %i response to %p', async (status, ErrorType) => {
        axios.post.mockRejectedValue(httpError(status));
        await expect(generateImage('x')).rejects.toBeInstanceOf(ErrorType);
    });

    it('includes the request-limit reset time in rate-limit errors', async () => {
        axios.post.mockRejectedValue(httpError(429, {
            'x-ratelimit-remaining-requests': '0',
            'x-ratelimit-reset-requests': '12s',
        }));
        await expect(generateImage('x')).rejects.toThrow('Try again in 12s');
    });

    it('includes the token-limit reset time in rate-limit errors', async () => {
        axios.post.mockRejectedValue(httpError(429, {
            'x-ratelimit-remaining-tokens': '0',
            'x-ratelimit-reset-tokens': '3s',
        }));
        await expect(generateImage('x')).rejects.toThrow('Try again in 3s');
    });

    it('maps network failures to ExternalAPIError', async () => {
        axios.post.mockRejectedValue(networkError());
        await expect(generateImage('x')).rejects.toBeInstanceOf(ExternalAPIError);
    });
});

describe('generateMusic', () => {
    it('requests a 30s instrumental from music_v2_5 and returns the MP3 bytes', async () => {
        const mp3 = Buffer.from('fake-mp3-bytes');
        axios.post.mockResolvedValue({ data: mp3 });

        const result = await generateMusic('lofi beat');

        expect(result.equals(mp3)).toBe(true);

        const [url, body, config] = axios.post.mock.calls[0];
        expect(url).toBe('https://api.elevenlabs.io/v1/music');
        expect(body).toEqual({
            prompt: 'lofi beat',
            model_id: 'music_v2_5',
            music_length_ms: 30000,
            force_instrumental: true,
        });
        expect(config.responseType).toBe('arraybuffer');
    });

    it('rejects an empty prompt without calling ElevenLabs', async () => {
        await expect(generateMusic(undefined)).rejects.toBeInstanceOf(ValidationError);
        expect(axios.post).not.toHaveBeenCalled();
    });

    it.each([
        [400, ValidationError],
        [401, InternalServerError],
        [429, TooManyRequestsError],
        [500, ExternalAPIError],
    ])('maps an ElevenLabs %i response to %p', async (status, ErrorType) => {
        axios.post.mockRejectedValue(httpError(status));
        await expect(generateMusic('x')).rejects.toBeInstanceOf(ErrorType);
    });

    it('maps network failures to ExternalAPIError', async () => {
        axios.post.mockRejectedValue(networkError());
        await expect(generateMusic('x')).rejects.toBeInstanceOf(ExternalAPIError);
    });
});
