import type { SupabaseClient } from '@supabase/supabase-js';

// ---- Database ----
// Hand-written to match the columns this app uses. Regenerate with
// `supabase gen types typescript` if the schema changes. These must be `type`
// aliases, not interfaces: supabase-js requires rows to be assignable to
// Record<string, unknown>, which interfaces are not.

export type UserContentRow = {
    id: string;
    user_id: string;
    location: string | null;
    image_path: string;
    audio_path: string;
    created_at: string;
};

export type Database = {
    public: {
        Tables: {
            User_Content: {
                Row: UserContentRow;
                Insert: Omit<UserContentRow, 'created_at'> & { created_at?: string };
                Update: Partial<UserContentRow>;
                Relationships: [];
            };
        };
        Views: Record<string, never>;
        Functions: Record<string, never>;
        Enums: Record<string, never>;
        CompositeTypes: Record<string, never>;
    };
};

export type KreeSupabaseClient = SupabaseClient<Database>;

// ---- API payloads ----

export interface CollectionItem {
    uuid: string;
    location: string | null;
    audioUrl: string;
    imageURL: string;
}

export interface CollectionUpload {
    imageData: Buffer;
    audioData: Buffer;
    location: string | null;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegistrationDetails extends LoginCredentials {
    name: string;
}

export interface ErrorResponseBody {
    error: { message: string };
}

// ---- Services ----

export interface GenerationService {
    generateImage(prompt: string | undefined): Promise<Buffer>;
    generateMusic(prompt: string | undefined): Promise<Buffer>;
}
