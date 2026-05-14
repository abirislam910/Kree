const { InternalServerError, AppError, ExternalAPIError, NotFoundError, UnauthorizedError } = require('../../core/errorTypes.js');
const crypto = require('crypto');

async function collectionAdd (supabase, imageData, audioData, location) {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new UnauthorizedError('User not authenticated');
      }
      
      const uuid = crypto.randomUUID();

      const { error: imageError } = await supabase.storage.from('generated_images').upload(`${user.id}/image_${uuid}.png`, imageData, {
        contentType: 'image/png',
        cacheControl: '3600',
      });

      if (imageError) {
        throw new ExternalAPIError('Error uploading image', { cause: imageError });
      }

      const { error: audioError } = await supabase.storage.from('generated_audio').upload(`${user.id}/audio_${uuid}.mp3`, audioData, {
        contentType: 'audio/mpeg',
        cacheControl: '3600',
      });

      if (audioError) {
        throw new ExternalAPIError('Error uploading audio', { cause: audioError });
      }

      console.log("Image and audio uploaded successfully");

      const {error: dBError} = await supabase.from('User_Content').insert({
        id: uuid,
        user_id: user.id,
        location: location,
        image_path: `${user.id}/image_${uuid}.png`,
        audio_path: `${user.id}/audio_${uuid}.mp3`,
      });
      
      if (dBError) {
        throw new ExternalAPIError('Error inserting into database', { cause: dBError });
      }

      console.log("Entry created successfully");
      return;
    } catch (err) {
        if (err instanceof AppError) {
          throw err
        }
        else {          
          throw new InternalServerError('Error Adding to Collection', { cause: err }); 
        }
    }    
};

async function collectionGet (supabase) {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new UnauthorizedError('User not authenticated');
      }

      const { data: list, error: listError } = await supabase
        .from('User_Content')
        .select('id, location, image_path, audio_path')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (listError) {
        throw new ExternalAPIError('Error listing collection items', { cause: listError });
      }

      const collection = [];

      for (const item of list) {
        console.log("Processing item: ", item);

        const { data: imageURL } = supabase
          .storage
          .from('generated_images')
          .getPublicUrl(`${item.image_path}`, {
          })

        const { data: audioURL } = supabase
          .storage
          .from('generated_audio')
          .getPublicUrl(`${item.audio_path}`, {
          })

        collection.push({ uuid: item.id, location: item.location, audioUrl: audioURL.publicUrl, imageURL: imageURL.publicUrl });
      }
      return collection;
    } catch (err) {
        if (err instanceof AppError) {
          throw err
        }
        else {          
          throw new InternalServerError('Error Getting Collection', { cause: err }); 
        }
    }    
};

async function collectionDelete (supabase, contentId) {
        try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            throw new UnauthorizedError('User not authenticated');
        }

        const { data, error } = await supabase
            .from('User_Content')
            .select('image_path, audio_path')
            .eq('id', contentId)
            .eq('user_id', user.id)
            .single();

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
            .eq('user_id', user.id);

        if (dbError) {
            throw new ExternalAPIError('Error deleting database entry', { cause: dbError });
        }
        return;
    } catch (err) {
        if (err instanceof AppError) {
          throw err
        }
        else {          
          throw new InternalServerError('Error Deleting Collection', { cause: err }); 
        }
    }    
};

module.exports = {
    collectionAdd,
    collectionGet,
    collectionDelete
};