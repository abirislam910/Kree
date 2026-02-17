import React, {useState, useEffect} from 'react';
import axios from 'axios';
import { Link } from "react-router-dom";
import '../App.css';

//iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==

const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function Home() {

  const [location, setLocation] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [imageData, setImageData] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [audioBuffer, setAudioBuffer] = useState(null);
  
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
        maxWidth: '30vw',
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
      const fullPrompt = "A cozy, colorful landscape image that transports a person to the interior of " + location + 
        ", with cozy details and a lively setting, resembling the background of a lofi youtube video"

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
      const fullPrompt = "Lo-fi track that captures distinct elements of a particular location, specifically: " + location;

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
    <div className="app">
        <div>
        <Link to="/login">blah</Link>
        <Link to="/registration">bloo</Link>
        <img style={moveStyle} src="./logo.png" alt="Logo" className="logo" />
        <h1 className="fade-in-element">Study In Your Happy Place</h1>
        <form onSubmit={handleGenerate} className="input-form">
          <input
            type="text"
            value={location}
            onChange={handleInputChange}
            placeholder="Describe a location..."
            className="input-field"
            style={{
              minHeight: '40px',
            }}
          />
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Generating...' : 'Generate Image'}
          </button>
        </form>
        </div>

      {error && <p className="error-message">{error}</p>}

      {imageData && (
        <div
          className="background-image"
          style={{
            backgroundImage: `url(data:image/png;base64,${imageData})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            height: '100vh',
            width: '100vw',
            display: 'flex',
            flexDirection: 'row',
          }}
        >
            <form className="secondinput-form" onSubmit={handleSubmit}>
                <div className={`expandable-button ${isExpanded ? 'expanded' : ''}`}>
                {isExpanded ? (
                    <>
                    <button type="button" className='secondexpand-button' onClick={handleButtonClick}>X</button>
                    <input
                        type="text"
                        value={location}
                        onChange={handleInputChange}
                        placeholder="Describe a location..."
                        className="secondinput-field"
                    />
                    {error ? (
                      <button type="submit" className="failedsubmit-button" disabled={loading}>
                        {loading ? 'Generating...' : 'Failed. Try Again!'}
                    </button>
                    ): (
                      <button type="submit" className="secondsubmit-button" disabled={loading}>
                        {loading ? 'Generating...' : 'Generate Image'}
                    </button>
                    )}                    </>
                ) : (
                    <button type="button" onClick={handleButtonClick} className="expand-button">
                    Search
                    </button>
                )}
                </div>
              <button onClick={handleDownload} type="button" className="expand-button" style={{ display: isExpanded ? "none" : "block" }}>
                Download Image
              </button>
              <button onClick={fetchMusic} type="button" className="expand-button" style={{ display: isExpanded ? "none" : "block", marginLeft: "12px" }}>
                Generate Music
              </button>
              <button onClick={playPause} type="button" className="expand-button" style={{ display: isExpanded ? "none" : "block", marginLeft: "12px" }}>
                {isPlaying ? 'Pause' : 'Play'}
              </button>
            </form>
        </div>
      )}
    </div>
  );
};


export default Home;