import { parseLoginBody, parseRegistrationBody } from '../../src/features/auth/validators.js';
import { ValidationError } from '../../src/core/errorTypes.js';

describe('parseLoginBody', () => {
    it('returns the email and password', () => {
        expect(parseLoginBody({ email: 'a@b.com', password: 'pw', extra: true })).toEqual({ email: 'a@b.com', password: 'pw' });
    });

    it.each<[string, unknown]>([
        ['undefined', undefined],
        ['a string', 'a@b.com'],
        ['a missing password', { email: 'a@b.com' }],
        ['a non-string email', { email: 42, password: 'pw' }],
        ['an empty email', { email: '', password: 'pw' }],
    ])('throws ValidationError for %s', (_, body) => {
        expect(() => parseLoginBody(body)).toThrow(ValidationError);
    });
});

describe('parseRegistrationBody', () => {
    it('returns the email, password and name', () => {
        expect(parseRegistrationBody({ email: 'a@b.com', password: 'pw', name: 'Abir' }))
            .toEqual({ email: 'a@b.com', password: 'pw', name: 'Abir' });
    });

    it('throws ValidationError when the name is missing', () => {
        expect(() => parseRegistrationBody({ email: 'a@b.com', password: 'pw' })).toThrow('Name is required');
    });
});
