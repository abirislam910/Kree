import React, {useState, useEffect, useContext} from 'react';
import axios from 'axios';
import Header from './Header.jsx';
import { UserContext }  from './UserContext.jsx';
import supabase from "../Supabase/supabaseClient";
import '../App.css';

const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function Home() {

  const [location, setLocation] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [imageData, setImageData] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, setUser } = useContext(UserContext);
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [audioBuffer, setAudioBuffer] = useState(null);

  useEffect(() => {
        getUserData();
    }, []);   

  useEffect(() => {
    if (imageData && audioBuffer) {
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.loop = true;
      source.start(0);
    }
  }, [imageData, audioBuffer]);

    useEffect(() => {
        const handleMouseMove = (event) => {
            const { clientX: x, clientY: y } = event;
            setPosition({ x, y });
        };

        window.addEventListener('mousemove', handleMouseMove);

        return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    const moveStyle = {
        transform: `translate(${-((position.x - window.innerWidth / 2) / 50)}px, ${-((position.y - window.innerHeight / 2) / 50)}px)`,
        transition: 'transform 0.8s ease-out',
        animation: 'fadeIn 1s ease-in-out forwards',
        alignSelf: 'center',
        minWidth: '700px',
        width: '40vw',
      };

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
    const { data, error } = await supabase.auth.getSession()

    if (data.session) {
        console.log(data.session.user.user_metadata.name)
        setUser(data.session.user.user_metadata.name) 
    }
    if (error) {console.log(error)}
  };

  const handleGenerate = (e) => {
    e.preventDefault();
    setLoading(true);
    fetchImage();
    fetchMusic();
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

  const playPause = () => {
    const source = audioContext.createBufferSource();
    if (!isPlaying) {
      source.start();
    } else {
      source.start();
      source.stop();
    }
    setIsPlaying(!isPlaying);
  }

  return (
    <div>
        <Header user={user} image={imageData ? true : false}/>
        <div className="app">
            {user && <h1 className= 'nav-links'>Hello {user}!</h1>}
            <img style={moveStyle} src="./logo.png" alt="Logo"/>
            <h1 className="fade-in-element" style={{
                fontSize: '1.5rem',
                }}>Study In Your Happy Place</h1>
            <form onSubmit={handleGenerate} className="input-form">
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
                <button type="submit" className="submit-button" disabled={loading} style={{
                      minHeight: '4vw',
                      width: '12vw',
                    }}>
                    {loading ? 'Generating...' : 'Generate Image'}
                </button>
            </form>
        </div>

      {error && <p className="error-message">{error}</p>}

      {imageData && (
        <div
            className="fullscreen-background"
            style={{ backgroundImage: `url(data:image/png;base64,${imageData})` }}
            >
            <form className="secondinput-form" onSubmit={handleSubmit}>
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
                    Search
                    </button>
                )}
                </div>
              <button onClick={handleDownload} type="button" className="expand-button" style={{ display: isExpanded ? "none" : "block"}}>
                Download
              </button>
              <button onClick={playPause} type="button" className="expand-button" style={{ display: isExpanded ? "none" : "block"}}>
                {isPlaying ? 'Pause' : 'Play'}
              </button>
            </form>
        </div>
      )}
    </div>
  );
};


export default Home;