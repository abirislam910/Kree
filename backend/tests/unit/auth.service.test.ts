import { login, registration, signout, getUser } from '../../src/features/auth/service.js';
import {
    AppError,
    UnauthorizedError,
    ValidationError,
    TooManyRequestsError,
    ExternalAPIError,
} from '../../src/core/errorTypes.js';
import { createFakeSupabase } from '../helpers/fakeSupabase.js';

type AppErrorClass = new (message: string) => AppError;

const USER = { id: 'user-1', name: 'Abir' };

describe('auth service', () => {
    describe('login', () => {
        it('returns the display name from the session', async () => {
            const fake = await createFakeSupabase(USER);

            await expect(login(fake.client, { email: 'a@b.com', password: 'pw' })).resolves.toBe('Abir');

            const [tokenRequest] = fake.requestsTo('/auth/v1/token', 'POST');
            expect(tokenRequest?.query.get('grant_type')).toBe('password');
            expect(tokenRequest?.body).toMatchObject({ email: 'a@b.com', password: 'pw' });
        });

        it('throws UnauthorizedError when Supabase rejects the credentials', async () => {
            const fake = await createFakeSupabase(null);
            fake.respond('POST', '/auth/v1/token', 400, { code: 'invalid_credentials', msg: 'Invalid login credentials' });

            await expect(login(fake.client, { email: 'a@b.com', password: 'bad' })).rejects.toBeInstanceOf(UnauthorizedError);
        });
    });

    describe('registration', () => {
        it('stores the name in user metadata', async () => {
            const fake = await createFakeSupabase(null);

            await registration(fake.client, { email: 'a@b.com', password: 'pw', name: 'Abir' });

            const [signupRequest] = fake.requestsTo('/auth/v1/signup', 'POST');
            expect(signupRequest?.body).toMatchObject({ email: 'a@b.com', password: 'pw', data: { name: 'Abir' } });
        });

        it.each<[number, AppErrorClass]>([
            [400, ValidationError],
            [422, ValidationError],
            [429, TooManyRequestsError],
            [500, ExternalAPIError],
        ])('maps a Supabase %i error to %p', async (status, ErrorType) => {
            const fake = await createFakeSupabase(null);
            fake.respond('POST', '/auth/v1/signup', status, { code: 'error', msg: 'nope' });

            await expect(registration(fake.client, { email: 'a@b.com', password: 'pw', name: 'Abir' }))
                .rejects.toBeInstanceOf(ErrorType);
        });
    });

    describe('signout', () => {
        it('resolves when Supabase signs out cleanly', async () => {
            const fake = await createFakeSupabase(USER);

            await expect(signout(fake.client)).resolves.toBeUndefined();
            expect(fake.requestsTo('/auth/v1/logout', 'POST')).toHaveLength(1);
        });

        it('throws ExternalAPIError when Supabase reports an error', async () => {
            const fake = await createFakeSupabase(USER);
            fake.respond('POST', '/auth/v1/logout', 500, { code: 'unexpected_failure', msg: 'boom' });

            await expect(signout(fake.client)).rejects.toBeInstanceOf(ExternalAPIError);
        });
    });

    describe('getUser', () => {
        it('returns the display name of the signed-in user', async () => {
            const fake = await createFakeSupabase(USER);
            await expect(getUser(fake.client)).resolves.toBe('Abir');
        });

        it('returns null when there is no session', async () => {
            const fake = await createFakeSupabase(null);
            await expect(getUser(fake.client)).resolves.toBeNull();
        });

        it('throws ExternalAPIError on non-session Supabase errors', async () => {
            const fake = await createFakeSupabase(USER);
            fake.respond('GET', '/auth/v1/user', 500, { code: 'unexpected_failure', msg: 'boom' });

            await expect(getUser(fake.client)).rejects.toBeInstanceOf(ExternalAPIError);
        });
    });
});
