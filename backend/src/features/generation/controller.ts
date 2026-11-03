import type { NextFunction, Request, Response } from 'express';
import { generationService } from './service.js';
import { mockGenerationService } from './mockService.js';
import { parsePrompt } from './validators.js';
import type { GenerationService } from '../../lib/types.js';

function useMockGeneration (): boolean {
    if (process.env.MOCK_GENERATION !== 'true') {
        return false;
    }
    if (process.env.NODE_ENV === 'production') {
        console.warn('MOCK_GENERATION is ignored in production');
        return false;
    }
    console.log('MOCK_GENERATION enabled: serving demo image and audio');
    return true;
}

const { generateImage, generateMusic }: GenerationService = useMockGeneration()
    ? mockGenerationService
    : generationService;

export async function generateImageController (req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const imageData = await generateImage(parsePrompt(req.body));
      res.set('Content-Type', 'image/png');
      res.send(imageData);
    } catch (error) {
      return next(error);
    }
};

export async function generateMusicController (req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const musicData = await generateMusic(parsePrompt(req.body));
      res.set('Content-Type', 'audio/mpeg');
      res.send(musicData);
    } catch (error) {
      return next(error);
    }
};
