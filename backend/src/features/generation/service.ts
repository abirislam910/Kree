import axios from 'axios';
import { ValidationError, TooManyRequestsError, InternalServerError, ExternalAPIError } from '../../core/errorTypes.js';
import { isRecord } from '../../lib/guards.js';
import type { GenerationService } from '../../lib/types.js';

// OpenAI returns { data: [{ b64_json: string }] } for GPT image models.
function readImageBase64 (body: unknown): string | undefined {
    if (!isRecord(body) || !Array.isArray(body['data'])) {
        return undefined;
    }
    const [first]: unknown[] = body['data'];
    const b64 = isRecord(first) ? first['b64_json'] : undefined;
    return typeof b64 === 'string' ? b64 : undefined;
}

export async function generateImage (prompt: string | undefined): Promise<Buffer> {
    if (!prompt) {
        throw new ValidationError('Invalid prompt');
    }
    try {
      const response = await axios.post<unknown>(
        'https://api.openai.com/v1/images/generations',
        {
          "prompt": prompt,
          "n": 1,
          "size": "1536x1024",
          "model": "gpt-image-2.5-sunburst",
          "quality": "medium",
          "output_format": "png",
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const b64 = readImageBase64(response.data);
      if (!b64) {
        throw new ExternalAPIError('Unexpected response from OpenAI while generating image');
      }

      return Buffer.from(b64, 'base64');
    } catch (error) {
        if (error instanceof ExternalAPIError) {
            throw error;
        }
        if (axios.isAxiosError(error) && error.response) {
            const { status, headers } = error.response;
            if (status === 400) {
                throw new ValidationError('Invalid prompt while generating image', { cause: error });
            }
            else if (status === 401) {
                throw new InternalServerError('Error generating image', { cause: error });
            }
            else if (status === 429) {
                if (headers['x-ratelimit-remaining-requests'] === '0') {
                    throw new TooManyRequestsError(`Rate limit exceeded while generating image. Try again in ${String(headers['x-ratelimit-reset-requests'])}`, { cause: error });
                }
                else if (headers['x-ratelimit-remaining-tokens'] === '0') {
                    throw new TooManyRequestsError(`Rate limit exceeded while generating image. Try again in ${String(headers['x-ratelimit-reset-tokens'])}`, { cause: error });
                }
                else {
                    throw new TooManyRequestsError(`Rate limit exceeded while generating image`, { cause: error });
                }
            }
            else {
                throw new ExternalAPIError('OpenAI service error while generating image', { cause: error });
            }
        }
        else if (axios.isAxiosError(error) && error.request) {
            throw new ExternalAPIError('Error connecting to external API', { cause: error });
        }
        else {
            throw new InternalServerError('Error generating image', { cause: error });
        }
    }
}

export async function generateMusic (prompt: string | undefined): Promise<Buffer> {
    if (!prompt) {
        throw new ValidationError('Invalid prompt');
    }
    try {
      const generate_response = await axios.post<unknown>(
        `https://api.elevenlabs.io/v1/music`,
        {
          "prompt": prompt,
          "model_id": "music_v2_5",
          "music_length_ms": 30000,
          "force_instrumental": true,
       },
        {
          headers: {
            'xi-api-key': `${process.env.ELEVEN_API_KEY}`,
          },
          responseType: 'arraybuffer',
        }
      );

      // With responseType 'arraybuffer', axios yields a Buffer in Node.
      const { data } = generate_response;
      if (data instanceof Uint8Array) {
        return Buffer.from(data);
      }
      if (data instanceof ArrayBuffer) {
        return Buffer.from(data);
      }
      throw new ExternalAPIError('Unexpected response from ElevenLabs while generating music');
    } catch (error) {
        if (error instanceof ExternalAPIError) {
            throw error;
        }
        if (axios.isAxiosError(error) && error.response) {
            const { status } = error.response;
            if (status === 400) {
                throw new ValidationError('Invalid prompt while generating music', { cause: error });
            }
            else if (status === 401) {
                throw new InternalServerError('Error generating music', { cause: error });
            }
            else if (status === 429) {
                throw new TooManyRequestsError('Rate limit exceeded while generating music', { cause: error });
            }
            else {
                throw new ExternalAPIError('ElevenLabs service error while generating music', { cause: error });
            }
        }
        else if (axios.isAxiosError(error) && error.request) {
            throw new ExternalAPIError('Error connecting to external API', { cause: error });
        }
        else {
            throw new InternalServerError('Error generating music', { cause: error });
        }
    }
}

export const generationService: GenerationService = {
    generateImage,
    generateMusic,
};
