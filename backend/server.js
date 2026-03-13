const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { decode } = require('base64-arraybuffer');
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
app.use(express.json());

console.log(ORIGIN);

app.post('/api/generate-image', async (req, res) => {
    const { prompt } = req.body;
  
    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }
  
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
          "response_format": "b64_json",
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const imageData = response.data.data[0].b64_json;
  
      return res.json({ imageData });
    } catch (error) {
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

      console.log(generate_response);
      console.log(generate_response.data);

      res.setHeader('Content-Type', 'audio/mpeg');
      res.send(Buffer.from(generate_response.data));
  
    } catch (error) {
      console.error('Error generating task:', error);
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
        return res.status(404).json({ message: 'User not found' });
      }
      else {
        console.log("User found");
        res.send(user.user_metadata.name);
      }
    } catch (error) {
      console.error('Error retrieving user: ', error);
      res.status(500).json({ message: 'Error retrieving user: ', error });
    }
  });

  app.post('/api/uploadimage', async (req, res) => { 
    try {
      const supabase = createClient({ req, res })
      const {imageData} = req.body;

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

      const { error: uploadError } = await supabase.storage.from('generated_images').upload(`${user.id}/image${list.length + 1}.png`, decode(imageData), {
        contentType: 'image/png',
        cacheControl: '3600',
      });

      console.log("Image uploaded successfully");

      res.sendStatus(200);
    } catch (uploadError) {
      console.error('Error uploading image: ', uploadError);
      res.status(500).json({ message: 'Error uploading image: ', uploadError });
    }
  });

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
