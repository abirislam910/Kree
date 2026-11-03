import axios from 'axios';
import { generateImage, generateMusic } from '../../src/features/generation/service.js';
import {
    AppError,
    ValidationError,
    TooManyRequestsError,
    ExternalAPIError,
    InternalServerError,
} from '../../src/core/errorTypes.js';
import { axiosResponse, httpError, networkError } from '../helpers/axios.js';

type AppErrorClass = new (message: string) => AppError;

let post: jest.SpiedFunction<typeof axios.post>;

beforeEach(() => {
    post = jest.spyOn(axios, 'post');
});

afterEach(() => {
    jest.restoreAllMocks();
});

describe('generateImage', () => {
    it('requests gpt-image-2.5-sunburst and decodes the base64 PNG into a Buffer', async () => {
        const png = Buffer.from('fake-png-bytes');
        post.mockResolvedValue(axiosResponse({ data: [{ b64_json: png.toString('base64') }] }));

        const result = await generateImage('a cozy cabin');

        expect(result).toEqual(png);
        expect(post).toHaveBeenCalledWith(
            'https://api.openai.com/v1/images/generations',
            expect.objectContaining({
                prompt: 'a cozy cabin',
                model: 'gpt-image-2.5-sunburst',
                size: '1536x1024',
                output_format: 'png',
            }),
            expect.anything(),
        );
        expect(post).toHaveBeenCalledWith(
            expect.anything(),
            expect.not.objectContaining({ response_format: expect.anything() }),
            expect.anything(),
        );
        expect(post).toHaveBeenCalledWith(
            expect.anything(),
            expect.not.objectContaining({ style: expect.anything() }),
            expect.anything(),
        );
    });

    it('rejects an empty prompt without calling OpenAI', async () => {
        await expect(generateImage('')).rejects.toBeInstanceOf(ValidationError);
        expect(post).not.toHaveBeenCalled();
    });

    it('throws ExternalAPIError when OpenAI returns no image data', async () => {
        post.mockResolvedValue(axiosResponse({ data: [] }));
        await expect(generateImage('x')).rejects.toThrow('Unexpected response from OpenAI');
    });

    it.each<[number, AppErrorClass]>([
        [400, ValidationError],
        [401, InternalServerError],
        [429, TooManyRequestsError],
        [503, ExternalAPIError],
    ])('maps an OpenAI %i response to %p', async (status, ErrorType) => {
        post.mockRejectedValue(httpError(status));
        await expect(generateImage('x')).rejects.toBeInstanceOf(ErrorType);
    });

    it('includes the request-limit reset time in rate-limit errors', async () => {
        post.mockRejectedValue(httpError(429, {
            'x-ratelimit-remaining-requests': '0',
            'x-ratelimit-reset-requests': '12s',
        }));
        await expect(generateImage('x')).rejects.toThrow('Try again in 12s');
    });

    it('includes the token-limit reset time in rate-limit errors', async () => {
        post.mockRejectedValue(httpError(429, {
            'x-ratelimit-remaining-tokens': '0',
            'x-ratelimit-reset-tokens': '3s',
        }));
        await expect(generateImage('x')).rejects.toThrow('Try again in 3s');
    });

    it('maps network failures to ExternalAPIError', async () => {
        post.mockRejectedValue(networkError());
        await expect(generateImage('x')).rejects.toBeInstanceOf(ExternalAPIError);
    });

    it('maps non-axios failures to InternalServerError', async () => {
        post.mockRejectedValue(new TypeError('boom'));
        await expect(generateImage('x')).rejects.toBeInstanceOf(InternalServerError);
    });
});

describe('generateMusic', () => {
    it('requests a 30s instrumental from music_v2_5 and returns the MP3 bytes', async () => {
        const mp3 = Buffer.from('fake-mp3-bytes');
        post.mockResolvedValue(axiosResponse(mp3));

        const result = await generateMusic('lofi beat');

        expect(result).toEqual(mp3);
        expect(post).toHaveBeenCalledWith(
            'https://api.elevenlabs.io/v1/music',
            {
                prompt: 'lofi beat',
                model_id: 'music_v2_5',
                music_length_ms: 30000,
                force_instrumental: true,
            },
            expect.objectContaining({ responseType: 'arraybuffer' }),
        );
    });

    it('rejects an empty prompt without calling ElevenLabs', async () => {
        await expect(generateMusic(undefined)).rejects.toBeInstanceOf(ValidationError);
        expect(post).not.toHaveBeenCalled();
    });

    it('throws ExternalAPIError when ElevenLabs returns non-binary data', async () => {
        post.mockResolvedValue(axiosResponse({ detail: 'json instead of audio' }));
        await expect(generateMusic('x')).rejects.toThrow('Unexpected response from ElevenLabs');
    });

    it.each<[number, AppErrorClass]>([
        [400, ValidationError],
        [401, InternalServerError],
        [429, TooManyRequestsError],
        [500, ExternalAPIError],
    ])('maps an ElevenLabs %i response to %p', async (status, ErrorType) => {
        post.mockRejectedValue(httpError(status));
        await expect(generateMusic('x')).rejects.toBeInstanceOf(ErrorType);
    });

    it('maps network failures to ExternalAPIError', async () => {
        post.mockRejectedValue(networkError());
        await expect(generateMusic('x')).rejects.toBeInstanceOf(ExternalAPIError);
    });
});
