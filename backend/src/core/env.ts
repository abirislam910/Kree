import { InternalServerError } from './errorTypes.js';

export function requireEnv (name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new InternalServerError(`Missing environment variable ${name}`);
    }
    return value;
}
