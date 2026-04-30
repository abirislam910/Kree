const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const multer  = require('multer')
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })
const crypto = require('crypto');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { createClient } = require("./lib/supabase.js");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const ORIGIN = process.env.FRONTEND_URL || 'http://localhost:3000';

app.use((req, res, next) => {
  console.log(`Incoming Request: ${req.method} ${req.url}`);
  next();
});  

app.use(cookieParser());

app.use(cors({
    credentials: true,
    allowedHeaders: ['Authorization', 'Content-Type'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    origin: ORIGIN,
  }));

  app.options('*', (req, res) => {
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.set('Access-Control-Allow-Credentials', 'true');
    res.status(200).send();
});
app.use(express.json({ limit: '50mb' }));

app.post('/api/generate/image', async (req, res) => {
    const { prompt } = req.body;
  
    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }

    console.log("Beginning image generation with prompt: ", prompt);
  
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/images/generations', 
        {
          "prompt": prompt,
          "n": 1,
          "size": "1792x1024",
          "model": "dall-e-3",
          "quality": "hd",
          "style": "vivid",
          "response_format": "url",
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log("Image URL response received: ", response.data);

      const imageURL = response.data.data[0].url;

      const imageData = await axios.get(imageURL, { responseType: 'arraybuffer' });

      console.log("Image data retrieved successfully");
  
      res.setHeader('Content-Type', 'image/png');
      res.send(Buffer.from(imageData.data));
    } catch (error) {
      console.error('Error generating image: ', error);
      console.error("STATUS:", error.response?.status);
      console.error("HEADERS:", error.response?.headers);
      console.error("DATA:", error.response?.data);
      res.status(500).json({ message: 'Error generating image: ', error });
    }
  });

