// The generation controller picks its service when it is first loaded, so each
// test loads a fresh copy of the app with the environment it needs.

import fs from 'fs';
import path from 'path';
import request from 'supertest';
import type { Express } from 'express';
import type { AxiosStatic } from 'axios';
import { axiosResponse } from '../helpers/axios.js';

const FIXTURES = path.join(__dirname, '../../fixtures');
const ENV_KEYS = ['MOCK_GENERATION', 'NODE_ENV'] as const;

interface LoadedApp {
    app: Express;
    axios: AxiosStatic;
}

function loadApp (env: Record<(typeof ENV_KEYS)[number], string>): LoadedApp {
    Object.assign(process.env, env);
    let loaded: LoadedApp | undefined;
    jest.isolateModules(() => {
        // Fresh module instances, so the controller re-reads the environment.
        const appModule = jest.requireActual<typeof import('../../src/app.js')>('../../src/app.js');
        // axios's CommonJS types use `export =`, so the module is AxiosStatic itself.
        const axiosModule = jest.requireActual<typeof import('axios')>('axios');
        loaded = { app: appModule.default, axios: axiosModule };
    });
    if (!loaded) {
        throw new Error('failed to load app');
    }
    return loaded;
}

const saved: Partial<Record<(typeof ENV_KEYS)[number], string>> = {};

beforeEach(() => {
    for (const key of ENV_KEYS) saved[key] = process.env[key];
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    for (const key of ENV_KEYS) {
        const value = saved[key];
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
    }
    jest.restoreAllMocks();
});

describe('MOCK_GENERATION=true', () => {
    it('serves the demo image without calling OpenAI', async () => {
        const { app, axios } = loadApp({ MOCK_GENERATION: 'true', NODE_ENV: 'development' });
        const post = jest.spyOn(axios, 'post');

        const res = await request(app).post('/api/generate/image').send({ prompt: 'cabin' });

        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toBe('image/png');
        expect(res.body).toEqual(fs.readFileSync(path.join(FIXTURES, 'demo-image.png')));
        expect(post).not.toHaveBeenCalled();
    });

    it('serves the demo audio without calling ElevenLabs', async () => {
        const { app, axios } = loadApp({ MOCK_GENERATION: 'true', NODE_ENV: 'development' });
        const post = jest.spyOn(axios, 'post');

        const res = await request(app)
            .post('/api/generate/music')
            .send({ prompt: 'lofi' })
            .responseType('blob');

        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toBe('audio/mpeg');
        expect(res.body).toEqual(fs.readFileSync(path.join(FIXTURES, 'demo-audio.mp3')));
        expect(post).not.toHaveBeenCalled();
    });

    it('still returns 422 for a missing prompt', async () => {
        const { app } = loadApp({ MOCK_GENERATION: 'true', NODE_ENV: 'development' });

        const res = await request(app).post('/api/generate/music').send({});

        expect(res.status).toBe(422);
    });

    it('is ignored in production', async () => {
        const { app, axios } = loadApp({ MOCK_GENERATION: 'true', NODE_ENV: 'production' });
        const post = jest.spyOn(axios, 'post')
            .mockResolvedValue(axiosResponse({ data: [{ b64_json: Buffer.from('real').toString('base64') }] }));

        const res = await request(app).post('/api/generate/image').send({ prompt: 'cabin' });

        expect(post).toHaveBeenCalled();
        expect(res.body).toEqual(Buffer.from('real'));
        expect(console.warn).toHaveBeenCalledWith('MOCK_GENERATION is ignored in production');
    });
});
