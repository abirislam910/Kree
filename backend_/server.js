const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use((req, res, next) => {
  console.log(`Incoming Request: ${req.method} ${req.url}`);
  next();
});  

app.use(cors({
    origin: 'https://kree-app.vercel.app',
  }));

  app.options('*', (req, res) => {
    res.set('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.status(200).send();
});
app.use(express.json());

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
      res.status(500).json({ message: 'Error generating image', error });
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
      res.status(500).json({ message: 'Error generating task', error });
    }
  });

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
