import { createContext, useState } from 'react';
import axios from "axios";

export const ContentContext = createContext();

export function ContentProvider({ children }) {
  const [imageData, setImageData] = useState(null);
  const [audioBuffer, setAudioBuffer] = useState(null);

  const fetchImage = async (location) => {

    if (!location.trim()) {
      throw new Error('Location cannot be empty');
    }

    try {
      const fullPrompt = "Cartoonish, lo-fi illustration of a cozy interior scene inspired by " + location + ". Warm ambient lighting, golden hour glow, soft shadows, gentle depth of field. Aesthetic clutter: plants, books, textured fabrics, warm lamps, anything that fits the specified location:" + location + ". Calm, nostalgic, peaceful mood. Soft grain, muted but colorful palette.";

      const response = await axios.post(`${process.env.REACT_APP_API_URL}/generate/image`, {
        prompt: fullPrompt,
      }
       , {
          responseType: 'blob',
        });

      return response.data;
    }
    catch (err) {
      console.log(err);
    }
  };

  const fetchAudio = async (location) => {
    
    if (!location.trim()) {
      throw new Error('Location cannot be empty');
    }

    try {
      const fullPrompt = "Chill lo-fi instrumental track, 70-85 BPM. Warm vinyl texture, soft tape saturation, subtle crackle. Instruments inspired by" + location + ". Dreamy electric piano chords, mellow bassline, soft boom-bap drums"

      const response = await axios.post(`${process.env.REACT_APP_API_URL}/generate/music`, 
        {
          prompt: fullPrompt,
        },
        {
          responseType: "arraybuffer",
        }
      );

      return response.data;
    }
    catch (err) {
      console.log(err);
    }
  };

  const generateContent = async (location) => {
    const [image, audio] = await Promise.all([fetchImage(location), fetchAudio(location)]);
    setAudioBuffer(audio);
    setImageData(image);
  };

  return (
    <ContentContext.Provider value={{ imageData, setImageData, fetchImage, audioBuffer, setAudioBuffer, fetchAudio, generateContent }}>
      {children}
    </ContentContext.Provider>
  );
};

export default ContentProvider;