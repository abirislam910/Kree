const express = require('express');
const dotenv = require('dotenv');
const app = express();
dotenv.config();
const axios = require('axios');
const corsConfig = require('./core/middleware/corsConfig.js');
const requestLogger = require('./core/middleware/requestLogger.js');
const cookieParser = require('cookie-parser');
const authRoutes = require('./features/auth/routes.js');
const collectionRoutes = require('./features/collection/routes.js');
const errorHandler = require('./core/middleware/errorHandler.js');

app.use(cookieParser());
app.use(corsConfig);
app.use(requestLogger);
app.use(express.json({ limit: '50mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/collection', collectionRoutes);

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

app.use(errorHandler);

module.exports = app;