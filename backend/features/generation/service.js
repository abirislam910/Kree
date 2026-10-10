const { ValidationError, TooManyRequestsError, InternalServerError, ExternalAPIError } = require('../../core/errorTypes.js');
const axios = require('axios');

async function generateImage (prompt) {
    if (!prompt) {
        throw new ValidationError('Invalid prompt');
    }
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/images/generations', 
        {
          "prompt": prompt,
          "n": 1,
          "size": "1536x1024",
          "model": "gpt-image-1.5",
          "quality": "high",
          "output_format": "png",
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return Buffer.from(response.data.data[0].b64_json, 'base64');
    } catch (error) {
        if (error.response?.status) {
            if (error.response.status === 400) {
                throw new ValidationError('Invalid prompt while generating image', { cause: error });
            }
            else if (error.response.status === 401) {
                throw new InternalServerError('Error generating image', { cause: error });
            }
            else if (error.response.status === 429) {
                if (error.response.headers['x-ratelimit-remaining-requests'] === '0') {
                    throw new TooManyRequestsError(`Rate limit exceeded while generating image. Try again in ${error.response.headers['x-ratelimit-reset-requests']}`, { cause: error });
                }
                else if (error.response.headers['x-ratelimit-remaining-tokens'] === '0') {
                    throw new TooManyRequestsError(`Rate limit exceeded while generating image. Try again in ${error.response.headers['x-ratelimit-reset-tokens']}`, { cause: error });
                }
                else {
                    throw new TooManyRequestsError(`Rate limit exceeded while generating image`, { cause: error });
                }
            }
            
            else {
                throw new ExternalAPIError('OpenAI service error while generating image', { cause: error });
            }
            
        }
        else if (error.request) {
            throw new ExternalAPIError('Error connecting to external API', { cause: error });
        }
        else {
            throw new InternalServerError('Error generating image', { cause: error });
        }
    }
}

async function generateMusic (prompt) {
    if (!prompt) {
        throw new ValidationError('Invalid prompt');
    }
    try {
      const generate_response = await axios.post(
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

      return Buffer.from(generate_response.data);
    } catch (error) {
        if (error.response?.status) {
            if (error.response.status === 400) {
                throw new ValidationError('Invalid prompt while generating music', { cause: error });
            }
            else if (error.response.status === 401) {
                throw new InternalServerError('Error generating music', { cause: error });
            }
            else if (error.response.status === 429) {
                throw new TooManyRequestsError('Rate limit exceeded while generating music', { cause: error });
            }
            else {
                throw new ExternalAPIError('ElevenLabs service error while generating music', { cause: error });
            }
            
        }
        else if (error.request) {
            throw new ExternalAPIError('Error connecting to external API', { cause: error });
        }
        else {
            throw new InternalServerError('Error generating music', { cause: error });
        }
    }
}

module.exports = {
    generateImage,
    generateMusic,
}