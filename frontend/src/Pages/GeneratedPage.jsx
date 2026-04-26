import { useState, useContext, useEffect, useRef } from "react";
import { UserContext } from './UserContext.jsx';
import { ContentContext } from './ContentContext.jsx';
import axios from "axios";
import { FaGear, FaVolumeHigh, FaVolumeXmark } from "react-icons/fa6";
import '../App.css'
import { useLocation, useNavigate } from "react-router-dom";

const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function GeneratedPage() {
  const { user } = useContext(UserContext);
  const [message, setMessage] = useState("");
  const [uploadLock, setUploadLock] = useState(false);
  const [imageURL, setImageURL] = useState(null);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [volume, setVolume] = useState(0.1);
  const [volumeStore, setVolumeStore] = useState(0);
  const [error, setError] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  const source = useRef(null);
  const gainNode = useRef(audioContext.createGain());
  const audioStarted = useRef(false);

  const locationData = useLocation();

  const [location, setLocation] = useState(locationData.state?.location ? locationData.state.location : '');

  const { imageData, audioBuffer, generateContent } = useContext(ContentContext);

  useEffect(() => {
    gainNode.current.connect(audioContext.destination);
    gainNode.current.gain.setTargetAtTime(
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
  });

  useEffect(() => {
      const loadImage = () => {
        const url = URL.createObjectURL(imageData);
        setImageURL(url);
        URL.revokeObjectURL(imageData);
      };

      const loadAudio = async () => {
        if (audioStarted.current) {
          source.current.stop();
          gainNode.current.disconnect();
          source.current = null;
          gainNode.current = audioContext.createGain();
        }
        await audioContext.resume();
        const audioCopy = audioBuffer.slice(0);
        audioContext.decodeAudioData(audioCopy, (decodedData) => {
          source.current = audioContext.createBufferSource();
          source.current.buffer = decodedData;
          source.current.loop = true;
          gainNode.current.gain.value = volume;
          source.current.connect(gainNode.current);
          gainNode.current.connect(audioContext.destination);
          source.current.start();
          audioStarted.current = true;
        });
      };
      
      if (imageData && audioBuffer) {
        loadAudio(); 
        loadImage();

        return () => {
          URL.revokeObjectURL(imageURL);
          if (audioStarted.current) {
            source.current.stop();
            gainNode.current.disconnect();
          }
        };
    }
    else {
      navigate('/');
    }
  }, [imageData, audioBuffer]);

  const handleInputChange = (e) => {
    setLocation(e.target.value);
  };
  
  const handleButtonClick = () => {
    setIsExpanded(!isExpanded);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await generateContent(location);
    } 
    catch (err) {
      setError('Error generating content. Please try again.');
      console.error(err);
    }
    setLoading(false);
  };

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
      setUploadLock(true);
      setMessage("ing...");
      var fd = new FormData();
      fd.append('audioData', new Blob([audioBuffer], { type: 'audio/mpeg' }), 'audio.mp3');

      var imageForm = new FormData();
      imageForm.append('imageData', imageData, 'image.png');
      imageForm.append('location', location);


      const imageUpload = async () => {await axios.post(`${process.env.REACT_APP_API_URL}/collection/image`, imageForm, { withCredentials: true })};
      const audioUpload = async () => {await axios.post(`${process.env.REACT_APP_API_URL}/collection/audio`, fd, { withCredentials: true })};

      await Promise.all([imageUpload(), audioUpload()]);

      setMessage(" successful!");
    } catch (err) {
      setUploadLock(false);
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
                      <button onClick={handleUpload} disabled={uploadLock} type="button" className="expand-button" style={{ display: isExpanded ? "none" : "block"}}>
                        <strong style={{cursor: uploadLock ? 'not-allowed' : 'pointer'}}>Upload{message}</strong>
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
      )
}

export default GeneratedPage;