import {useState, useEffect, useContext} from 'react';
import axios from 'axios';
import ParallaxLogo from './ParallaxLogo.jsx';
import { UserContext }  from './UserContext.jsx';
import { ContentContext } from './ContentContext.jsx';
import { useNavigate } from "react-router-dom";
import '../App.css';

function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useContext(UserContext);
  const { imageData, fetchImage, audioBuffer, fetchAudio, location, setLocation } = useContext(ContentContext);
  const navigate = useNavigate();

  /*useEffect(() => {
    if (imageData && audioBuffer) {
      navigate('/generated');
    }
  }, [imageData, audioBuffer, navigate]);*/

  const handleInputChange = (e) => {
    setLocation(e.target.value);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await Promise.all([fetchImage(location), fetchAudio(location)]);
      navigate('/generated');
    } 
    catch (err) {
      setError('Error generating content. Please try again.');
      setLoading(false);
      console.error(err);
    }
  };

  return (
    <div>
        <div className="app">
            {user && <h1 className= 'nav-links'>Hello {user}!</h1>}
            <ParallaxLogo />
            <h1 className="fade-in-element" style={{
                fontSize: '1.5rem',
                }}>
              Study In Your Happy Place
            </h1>
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
            {error && <p className="error-message">{error}</p>}
        </div>
    </div>
  );
};


export default Home;