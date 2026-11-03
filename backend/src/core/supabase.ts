import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr';
import type { Request, Response } from 'express';
import type { Database, KreeSupabaseClient } from '../lib/types.js';
import { requireEnv } from './env.js';

interface RequestContext {
    req: Request;
    res: Response;
}

export function createClient (context: RequestContext): KreeSupabaseClient {
  return createServerClient<Database>(
    requireEnv('SUPABASE_URL'),
    requireEnv('SUPABASE_PUBLISHABLE_KEY'),
    {
      cookies: {
        getAll() {
          return parseCookieHeader(context.req.headers.cookie ?? '')
            .filter((cookie): cookie is { name: string; value: string } => cookie.value !== undefined)
        },

        setAll(cookiesToSet) {
          const cookies = cookiesToSet.map(({ name, value, options }) =>
            serializeCookieHeader(name, value, {
              ...options,
              // The frontend proxies /api through its own domain, so the auth
              // cookie is first-party and Lax works in every browser.
              sameSite: 'lax',
              secure: true,
              path: "/"
            })
          )

          context.res.setHeader("Set-Cookie", cookies)
        }
      }
    }
  )
}
