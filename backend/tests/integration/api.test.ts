// Exercises the real Express app (routing, middleware, controllers, services)
// with Supabase and the external AI APIs replaced by fakes.

import request from 'supertest';
import axios from 'axios';
import { createClient } from '../../src/core/supabase.js';
import app from '../../src/app.js';
import { createFakeSupabase } from '../helpers/fakeSupabase.js';
import type { FakeSupabase, FakeUser } from '../helpers/fakeSupabase.js';
import { axiosResponse, networkError } from '../helpers/axios.js';

jest.mock('../../src/core/supabase.js', () => ({ createClient: jest.fn() }));

const USER: FakeUser = { id: 'user-1', name: 'Abir' };

let fake: FakeSupabase;

async function useSupabase (user: FakeUser | null): Promise<FakeSupabase> {
    fake = await createFakeSupabase(user);
    jest.mocked(createClient).mockReturnValue(fake.client);
    return fake;
}

beforeEach(async () => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    await useSupabase(USER);
});

afterEach(() => {
    jest.restoreAllMocks();
});

describe('auth routes', () => {
    it('POST /api/auth/login returns the user name', async () => {
        const res = await request(app).post('/api/auth/login').send({ email: 'a@b.com', password: 'pw' });

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ user: 'Abir' });
    });

    it('POST /api/auth/login returns 401 for bad credentials', async () => {
        fake.respond('POST', '/auth/v1/token', 400, { code: 'invalid_credentials', msg: 'Invalid login credentials' });

        const res = await request(app).post('/api/auth/login').send({ email: 'a@b.com', password: 'nope' });

        expect(res.status).toBe(401);
        expect(res.body).toEqual({ error: { message: 'Error Logging In' } });
    });

    it('POST /api/auth/login returns 422 without calling Supabase when fields are missing', async () => {
        const res = await request(app).post('/api/auth/login').send({ email: 'a@b.com' });

        expect(res.status).toBe(422);
        expect(res.body).toEqual({ error: { message: 'Email and password are required' } });
        expect(fake.requests).toHaveLength(0);
    });

    it('POST /api/auth/register returns 200 on success', async () => {
        const res = await request(app).post('/api/auth/register').send({ email: 'a@b.com', password: 'pw', name: 'Abir' });

        expect(res.status).toBe(200);
    });

    it('POST /api/auth/register returns 429 when Supabase throttles sign-ups', async () => {
        fake.respond('POST', '/auth/v1/signup', 429, { code: 'over_request_rate_limit', msg: 'slow down' });

        const res = await request(app).post('/api/auth/register').send({ email: 'a@b.com', password: 'pw', name: 'Abir' });

        expect(res.status).toBe(429);
    });

    it('POST /api/auth/register returns 422 when the name is missing', async () => {
        const res = await request(app).post('/api/auth/register').send({ email: 'a@b.com', password: 'pw' });

        expect(res.status).toBe(422);
        expect(fake.requests).toHaveLength(0);
    });

    it('GET /api/auth/user returns null when signed out', async () => {
        await useSupabase(null);

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
        expect(fake.requestsTo('/storage/v1/object/', 'POST').map((r) => r.body))
            .toEqual([Buffer.from('png-bytes'), Buffer.from('mp3-bytes')]);
        expect(fake.requestsTo('/rest/v1/User_Content', 'POST')[0]?.body).toMatchObject({ location: 'Kyoto tea house' });
    });

    it('POST /api/collection returns 401 when signed out', async () => {
        await useSupabase(null);

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
        expect(fake.requestsTo('/storage/')).toHaveLength(0);
    });

    it('POST /api/collection returns 422 when only one file is attached', async () => {
        const res = await request(app)
            .post('/api/collection')
            .field('location', 'x')
            .attach('imageData', Buffer.from('png-bytes'), 'image.png')
            .timeout(2000);

        expect(res.status).toBe(422);
        expect(fake.requestsTo('/storage/')).toHaveLength(0);
    });

    it('POST /api/collection returns 422 for a file under an unexpected field name', async () => {
        const res = await request(app)
            .post('/api/collection')
            .field('location', 'x')
            .attach('photo', Buffer.from('png-bytes'), 'image.png')
            .timeout(2000);

        expect(res.status).toBe(422);
        expect(res.body).toEqual({ error: { message: 'Unexpected field: photo' } });
        expect(fake.requestsTo('/storage/')).toHaveLength(0);
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
        fake.respond('GET', '/rest/v1/User_Content', 200, [
            { id: 'c1', location: 'Paris', image_path: 'p/i.png', audio_path: 'p/a.mp3' },
        ]);

        const res = await request(app).get('/api/collection');

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            collection: [expect.objectContaining({ uuid: 'c1', location: 'Paris' })],
        });
    });

    it('DELETE /api/collection/:id deletes the item', async () => {
        fake.respond('GET', '/rest/v1/User_Content', 200, [{ image_path: 'i.png', audio_path: 'a.mp3' }]);

        const res = await request(app).delete('/api/collection/c1');

        expect(res.status).toBe(200);
        expect(fake.requestsTo('/rest/v1/User_Content', 'GET')[0]?.query.get('id')).toBe('eq.c1');
        expect(fake.requestsTo('/rest/v1/User_Content', 'DELETE')).toHaveLength(1);
    });

    it('DELETE /api/collection/:id returns 404 for an item the user does not own', async () => {
        fake.respond('GET', '/rest/v1/User_Content', 200, []);

        const res = await request(app).delete('/api/collection/not-mine');

        expect(res.status).toBe(404);
        expect(res.body).toEqual({ error: { message: 'Content not found' } });
        expect(fake.requestsTo('/storage/')).toHaveLength(0);
    });
});

describe('generation routes', () => {
    it('POST /api/generate/image responds with PNG bytes', async () => {
        const png = Buffer.from('png-bytes');
        jest.spyOn(axios, 'post').mockResolvedValue(axiosResponse({ data: [{ b64_json: png.toString('base64') }] }));

        const res = await request(app).post('/api/generate/image').send({ prompt: 'cabin' });

        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toBe('image/png');
        expect(res.body).toEqual(png);
    });

    it('POST /api/generate/music responds with MP3 bytes', async () => {
        const mp3 = Buffer.from('mp3-bytes');
        jest.spyOn(axios, 'post').mockResolvedValue(axiosResponse(mp3));

        const res = await request(app)
            .post('/api/generate/music')
            .send({ prompt: 'lofi' })
            .responseType('blob');

        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toBe('audio/mpeg');
        expect(res.body).toEqual(mp3);
    });

    it('returns 422 for a missing prompt', async () => {
        const post = jest.spyOn(axios, 'post');

        const res = await request(app).post('/api/generate/image').send({});

        expect(res.status).toBe(422);
        expect(res.body).toEqual({ error: { message: 'Invalid prompt' } });
        expect(post).not.toHaveBeenCalled();
    });

    it('returns 422 for a non-string prompt', async () => {
        const post = jest.spyOn(axios, 'post');

        const res = await request(app).post('/api/generate/music').send({ prompt: { nested: true } });

        expect(res.status).toBe(422);
        expect(post).not.toHaveBeenCalled();
    });

    it('returns 502 when the upstream API is unreachable', async () => {
        jest.spyOn(axios, 'post').mockRejectedValue(networkError());

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