app.post('/api/generate/music', async (req, res) => {
    const { prompt } = req.body;
  
    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }
    try {
      const generate_response = await axios.post(
        `https://api.elevenlabs.io/v1/music`,
        {
          "prompt": prompt,
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

      console.log("Music data retrieved successfully");

      res.setHeader('Content-Type', 'audio/mpeg');
      res.send(Buffer.from(generate_response.data));
  
    } catch (error) {
      console.error('Error generating task:', error);
      console.error("STATUS:", error.response?.status);
      console.error("HEADERS:", error.response?.headers);
      console.error("MESSAGE:", error.response?.message);
      console.error("DATA:", error.response?.data);
      res.status(500).json({ message: 'Error generating task: ', error });
    }
  });

  app.post('/api/login', async (req, res) => {
    const {email, password} = req.body;    
    try {
      const supabase = createClient({ req, res })

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      })
      res.send(data.session.user.user_metadata.name);
      console.log("login successful");
      
    } catch (error) {
      console.error('Error logging in:', error);
      res.status(500).json({ message: 'Error logging in: ', error });
    }
  });

  app.post('/api/registration', async (req, res) => {
    const {email, password, name} = req.body;    
    try {
      const supabase = createClient({ req, res })

      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            name: name
          }
        }
      })
      console.log("Registration successful");
      res.sendStatus(200);
    } catch (error) {
      console.error('Error registering: ', error);
      res.status(500).json({ message: 'Error registering: ', error });
    }
  });

  app.post('/api/signout', async (req, res) => { 
    try {
      const supabase = createClient({ req, res })

      const { error } = await supabase.auth.signOut()
      console.log("Signout successful");
      res.sendStatus(200);
    } catch (error) {
      console.error('Error signing out: ', error);
      res.status(500).json({ message: 'Error signing out: ', error });
    }
  });

  app.get('/api/user', async (req, res) => { 
    try {
      const supabase = createClient({ req, res })

      const { data: { user } } = await supabase.auth.getUser()

      console.log("Call retrieved successfully");
      if (!user) {
        console.log("User not found");
        return res.status(204).json({ user: null });
      }
      else {
        console.log("User found");
        res.json({ user: user.user_metadata.name });
      }
    } catch (error) {
      console.error('Error retrieving user: ', error);
      res.status(500).json({ message: 'Error retrieving user: ', error });
    }
  });

  app.post('/api/collection', upload.fields([{ name: 'imageData', maxCount: 1 }, { name: 'audioData', maxCount: 1 }]), async (req, res) => { 
    try {
      const supabase = createClient({ req, res })
      const location = req.body.location;
      const imageData = req.files['imageData'][0].buffer;
      const audioData = req.files['audioData'][0].buffer;

      console.log("Image Data Received: ", imageData);
      console.log("Audio Data Received: ", audioData);
      console.log("Location Received: ", location);

      const { data: { user } } = await supabase.auth.getUser()

      console.log("GetUser called successfully");
      if (!user) {
        console.log("User not found");
        return res.status(404).json({ message: 'User not found' });
      }

      console.log("User found, proceeding with upload");

      const uuid = crypto.randomUUID();

      const { error: imageError } = await supabase.storage.from('generated_images').upload(`${user.id}/image_${uuid}.png`, imageData, {
        contentType: 'image/png',
        cacheControl: '3600',
      });

      if (imageError) {
        console.error('Error uploading image: ', imageError);
        return res.status(500).json({ message: 'Error uploading image: ', imageError });
      }

      const { error: audioError } = await supabase.storage.from('generated_audio').upload(`${user.id}/audio_${uuid}.mp3`, audioData, {
        contentType: 'audio/mpeg',
        cacheControl: '3600',
      });

      if (audioError) {
        console.error('Error uploading audio: ', audioError);
        return res.status(500).json({ message: 'Error uploading audio: ', audioError });
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
        console.error('Error inserting into database: ', dBError);
        return res.status(500).json({ message: 'Error inserting into database: ', dBError });
      }

      console.log("Database entry created successfully");

      res.sendStatus(200);
      } catch (err) {
        console.error('Error uploading image and audio: ', err);
        res.status(500).json({ message: 'Error uploading image and audio: ', err });
    }
  });

  app.get('/api/collection', async (req, res) => { 
    try {
      const supabase = createClient({ req, res })

      const { data: { user } } = await supabase.auth.getUser()

      console.log("GetUser called successfully");
      if (!user) {
        console.log("User not found");
        return res.status(404).json({ message: 'User not found' });
      }

      console.log("User found, proceeding with download");

      const { data: list, error: listError } = await supabase
        .from('User_Content')
        .select('id, location, image_path, audio_path')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (listError) {
        console.error('Error listing images: ', listError);
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

      res.status(200).send(collection);
    } catch (error) {
      console.error('Error retrieving collection: ', error);
      res.status(500).json({ message: 'Error retrieving collection: ', error });
    }
  });

  app.delete('/api/collection/:id', async (req, res) => {
    const contentId = req.params.id;
    try {
      const supabase = createClient({ req, res })

      const { data: { user } } = await supabase.auth.getUser()

      console.log("GetUser called successfully");
      if (!user) {
        console.log("User not found");
        return res.status(404).json({ message: 'User not found' });
      }

      console.log("User found, proceeding with deletion");

      const { data, error } = await supabase
        .from('User_Content')
        .select('image_path, audio_path')
        .eq('id', contentId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error retrieving content: ', error);
        return res.status(500).json({ message: 'Error retrieving content: ', error });
      }

      if (!data) {
        console.log("Content not found");
        return res.status(404).json({ message: 'Content not found' });
      }

      const { error: imageError } = await supabase.storage.from('generated_images').remove([data.image_path]);
      const { error: audioError } = await supabase.storage.from('generated_audio').remove([data.audio_path]);

      if (imageError) {
        console.error('Error deleting image: ', imageError);
        return res.status(500).json({ message: 'Error deleting image: ', imageError });
      }

      if (audioError) {
        console.error('Error deleting audio: ', audioError);
        return res.status(500).json({ message: 'Error deleting audio: ', audioError });
      }

      const { error: dbError } = await supabase
        .from('User_Content')
        .delete()
        .eq('id', contentId)
        .eq('user_id', user.id);

      if (dbError) {
        console.error('Error deleting database entry: ', dbError);
        return res.status(500).json({ message: 'Error deleting database entry: ', dbError });
      }

      console.log("Content deleted successfully");

      res.sendStatus(200);
    } catch (error) {
      console.error('Error deleting content: ', error);
      res.status(500).json({ message: 'Error deleting content: ', error });
    }
  });

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});