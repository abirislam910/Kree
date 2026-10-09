// Exercises the real Express app (routing, middleware, controllers, services)
// with Supabase and the external AI APIs replaced by fakes.

jest.mock('axios');
jest.mock('../../core/supabase.js', () => ({ createClient: jest.fn() }));

const request = require('supertest');
const axios = require('axios');
const { createClient } = require('../../core/supabase.js');
const app = require('../../app.js');
const { createFakeSupabase } = require('../helpers/fakeSupabase.js');

const USER = { id: 'user-1', user_metadata: { name: 'Abir' } };

let supabase;

function useSupabase(fake) {
    supabase = fake;
    createClient.mockReturnValue(fake);
}

beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    useSupabase(createFakeSupabase({ user: USER }));
});

afterEach(() => {
    jest.restoreAllMocks();
});

describe('auth routes', () => {
    it('POST /api/auth/login returns the user name', async () => {
        supabase.auth.signInWithPassword.mockResolvedValue({
            data: { session: { user: USER } },
            error: null,
        });

        const res = await request(app).post('/api/auth/login').send({ email: 'a@b.com', password: 'pw' });

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ user: 'Abir' });
    });

    it('POST /api/auth/login returns 401 for bad credentials', async () => {
        supabase.auth.signInWithPassword.mockResolvedValue({ data: {}, error: { status: 400 } });

        const res = await request(app).post('/api/auth/login').send({ email: 'a@b.com', password: 'nope' });

        expect(res.status).toBe(401);
        expect(res.body).toEqual({ error: { message: 'Error Logging In' } });
    });

    it('POST /api/auth/register returns 200 on success', async () => {
        supabase.auth.signUp.mockResolvedValue({ data: {}, error: null });

        const res = await request(app).post('/api/auth/register').send({ email: 'a@b.com', password: 'pw', name: 'Abir' });

        expect(res.status).toBe(200);
    });

    it('POST /api/auth/register returns 429 when Supabase throttles sign-ups', async () => {
        supabase.auth.signUp.mockResolvedValue({ data: {}, error: { status: 429 } });

        const res = await request(app).post('/api/auth/register').send({ email: 'a@b.com', password: 'pw', name: 'Abir' });

        expect(res.status).toBe(429);
    });

    it('GET /api/auth/user returns null when signed out', async () => {
        useSupabase(createFakeSupabase({ user: null, userError: { status: 400 } }));

        const res = await request(app).get('/api/auth/user');

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ user: null });
    });

    it('POST /api/auth/signout returns 200', async () => {
        const res = await request(app).post('/api/auth/signout');
        expect(res.status).toBe(200);
    });
});

