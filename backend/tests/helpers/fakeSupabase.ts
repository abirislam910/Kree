// A real Supabase client wired to an in-memory fetch, so tests get a properly
// typed KreeSupabaseClient and can assert on the HTTP requests it makes.
// Responses default to success; queue overrides with `fake.respond(...)`.

import { createClient } from '@supabase/supabase-js';
import type { Database, KreeSupabaseClient } from '../../src/lib/types.js';

export interface FakeUser {
    id: string;
    name: string;
}

export interface RecordedRequest {
    method: string;
    path: string;
    query: URLSearchParams;
    body: unknown;
}

interface QueuedResponse {
    method: string;
    pathPrefix: string;
    status: number;
    json: unknown;
}

export interface FakeSupabase {
    client: KreeSupabaseClient;
    requests: RecordedRequest[];
    /** Answer the next matching request with this status and JSON body. */
    respond(method: string, pathPrefix: string, status: number, json: unknown): FakeSupabase;
    /** Requests whose path starts with the prefix (optionally filtered by method). */
    requestsTo(pathPrefix: string, method?: string): RecordedRequest[];
}

export const SUPABASE_URL = 'http://supabase.test';

function base64url (value: object): string {
    return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function fakeJwt (userId: string): string {
    const payload = { sub: userId, role: 'authenticated', aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 };
    // Unverified fake signature; must still be valid base64url (length % 4 !== 1).
    return `${base64url({ alg: 'HS256', typ: 'JWT' })}.${base64url(payload)}.${Buffer.from('fake-signature').toString('base64url')}`;
}

function userJson (user: FakeUser): object {
    return {
        id: user.id,
        aud: 'authenticated',
        role: 'authenticated',
        email: `${user.id}@example.com`,
        user_metadata: { name: user.name },
        app_metadata: {},
        created_at: '2026-01-01T00:00:00Z',
    };
}

function jsonResponse (status: number, json: unknown): Response {
    if (status === 204) {
        return new Response(null, { status });
    }
    return new Response(JSON.stringify(json), { status, headers: { 'content-type': 'application/json' } });
}

async function readBody (body: RequestInit['body']): Promise<unknown> {
    if (body === null || body === undefined) {
        return undefined;
    }
    if (typeof body === 'string') {
        try {
            const parsed: unknown = JSON.parse(body);
            return parsed;
        } catch {
            return body;
        }
    }
    return Buffer.from(await new Response(body).arrayBuffer());
}

function defaultResponse (method: string, path: string, signedInUser: FakeUser | null): Response {
    if (path === '/auth/v1/user') {
        return signedInUser
            ? jsonResponse(200, userJson(signedInUser))
            : jsonResponse(401, { code: 'bad_jwt', msg: 'invalid JWT' });
    }
    if (path === '/auth/v1/token') {
        const user = signedInUser ?? { id: 'user-1', name: 'Test User' };
        return jsonResponse(200, { access_token: fakeJwt(user.id), refresh_token: 'refresh', expires_in: 3600, token_type: 'bearer', user: userJson(user) });
    }
    if (path === '/auth/v1/signup') {
        return jsonResponse(200, userJson(signedInUser ?? { id: 'user-1', name: 'Test User' }));
    }
    if (path === '/auth/v1/logout') {
        return jsonResponse(204, null);
    }
    if (path.startsWith('/rest/v1/')) {
        return method === 'GET' ? jsonResponse(200, []) : jsonResponse(201, null);
    }
    if (path.startsWith('/storage/v1/object/')) {
        return method === 'DELETE' ? jsonResponse(200, []) : jsonResponse(200, { Key: path, Id: 'object-id' });
    }
    return jsonResponse(404, { message: `No fake route for ${method} ${path}` });
}

/**
 * @param user Signed-in user, or null for a client with no session.
 */
export async function createFakeSupabase (user: FakeUser | null): Promise<FakeSupabase> {
    const requests: RecordedRequest[] = [];
    const queue: QueuedResponse[] = [];

    const fakeFetch: typeof fetch = async (input, init) => {
        const request = input instanceof Request ? input : undefined;
        const url = new URL(request ? request.url : input.toString());
        const method = (init?.method ?? request?.method ?? 'GET').toUpperCase();

        requests.push({ method, path: url.pathname, query: url.searchParams, body: await readBody(init?.body) });

        const index = queue.findIndex((queued) => queued.method === method && url.pathname.startsWith(queued.pathPrefix));
        const [queued] = index === -1 ? [] : queue.splice(index, 1);
        return queued
            ? jsonResponse(queued.status, queued.json)
            : defaultResponse(method, url.pathname, user);
    };

    const client = createClient<Database>(SUPABASE_URL, 'anon-key', {
        global: { fetch: fakeFetch },
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    if (user) {
        const { error } = await client.auth.setSession({ access_token: fakeJwt(user.id), refresh_token: 'refresh' });
        if (error) {
            throw error;
        }
        // Drop the setup traffic so tests only see requests they caused.
        requests.length = 0;
    }

    const fake: FakeSupabase = {
        client,
        requests,
        respond (method, pathPrefix, status, json) {
            queue.push({ method: method.toUpperCase(), pathPrefix, status, json });
            return fake;
        },
        requestsTo (pathPrefix, method) {
            return requests.filter((r) => r.path.startsWith(pathPrefix) && (method === undefined || r.method === method));
        },
    };
    return fake;
}
