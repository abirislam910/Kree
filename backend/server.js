const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const multer  = require('multer')
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })
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
    methods: ['GET', 'POST', 'OPTIONS'],
    origin: ORIGIN,
  }));

  app.options('*', (req, res) => {
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.set('Access-Control-Allow-Credentials', 'true');
    res.status(200).send();
});
app.use(express.json({ limit: '50mb' }));

app.post('/api/generate-image', async (req, res) => {
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

app.post('/api/generate-music', async (req, res) => {
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

  app.post('/api/getuser', async (req, res) => { 
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

  app.post('/api/uploadimage', upload.single('imageData'), async (req, res) => { 
    try {
      const supabase = createClient({ req, res })
      const location = req.body.location;
      const imageData = req.file.buffer;
      
      console.log("Image Data Received: ", imageData);
      console.log("Location Received: ", location);

      const { data: { user } } = await supabase.auth.getUser()

      console.log("GetUser called successfully");
      if (!user) {
        console.log("User not found");
        return res.status(404).json({ message: 'User not found' });
      }

      console.log("User found, proceeding with upload");

      const { data: list, error: listError } = await supabase
        .storage
        .from('generated_images')
        .list(user.id, {
            search: 'image',
        })

      if (listError) {
        console.error('Error listing images: ', listError);
      }

      console.log("Image Data: ", imageData);

      const { error: imageError } = await supabase.storage.from('generated_images').upload(`${user.id}/image${list.length + 1}.png`, imageData, {
        contentType: 'image/png',
        cacheControl: '3600',
        metadata: {'location': location},
      });
      
      console.log("Image uploaded successfully");

      res.sendStatus(200);
      } catch (uploadError) {
        console.error('Error uploading image: ', uploadError);
        res.status(500).json({ message: 'Error uploading image: ', uploadError });
    }
  });

  app.post('/api/uploadaudio', upload.single('audioData'), async (req, res) => { 
    try {
      const supabase = createClient({ req, res })
      const audioData = req.file.buffer;

      console.log("Audio Data Received: ", audioData);

      const { data: { user } } = await supabase.auth.getUser()

      console.log("GetUser called successfully");
      if (!user) {
        console.log("User not found");
        return res.status(404).json({ message: 'User not found' });
      }

      console.log("User found, proceeding with upload");

      const { data: list, error: listError } = await supabase
        .storage
        .from('generated_audio')
        .list(user.id, {
            search: 'audio',
        })

      if (listError) {
        console.error('Error listing audio: ', listError);
      }

      console.log("Audio Data: ", audioData);

      const { error: audioError } = await supabase.storage.from('generated_audio').upload(`${user.id}/audio${list.length + 1}.mp3`, audioData, {
        contentType: 'audio/mpeg',
        cacheControl: '3600',
      });

      console.log("Audio uploaded successfully");

      res.sendStatus(200);
      } catch (uploadError) {
        console.error('Error uploading audio: ', uploadError);
        res.status(500).json({ message: 'Error uploading audio: ', uploadError });
    }
  });

  app.post('/api/getcollection', async (req, res) => { 
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
        .storage
        .from('generated_images')
        .list(user.id, {
            search: 'image',
        })

      if (listError) {
        console.error('Error listing images: ', listError);
      }

      const collection = [];

      for (const item of list) {
        const name = item.name
        console.log("Processing item: ", name);

        const { data: location, error: locationError } = await supabase.storage
          .from('generated_images')
          .info(`${user.id}/${item.name}`);

        const { data: imageURL } = supabase
          .storage
          .from('generated_images')
          .getPublicUrl(`${user.id}/image${name.charAt(5)}.png`, {
          })

        const { data: audioURL } = supabase
          .storage
          .from('generated_audio')
          .getPublicUrl(`${user.id}/audio${name.charAt(5)}.mp3`, {
          })

        collection.push({ location: location.metadata.location, audioUrl: audioURL.publicUrl, imageURL: imageURL.publicUrl });
      }

      res.status(200).send(collection);
    } catch (error) {
      console.error('Error retrieving collection: ', error);
      res.status(500).json({ message: 'Error retrieving collection: ', error });
    }
  });

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});