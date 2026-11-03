import { readString } from '../../lib/guards.js';

// Returns undefined for a missing or non-string prompt; the generation
// services reject that with a ValidationError.
export function parsePrompt (body: unknown): string | undefined {
    return readString(body, 'prompt');
}
