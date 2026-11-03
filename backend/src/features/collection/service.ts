import crypto from 'crypto';
import { InternalServerError, AppError, ExternalAPIError, NotFoundError, UnauthorizedError } from '../../core/errorTypes.js';
import { requireEnv } from '../../core/env.js';
import type { CollectionItem, CollectionUpload, KreeSupabaseClient } from '../../lib/types.js';

async function requireUserId (supabase: KreeSupabaseClient): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError('User not authenticated');
    }

    return user.id;
}

export async function collectionAdd (supabase: KreeSupabaseClient, { imageData, audioData, location }: CollectionUpload): Promise<void> {
    try {
      const userId = await requireUserId(supabase);

      const uuid = crypto.randomUUID();
      const imagePath = `${userId}/image_${uuid}.png`;
      const audioPath = `${userId}/audio_${uuid}.mp3`;

      const { error: imageError } = await supabase.storage.from('generated_images').upload(imagePath, imageData, {
        contentType: 'image/png',
        cacheControl: '3600',
      });

      if (imageError) {
        throw new ExternalAPIError('Error uploading image', { cause: imageError });
      }

      const { error: audioError } = await supabase.storage.from('generated_audio').upload(audioPath, audioData, {
        contentType: 'audio/mpeg',
        cacheControl: '3600',
      });

      if (audioError) {
        throw new ExternalAPIError('Error uploading audio', { cause: audioError });
      }

      console.log("Image and audio uploaded successfully");

      const { error: dBError } = await supabase.from('User_Content').insert({
        id: uuid,
        user_id: userId,
        location: location,
        image_path: imagePath,
        audio_path: audioPath,
      });

      if (dBError) {
        throw new ExternalAPIError('Error inserting into database', { cause: dBError });
      }

      console.log("Entry created successfully");
    } catch (err) {
        if (err instanceof AppError) {
          throw err
        }
        else {
          throw new InternalServerError('Error Adding to Collection', { cause: err });
        }
    }
};

export async function collectionGet (supabase: KreeSupabaseClient): Promise<CollectionItem[]> {
    try {
      const userId = await requireUserId(supabase);

      const result = await supabase
        .from('User_Content')
        .select('id, location, image_path, audio_path')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (result.error) {
        throw new ExternalAPIError('Error listing collection items', { cause: result.error });
      }

      const storageUrl = `${requireEnv('SUPABASE_URL')}/storage/v1/object/public`;

      return result.data.map((item) => ({
        uuid: item.id,
        location: item.location,
        audioUrl: `${storageUrl}/generated_audio/${item.audio_path}`,
        imageURL: `${storageUrl}/generated_images/${item.image_path}`,
      }));
    } catch (err) {
        if (err instanceof AppError) {
          throw err
        }
        else {
          throw new InternalServerError('Error Getting Collection', { cause: err });
        }
    }
};

export async function collectionDelete (supabase: KreeSupabaseClient, contentId: string): Promise<void> {
    try {
        const userId = await requireUserId(supabase);

        const { data, error } = await supabase
            .from('User_Content')
            .select('image_path, audio_path')
            .eq('id', contentId)
            .eq('user_id', userId)
            .maybeSingle();

        if (error) {
            throw new ExternalAPIError('Error retrieving content for deletion', { cause: error });
        }

        if (!data) {
            throw new NotFoundError('Content not found');
        }

        const { error: imageError } = await supabase.storage.from('generated_images').remove([data.image_path]);
        const { error: audioError } = await supabase.storage.from('generated_audio').remove([data.audio_path]);

        if (imageError) {
            throw new ExternalAPIError('Error deleting image', { cause: imageError });
        }

        if (audioError) {
            throw new ExternalAPIError('Error deleting audio', { cause: audioError });
        }

        const { error: dbError } = await supabase
            .from('User_Content')
            .delete()
            .eq('id', contentId)
            .eq('user_id', userId);

        if (dbError) {
            throw new ExternalAPIError('Error deleting database entry', { cause: dbError });
        }
    } catch (err) {
        if (err instanceof AppError) {
          throw err
        }
        else {
          throw new InternalServerError('Error Deleting Collection', { cause: err });
        }
    }
};
