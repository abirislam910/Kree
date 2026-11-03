import type { NextFunction, Request, Response } from 'express';
import { login, registration, signout, getUser } from './service.js';
import { parseLoginBody, parseRegistrationBody } from './validators.js';
import { createClient } from '../../core/supabase.js';

interface UserResponseBody {
    user: string | null;
}

export async function loginController (req: Request, res: Response<UserResponseBody>, next: NextFunction): Promise<void> {
    try {
      const credentials = parseLoginBody(req.body);
      const supabase = createClient({ req, res });
      const userName = await login(supabase, credentials);
      res.json({ user: userName });
    } catch (error) {
      return next(error);
    }
};

export async function registrationController (req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const details = parseRegistrationBody(req.body);
      const supabase = createClient({ req, res });
      await registration(supabase, details);
      res.sendStatus(200);
    } catch (error) {
      return next(error);
    }
};

export async function signoutController (req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const supabase = createClient({ req, res });
      await signout(supabase);
      res.sendStatus(200);
    } catch (error) {
      return next(error);
    }
};

export async function userController (req: Request, res: Response<UserResponseBody>, next: NextFunction): Promise<void> {
    try {
      const supabase = createClient({ req, res });
      const user = await getUser(supabase);
      res.json({ user: user });
    } catch (error) {
      return next(error);
     }
};
