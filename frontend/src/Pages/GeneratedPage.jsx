import React, { useState, useContext } from "react";
import Header from './Header.jsx';
import { UserContext } from './UserContext.jsx';
import { ContentContext } from './ContentContext.jsx';
import { useNavigate } from "react-router-dom";
import axios from "axios";
import '../App.css'

function GeneratedPage() {
  const navigate = useNavigate();
  const { user, setUser } = useContext(UserContext);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const { imageData, setImageData, audioBuffer, setAudioBuffer } = useContext(ContentContext);
  setImageData('');
  setAudioBuffer(null);

  /*const handleInputChange = (e) => {
    setLocation(e.target.value);
  };

  const fetchImage = async () => {
    setError('');

    if (!location.trim()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const fullPrompt = "Ultra-detailed lofi anime-style illustration of a cozy interior scene inspired by " + location + ". Warm ambient lighting, golden hour glow, soft shadows, gentle depth of field. Aesthetic clutter: plants, books, textured fabrics, warm lamps, anything that fits the specified location:" + location + ". Calm, nostalgic, peaceful mood. Soft grain, muted but colorful palette.";

      const response = await axios.post(`${process.env.REACT_APP_API_URL}/generate-image`, {
        prompt: fullPrompt,
      });

      console.log(response.data);

      setImageData(response.data.imageData);

      console.log(imageData);
    }
    catch (err) {
      setError('Failed to fetch image. Please try again.');
      console.log(err);
      setLoading(false);
    }
  };

  const fetchMusic = async () => {
    setError('');

    if (!location.trim()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const fullPrompt = "Chill lo-fi instrumental track, 70-85 BPM. Warm vinyl texture, soft tape saturation, subtle crackle. Instruments inspired by" + location + ". Dreamy electric piano chords, mellow bassline, soft boom-bap drums"

      await audioContext.resume();

      const response = await axios.post(`${process.env.REACT_APP_API_URL}/generate-music`, 
        {
          prompt: fullPrompt,
        },
        {
          responseType: "arraybuffer",
        }
      );

      const buffer = await audioContext.decodeAudioData(response.data);
      setAudioBuffer(buffer);
    }
    catch (err) {
      setError('Failed to generate music. Please try again.');
      console.log(err);
      setLoading(false);
    }
  };
  
  const handleButtonClick = () => {
    setIsExpanded(!isExpanded);
  };

  const getUserData = async () => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/getuser`, {}, { withCredentials: true });

      setUser(response.data);
    }
    catch (err) {      
      console.log('Error fetching user data:', err);
    }
  };

  const handleGenerate = (e) => {
    e.preventDefault();
    setLoading(true);
    setImageData('iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAIAAADTED8xAAADMElEQVR4nOzVwQnAIBQFQYXff81RUkQCOyDj1YOPnbXWPmeTRef+/3O/OyBjzh3CD95BfqICMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMO0TAAD//2Anhf4QtqobAAAAAElFTkSuQmCC');
    setAudioBuffer("haha");
    //fetchImage();
    //fetchMusic();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
  }

  const handleDownload = () => {
    if (!imageData) return;

    const link = document.createElement('a');
    link.href = `data:image/png;base64,${imageData}`;
    link.download = 'generated-image.png';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpload = async () => {
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/uploadimage`, { imageData: imageData }, { withCredentials: true });
      console.log('Upload successful');
    } catch (err) {
      console.error('Error uploading image:', err);
    }
  }

  const playPause = () => {
    const source = audioContext.createBufferSource();
    if (!isPlaying) {
      source.start();
    } else {
      source.start();
      source.stop();
    }
    setIsPlaying(!isPlaying);
  }*/

    return (
        <div
            className="fullscreen-background"
            style={{ backgroundImage: `url(data:image/png;base64,${imageData})` }}
            >
        </div>
      )
}

export default GeneratedPage;