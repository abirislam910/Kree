// Stand-in for service.js that returns bundled demo media instead of calling
// OpenAI/ElevenLabs, for local development without API keys or API costs.
const fs = require('fs/promises');
const path = require('path');
const { ValidationError } = require('../../core/errorTypes.js');

const FIXTURES_DIR = path.join(__dirname, '../../fixtures');

function delay () {
    const ms = Number(process.env.MOCK_GENERATION_DELAY_MS) || 0;
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateImage (prompt) {
    if (!prompt) {
        throw new ValidationError('Invalid prompt');
    }
    await delay();
    return fs.readFile(path.join(FIXTURES_DIR, 'demo-image.png'));
}

async function generateMusic (prompt) {
    if (!prompt) {
        throw new ValidationError('Invalid prompt');
    }
    await delay();
    return fs.readFile(path.join(FIXTURES_DIR, 'demo-audio.mp3'));
}

module.exports = {
    generateImage,
    generateMusic,
}
