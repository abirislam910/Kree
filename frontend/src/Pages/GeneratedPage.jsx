import React, { useState, useContext, useEffect } from "react";
import Header from './Header.jsx';
import { UserContext } from './UserContext.jsx';
import { ContentContext } from './ContentContext.jsx';
import axios from "axios";
import { FaGear, FaVolumeHigh, FaVolumeXmark } from "react-icons/fa6";
import '../App.css'
import { useNavigate } from "react-router-dom";

const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const gainNode = audioContext.createGain();
let source = audioContext.createBufferSource();

function GeneratedPage() {
  const { user } = useContext(UserContext);
  const [message, setMessage] = useState("");
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [volume, setVolume] = useState(0);
  const [volumeStore, setVolumeStore] = useState(0);
  const [error, setError] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  const { imageData, setImageData, audioBuffer, setAudioBuffer, location, setLocation } = useContext(ContentContext);

  useEffect(() => {
    gainNode.connect(audioContext.destination);
    gainNode.gain.setTargetAtTime(
      volume,
      audioContext.currentTime,
      0.01
    );

    const slider = document.getElementById("volume-slider");

    const percent = volume * 1000;

    slider.style.background = `linear-gradient(
      to right,
      white 0%,
      white ${percent}%,
      #3C151C ${percent}%,
      #3C151C 100%
    )`;
  }, [volume]);

  useEffect(() => {
  const handleBeforeUnload = (e) => {
    e.preventDefault();
    e.returnValue = '';
  };

  window.addEventListener('beforeunload', handleBeforeUnload);

  return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
      const loadGeneration = async () => {
        await audioContext.resume();
        const audioCopy = audioBuffer.slice(0);
        audioContext.decodeAudioData(audioCopy, (decodedData) => {
          source.buffer = decodedData;
          source.loop = true;
          setVolume(0.1);
          gainNode.gain.value = volume;
          source.connect(gainNode);
          gainNode.connect(audioContext.destination);
        source.start();
      });
      };
      loadGeneration(); 
  }, []);

  useEffect(() => {
    if (!imageData) {
      navigate("/");
    }
  }, [imageData]);

  const handleInputChange = (e) => {
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
      const fullPrompt = "Ultra-detailed lofi illustration of a cozy interior scene inspired by " + location + ". Warm ambient lighting, golden hour glow, soft shadows, gentle depth of field. Aesthetic clutter: plants, books, textured fabrics, warm lamps, anything that fits the specified location:" + location + ". Calm, nostalgic, peaceful mood. Soft grain, muted but colorful palette.";

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

      //const buffer = await audioContext.decodeAudioData(response.data);
      source.stop();
      source.disconnect();

      const newSource = audioContext.createBufferSource();

      audioContext.decodeAudioData(response.data, (decodedData) => {
          newSource.buffer = decodedData;
          newSource.loop = true;
          setVolume(0.1);
          gainNode.gain.value = volume;
          newSource.connect(gainNode);
          gainNode.connect(audioContext.destination);
        newSource.start();
      });
      source = newSource;
      setAudioBuffer(response.data);
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

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    await Promise.all([fetchImage(), fetchMusic()]);
    setLoading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
  }

  const handleDownload = () => {
    if (!imageData) return;

    const link = document.createElement('a');
    link.href = `${imageData}`;
    link.download = 'generated-image.png';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpload = async () => {
    try {
      console.log("Audio Buffer: ", audioBuffer);
      
      var fd = new FormData();
      fd.append('audioData', new Blob([audioBuffer], { type: 'audio/mpeg' }), 'audio.mp3');
      fd.append('imageData', imageData, 'image.png');
      fd.append('location', location);


      const contentUpload = async () => {await axios.post(`${process.env.REACT_APP_API_URL}/collection`, fd, { withCredentials: true })};

      await contentUpload();

      setMessage(" Successful!");
    } catch (err) {
      console.error('Error uploading:', err);
    }
  }

  const handleVolumeChange = (e) => {
    setVolume(e.target.value);
    if (e.target.value == 0) {
      setVolumeStore(e.target.value);
    }
  }

  const handleMute = () => {
    if (volume > 0) {
      setVolumeStore(volume);
      setVolume(0);
    } else {
      setVolume(volumeStore);
    }
  }

  const toggleSettings = () => {
    setSettingsVisible(!settingsVisible);
    const button = document.getElementById("settings-button");

    button.className = 'gear-rotation';

    setTimeout(() => {
      button.className = '';
    }, 500);
  }

    return (
      <>
        <Header user={user} image={imageData ? true : false}/>
        <div
            className="fullscreen-background"
            style={{ backgroundImage: `url(${imageData})` }}
            >
              <div className="secondinput-form" >
                <button onClick={toggleSettings} className='expand-button'>
                  <div id='settings-button' style={{height: '24px'}}>
                    <FaGear />
                  </div>
                </button>
                  <div style={{visibility: settingsVisible ? 'visible':'hidden', marginBottom: '-3px', display: 'flex'}}>
                    <form onSubmit={handleGenerate}>
                      <div className={`expandable-button ${isExpanded ? 'expanded' : ''}`}>
                      {isExpanded ? (
                          <>
                          <button type="button" className='expand-button' onClick={handleButtonClick} style={{color: '#5C3317'}}>X</button>
                          <input
                              type="text"
                              value={location}
                              onChange={handleInputChange}
                              placeholder="Describe a location..."
                              className="input-field"
                              style={{
                                minHeight: '4vw',
                                width: '50vw',
                                }}
                          />
                            <button type="submit" className="secondsubmit-button" disabled={loading} style={{
                            minHeight: '4vw',
                            width: '25vw',
                          }}>
                              {loading ? 'Generating...' : error ? 'Failed. Try Again!' : 'Generate New Image'}
                          </button>
                          </>
                      ) : (
                          <button type="button" onClick={handleButtonClick} className="expand-button">
                            <strong>Search</strong>
                          </button>
                      )}
                      </div>
                      </form>
                    <button onClick={handleDownload} type="button" className="expand-button" style={{ display: isExpanded ? "none" : "block"}}>
                      <strong>Download</strong>
                    </button>
                    {user && (
                      <>
                      <button onClick={handleUpload} type="button" className="expand-button" style={{ display: isExpanded ? "none" : "block"}}>
                        <strong>Upload</strong>
                      </button>
                      </>
                    )}

                    <button onClick={handleMute} className='expand-button' style={{marginBottom: '-2px', display: isExpanded ? "none" : "block", textShadow: '0 0 5px black'}}> {volume == 0 ? (<FaVolumeXmark />): (<FaVolumeHigh />)}</button>
                    <input
                      type="range"
                      min="0"
                      max="0.1"
                      step="any"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="volume-slider"
                      style={{ display: isExpanded ? "none" : "block"}}
                      id="volume-slider"
                    />
                  <div/>
              </div>
            </div>
        </div>
      </>
      )
}

export default GeneratedPage;