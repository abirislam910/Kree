// The generation controller picks its service when it is first loaded, so each
// test loads a fresh copy of the app with the environment it needs.

jest.mock('axios');

const fs = require('fs');
const path = require('path');
const request = require('supertest');

const FIXTURES = path.join(__dirname, '../../fixtures');
const ENV_KEYS = ['MOCK_GENERATION', 'NODE_ENV'];

function loadApp (env) {
    for (const [key, value] of Object.entries(env)) {
        process.env[key] = value;
    }
    let app;
    let axios;
    jest.isolateModules(() => {
        axios = require('axios');
        app = require('../../app.js');
    });
    return { app, axios };
}

const saved = {};
beforeEach(() => {
    for (const key of ENV_KEYS) saved[key] = process.env[key];
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    for (const key of ENV_KEYS) {
        if (saved[key] === undefined) delete process.env[key];
        else process.env[key] = saved[key];
    }
    jest.restoreAllMocks();
});

function binaryParser (res, cb) {
    const chunks = [];
    res.on('data', (c) => chunks.push(c));
    res.on('end', () => cb(null, Buffer.concat(chunks)));
}

describe('MOCK_GENERATION=true', () => {
    it('serves the demo image without calling OpenAI', async () => {
        const { app, axios } = loadApp({ MOCK_GENERATION: 'true', NODE_ENV: 'development' });

        const res = await request(app).post('/api/generate/image').send({ prompt: 'cabin' });

        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toBe('image/png');
        expect(res.body.equals(fs.readFileSync(path.join(FIXTURES, 'demo-image.png')))).toBe(true);
        expect(axios.post).not.toHaveBeenCalled();
    });

    it('serves the demo audio without calling ElevenLabs', async () => {
        const { app, axios } = loadApp({ MOCK_GENERATION: 'true', NODE_ENV: 'development' });

        const res = await request(app)
            .post('/api/generate/music')
            .send({ prompt: 'lofi' })
            .buffer(true)
            .parse(binaryParser);

        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toBe('audio/mpeg');
        expect(res.body.equals(fs.readFileSync(path.join(FIXTURES, 'demo-audio.mp3')))).toBe(true);
        expect(axios.post).not.toHaveBeenCalled();
    });

    it('still returns 422 for a missing prompt', async () => {
        const { app } = loadApp({ MOCK_GENERATION: 'true', NODE_ENV: 'development' });

        const res = await request(app).post('/api/generate/music').send({});

        expect(res.status).toBe(422);
    });

    it('is ignored in production', async () => {
        const { app, axios } = loadApp({ MOCK_GENERATION: 'true', NODE_ENV: 'production' });
        axios.post.mockResolvedValue({ data: { data: [{ b64_json: Buffer.from('real').toString('base64') }] } });

        const res = await request(app).post('/api/generate/image').send({ prompt: 'cabin' });

        expect(axios.post).toHaveBeenCalled();
        expect(res.body.toString()).toBe('real');
        expect(console.warn).toHaveBeenCalledWith('MOCK_GENERATION is ignored in production');
    });
});
