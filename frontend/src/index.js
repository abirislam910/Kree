import React, { useState } from 'react';
import ReactDOM from "react-dom/client";
import OpenAI from "openai";
import axios from 'axios';
import './App.css';

const App = () => {

  const [location, setLocation] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  //const val = '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';

  //const openai = new OpenAI({dangerouslyAllowBrowser: true, apiKey: key});

  const handleInputChange = (e) => {
    setLocation(e.target.value);
  };

  const fetchImage = async () => {
    setLoading(true);
    setError('');

    if (!location.trim()) {
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

      setImageUrl(response.data.imageUrl);
    }
    catch (err) {
      setError('Failed to fetch image. Please try again.');
      console.log(err);
    }
    setLoading(false);
  };
  
  const handleButtonClick = () => {
    setIsExpanded(!isExpanded);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchImage();
  };

  return (
    <div className="app">
        <div>
      <h1 className="fade-in-element">Hi Baby! Where we going?</h1>
      <form onSubmit={handleSubmit} className="input-form">
        <input
          type="text"
          value={location}
          onChange={handleInputChange}
          placeholder="Describe a location..."
          className="input-field"
        />
        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? 'Generating...' : 'Generate Image'}
        </button>
      </form>
        </div>

      {error && <p className="error-message">{error}</p>}

      {imageUrl && (
        <div
          className="background-image"
          style={{
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            height: '100vh',
            width: '100%',
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
                    <button type="submit" className="secondsubmit-button" disabled={loading}>
                    {loading ? 'Generating...' : 'Generate Image'}
                    </button>                    </>
                ) : (
                    <button type="button" onClick={handleButtonClick} className="expand-button">
                    Search
                    </button>
                )}
                </div>
            </form>
        </div>
      )}
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App/>)