// Stand-in for service.ts that returns bundled demo media instead of calling
// OpenAI/ElevenLabs, for local development without API keys or API costs.
import fs from 'fs/promises';
import path from 'path';
import { ValidationError } from '../../core/errorTypes.js';
import type { GenerationService } from '../../lib/types.js';

// backend/fixtures, from both src/features/generation and dist/features/generation.
const FIXTURES_DIR = path.join(__dirname, '../../../fixtures');

function delay (): Promise<void> {
    const ms = Number(process.env.MOCK_GENERATION_DELAY_MS) || 0;
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateImage (prompt: string | undefined): Promise<Buffer> {
    if (!prompt) {
        throw new ValidationError('Invalid prompt');
    }
    await delay();
    return fs.readFile(path.join(FIXTURES_DIR, 'demo-image.png'));
}

export async function generateMusic (prompt: string | undefined): Promise<Buffer> {
    if (!prompt) {
        throw new ValidationError('Invalid prompt');
    }
    await delay();
    return fs.readFile(path.join(FIXTURES_DIR, 'demo-audio.mp3'));
}

export const mockGenerationService: GenerationService = {
    generateImage,
    generateMusic,
};
