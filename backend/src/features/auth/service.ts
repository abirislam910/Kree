import type { User } from '@supabase/supabase-js';
import { InternalServerError, AppError, TooManyRequestsError, ExternalAPIError, ValidationError, UnauthorizedError } from '../../core/errorTypes.js';
import type { KreeSupabaseClient, LoginCredentials, RegistrationDetails } from '../../lib/types.js';

function displayName (user: User): string | null {
    // Supabase types user_metadata values as `any`; treat them as unknown.
    const name: unknown = user.user_metadata['name'];
    return typeof name === 'string' ? name : null;
}

export async function login (supabase: KreeSupabaseClient, { email, password }: LoginCredentials): Promise<string | null> {
    try {
      const result = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      })

      if (result.error) {
        throw new UnauthorizedError('Error Logging In', { cause: result.error });
      }

      return displayName(result.data.user);

    } catch (err) {
        if (err instanceof AppError) {
          throw err
        }
        else {
          throw new InternalServerError('Error Logging In', { cause: err });
        }
    }
};

export async function registration (supabase: KreeSupabaseClient, { email, password, name }: RegistrationDetails): Promise<void> {
    try {
      const { error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            name: name
          }
        }
      })
      if (error) {
        if (error.status === 400 || error.status === 422) {
          throw new ValidationError('Error Registering', { cause: error });
        }
        else if (error.status === 429) {
          throw new TooManyRequestsError('Too many registration attempts', { cause: error });
        }
        else {
          throw new ExternalAPIError('Error Registering', { cause: error });
        }

      }
      console.log("Registration successful");
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }
      else {
        throw new InternalServerError('Error Registering', { cause: err });
      }
    }
};

export async function signout (supabase: KreeSupabaseClient): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        throw new ExternalAPIError('Error Signing Out', { cause: error });
      }
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }
      else {
        throw new InternalServerError('Error Signing Out', { cause: err });
      }
    }
};

export async function getUser (supabase: KreeSupabaseClient): Promise<string | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error && error.status !== 400) {
        throw new ExternalAPIError('Error Getting User', { cause: error });
      }

      return user ? displayName(user) : null;
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }
      else {
        throw new InternalServerError('Error Getting User', { cause: err });
      }
    }
};
