const { login, registration, signout, getUser } = require('../../features/auth/service.js');
const {
    UnauthorizedError,
    ValidationError,
    TooManyRequestsError,
    ExternalAPIError,
    InternalServerError,
} = require('../../core/errorTypes.js');
const { createFakeSupabase } = require('../helpers/fakeSupabase.js');

describe('auth service', () => {
    describe('login', () => {
        it('returns the display name from the session', async () => {
            const supabase = createFakeSupabase();
            supabase.auth.signInWithPassword.mockResolvedValue({
                data: { session: { user: { user_metadata: { name: 'Abir' } } } },
                error: null,
            });

            await expect(login(supabase, 'a@b.com', 'pw')).resolves.toBe('Abir');
            expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'a@b.com', password: 'pw' });
        });

        it('throws UnauthorizedError when Supabase rejects the credentials', async () => {
            const supabase = createFakeSupabase();
            supabase.auth.signInWithPassword.mockResolvedValue({ data: {}, error: { status: 400 } });

            await expect(login(supabase, 'a@b.com', 'bad')).rejects.toBeInstanceOf(UnauthorizedError);
        });

        it('wraps unexpected failures in InternalServerError', async () => {
            const supabase = createFakeSupabase();
            supabase.auth.signInWithPassword.mockRejectedValue(new Error('socket hang up'));

            await expect(login(supabase, 'a@b.com', 'pw')).rejects.toBeInstanceOf(InternalServerError);
        });
    });

    describe('registration', () => {
        it('stores the name in user metadata', async () => {
            const supabase = createFakeSupabase();
            supabase.auth.signUp.mockResolvedValue({ data: { user: {} }, error: null });

            await registration(supabase, 'a@b.com', 'pw', 'Abir');

            expect(supabase.auth.signUp).toHaveBeenCalledWith({
                email: 'a@b.com',
                password: 'pw',
                options: { data: { name: 'Abir' } },
            });
        });

        it.each([
            [400, ValidationError],
            [422, ValidationError],
            [429, TooManyRequestsError],
            [500, ExternalAPIError],
        ])('maps a Supabase %i error to %p', async (status, ErrorType) => {
            const supabase = createFakeSupabase();
            supabase.auth.signUp.mockResolvedValue({ data: {}, error: { status } });

            await expect(registration(supabase, 'a@b.com', 'pw', 'Abir')).rejects.toBeInstanceOf(ErrorType);
        });
    });

    describe('signout', () => {
        it('resolves when Supabase signs out cleanly', async () => {
            const supabase = createFakeSupabase();
            await expect(signout(supabase)).resolves.toBeUndefined();
        });

        it('throws ExternalAPIError when Supabase reports an error', async () => {
            const supabase = createFakeSupabase();
            supabase.auth.signOut.mockResolvedValue({ error: { status: 500 } });

            await expect(signout(supabase)).rejects.toBeInstanceOf(ExternalAPIError);
        });
    });

    describe('getUser', () => {
        it('returns the display name of the signed-in user', async () => {
            const supabase = createFakeSupabase({ user: { id: 'u1', user_metadata: { name: 'Abir' } } });
            await expect(getUser(supabase)).resolves.toBe('Abir');
        });

        it('returns null when there is no session', async () => {
            const supabase = createFakeSupabase({ user: null, userError: { status: 400 } });
            await expect(getUser(supabase)).resolves.toBeNull();
        });

        it('throws ExternalAPIError on non-session Supabase errors', async () => {
            const supabase = createFakeSupabase({ user: null, userError: { status: 500 } });
            await expect(getUser(supabase)).rejects.toBeInstanceOf(ExternalAPIError);
        });
    });
});