describe('collection routes', () => {
    it('POST /api/collection accepts a multipart image + audio upload', async () => {
        const res = await request(app)
            .post('/api/collection')
            .field('location', 'Kyoto tea house')
            .attach('imageData', Buffer.from('png-bytes'), 'image.png')
            .attach('audioData', Buffer.from('mp3-bytes'), 'audio.mp3');

        expect(res.status).toBe(200);

        const uploadedBodies = supabase.storageBucket.upload.mock.calls.map(([, body]) => body.toString());
        expect(uploadedBodies).toEqual(['png-bytes', 'mp3-bytes']);
        const insert = supabase.queries[0].calls.find((c) => c.method === 'insert').args[0];
        expect(insert.location).toBe('Kyoto tea house');
    });

    it('POST /api/collection returns 401 when signed out', async () => {
        useSupabase(createFakeSupabase({ user: null }));

        const res = await request(app)
            .post('/api/collection')
            .field('location', 'x')
            .attach('imageData', Buffer.from('a'), 'image.png')
            .attach('audioData', Buffer.from('b'), 'audio.mp3');

        expect(res.status).toBe(401);
        expect(res.body).toEqual({ error: { message: 'User not authenticated' } });
    });

    it('POST /api/collection returns 422 instead of crashing when no files are attached', async () => {
        const res = await request(app)
            .post('/api/collection')
            .field('location', 'x')
            .timeout(2000);

        expect(res.status).toBe(422);
        expect(res.body).toEqual({ error: { message: 'Both imageData and audioData files are required' } });
        expect(supabase.storageBucket.upload).not.toHaveBeenCalled();
    });

    it('POST /api/collection returns 422 when only one file is attached', async () => {
        const res = await request(app)
            .post('/api/collection')
            .field('location', 'x')
            .attach('imageData', Buffer.from('png-bytes'), 'image.png')
            .timeout(2000);

        expect(res.status).toBe(422);
        expect(supabase.storageBucket.upload).not.toHaveBeenCalled();
    });

    it('POST /api/collection returns 422 for a file under an unexpected field name', async () => {
        const res = await request(app)
            .post('/api/collection')
            .field('location', 'x')
            .attach('photo', Buffer.from('png-bytes'), 'image.png')
            .timeout(2000);

        expect(res.status).toBe(422);
        expect(res.body).toEqual({ error: { message: 'Unexpected field: photo' } });
        expect(supabase.storageBucket.upload).not.toHaveBeenCalled();
    });

    it('POST /api/collection returns 422 when a file field is sent twice', async () => {
        const res = await request(app)
            .post('/api/collection')
            .attach('imageData', Buffer.from('a'), 'a.png')
            .attach('imageData', Buffer.from('b'), 'b.png')
            .attach('audioData', Buffer.from('c'), 'c.mp3')
            .timeout(2000);

        expect(res.status).toBe(422);
        expect(res.body).toEqual({ error: { message: 'Unexpected field: imageData' } });
    });

    it('POST /api/collection returns 422 for a JSON body with no multipart files', async () => {
        const res = await request(app)
            .post('/api/collection')
            .send({ location: 'x' })
            .timeout(2000);

        expect(res.status).toBe(422);
    });

    it('GET /api/collection returns the collection', async () => {
        supabase.queueQuery({
            data: [{ id: 'c1', location: 'Paris', image_path: 'p/i.png', audio_path: 'p/a.mp3' }],
            error: null,
        });

        const res = await request(app).get('/api/collection');

        expect(res.status).toBe(200);
        expect(res.body.collection).toHaveLength(1);
        expect(res.body.collection[0]).toMatchObject({ uuid: 'c1', location: 'Paris' });
    });

    it('DELETE /api/collection/:id deletes the item', async () => {
        supabase
            .queueQuery({ data: { image_path: 'i.png', audio_path: 'a.mp3' }, error: null })
            .queueQuery({ data: null, error: null });

        const res = await request(app).delete('/api/collection/c1');

        expect(res.status).toBe(200);
        expect(supabase.queries[0].calls).toContainEqual({ method: 'eq', args: ['id', 'c1'] });
    });

    it('DELETE /api/collection/:id returns 404 for an item the user does not own', async () => {
        supabase.queueQuery({ data: null, error: null });

        const res = await request(app).delete('/api/collection/not-mine');

        expect(res.status).toBe(404);
        expect(res.body).toEqual({ error: { message: 'Content not found' } });
        expect(supabase.storageBucket.remove).not.toHaveBeenCalled();
    });
});

describe('generation routes', () => {
    it('POST /api/generate/image responds with PNG bytes', async () => {
        const png = Buffer.from('png-bytes');
        axios.post.mockResolvedValue({ data: { data: [{ b64_json: png.toString('base64') }] } });

        const res = await request(app).post('/api/generate/image').send({ prompt: 'cabin' });

        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toBe('image/png');
        expect(Buffer.compare(res.body, png)).toBe(0);
    });

    it('POST /api/generate/music responds with MP3 bytes', async () => {
        const mp3 = Buffer.from('mp3-bytes');
        axios.post.mockResolvedValue({ data: mp3 });

        const res = await request(app)
            .post('/api/generate/music')
            .send({ prompt: 'lofi' })
            .buffer(true)
            .parse((r, cb) => {
                const chunks = [];
                r.on('data', (c) => chunks.push(c));
                r.on('end', () => cb(null, Buffer.concat(chunks)));
            });

        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toBe('audio/mpeg');
        expect(Buffer.compare(res.body, mp3)).toBe(0);
    });

    it('returns 422 for a missing prompt', async () => {
        const res = await request(app).post('/api/generate/image').send({});

        expect(res.status).toBe(422);
        expect(res.body).toEqual({ error: { message: 'Invalid prompt' } });
        expect(axios.post).not.toHaveBeenCalled();
    });

    it('returns 502 when the upstream API is unreachable', async () => {
        const err = new Error('ECONNRESET');
        err.request = {};
        axios.post.mockRejectedValue(err);

        const res = await request(app).post('/api/generate/music').send({ prompt: 'lofi' });

        expect(res.status).toBe(502);
    });
});

describe('CORS', () => {
    it('allows credentialed requests from the configured frontend origin', async () => {
        const origin = process.env.FRONTEND_URL || 'http://localhost:3000';
        const res = await request(app)
            .options('/api/collection')
            .set('Origin', origin)
            .set('Access-Control-Request-Method', 'DELETE');

        expect(res.headers['access-control-allow-origin']).toBe(origin);
        expect(res.headers['access-control-allow-credentials']).toBe('true');
    });
});
