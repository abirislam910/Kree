import { useState, useContext, useEffect, useRef } from "react";
import { UserContext } from './UserContext.jsx';
import { ContentContext } from './ContentContext.jsx';
import axios from "axios";
import { FaGear, FaVolumeHigh, FaVolumeXmark } from "react-icons/fa6";
import '../App.css'
import { useLocation, useNavigate } from "react-router-dom";
import { audioContext, unlockAudio } from '../audio.js';

function GeneratedPage() {
  const { user } = useContext(UserContext);
  const [message, setMessage] = useState("");
  const [uploadLock, setUploadLock] = useState(false);
  const [imageURL, setImageURL] = useState(null);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [volume, setVolume] = useState(1);
  const [volumeStore, setVolumeStore] = useState(0);
  const [error, setError] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  const gainNode = useRef(null);

  const locationData = useLocation();

  const [location, setLocation] = useState(locationData.state?.location ? locationData.state.location : '');
  const [collected, setCollected] = useState(locationData.state?.collected ? locationData.state.collected : false);

  const { imageData, audioBuffer, generateContent } = useContext(ContentContext);

  useEffect(() => {
    gainNode.current?.gain.setTargetAtTime(
      volume,
      audioContext.currentTime,
      0.01
    );

    const slider = document.getElementById("volume-slider");

    const percent = volume * 100;

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
  });

  useEffect(() => {
      if (!imageData || !audioBuffer) {
        navigate('/');
        return;
      }

      // Each run owns its own nodes and URL, so cleanup tears down exactly
      // what this run created, even if decoding hasn't finished yet.
      let cancelled = false;
      let source = null;

      const gain = audioContext.createGain();
      gain.gain.value = volume;
      gain.connect(audioContext.destination);
      gainNode.current = gain;

      const url = URL.createObjectURL(imageData);
      setImageURL(url);

      // Don't wait on resume(): in Safari it never settles outside a user
      // gesture. A source started while suspended plays once audio unlocks.
      const loadAudio = () => {
        unlockAudio();

        const audioCopy = audioBuffer.slice(0);
        audioContext.decodeAudioData(audioCopy, (decodedData) => {
          if (cancelled) return;

          source = audioContext.createBufferSource();
          source.buffer = decodedData;
          source.loop = true;
          source.connect(gain);
          source.start();
        }, (err) => {
          console.error('Error decoding audio:', err);
        });
      };

      loadAudio();

      return () => {
        cancelled = true;
        URL.revokeObjectURL(url);
        if (source) {
          source.stop();
        }
        gain.disconnect();
        if (gainNode.current === gain) {
          gainNode.current = null;
        }
      };
  }, [imageData, audioBuffer]);

  const handleInputChange = (e) => {
    setLocation(e.target.value);
  };
  
  const handleButtonClick = () => {
    setIsExpanded(!isExpanded);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    unlockAudio();
    setLoading(true);
    setError('');
    try {
      await generateContent(location);
      setCollected(false);
      setUploadLock(false);
      setMessage("");
    } 
    catch (err) {
      setError('Error generating content. Please try again.');
      console.error(err);
    }
    finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!imageData) return;

    const url = URL.createObjectURL(imageData);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'generated-image.png';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleUpload = async () => {
    setUploadLock(true);
    try {
      setMessage("ing...");
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
      setMessage(" Failed. Try Again!");
      setUploadLock(false);
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
        <div
            className="fullscreen-background"
            style={{ backgroundImage: `url(${imageURL})` }}
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
                            <strong>Prompt</strong>
                          </button>
                      )}
                      </div>
                      </form>
                    <button onClick={handleDownload} type="button" className="expand-button" style={{ display: isExpanded ? "none" : "block"}}>
                      <strong>Download</strong>
                    </button>
                    {user && !collected && (
                      <>
                      <button onClick={handleUpload} disabled={uploadLock} type="button" className="expand-button" style={{ display: isExpanded ? "none" : "block"}}>
                        <strong style={{cursor: uploadLock ? 'not-allowed' : 'pointer'}}>Upload{message}</strong>
                      </button>
                      </>
                    )}

                    <button onClick={handleMute} className='expand-button' style={{marginBottom: '-2px', display: isExpanded ? "none" : "block", textShadow: '0 0 5px black'}}> {volume == 0 ? (<FaVolumeXmark />): (<FaVolumeHigh />)}</button>
                    <input
                      type="range"
                      min="0"
                      max="1"
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
      )
}

export default GeneratedPage;