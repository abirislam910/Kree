import { ValidationError } from '../../core/errorTypes.js';
import { readString } from '../../lib/guards.js';
import type { LoginCredentials, RegistrationDetails } from '../../lib/types.js';

export function parseLoginBody (body: unknown): LoginCredentials {
    const email = readString(body, 'email');
    const password = readString(body, 'password');

    if (!email || !password) {
        throw new ValidationError('Email and password are required');
    }

    return { email, password };
}

export function parseRegistrationBody (body: unknown): RegistrationDetails {
    const { email, password } = parseLoginBody(body);
    const name = readString(body, 'name');

    if (!name) {
        throw new ValidationError('Name is required');
    }

    return { email, password, name };
}
