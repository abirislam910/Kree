import React, { useState, useEffect } from 'react';
import ReactDOM from "react-dom/client";
import axios from 'axios';
import './App.css';

//iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==


const App = () => {

  const [location, setLocation] = useState('');
  const [imageData, setImageData] = useState('iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleInputChange = (e) => {
    setLocation(e.target.value);
  };

  const fetchImage = async () => {
    setLoading(true);
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
      <h1 className="fade-in-element">Where we going today?</h1>
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
                    <button type="submit" className="secondsubmit-button" disabled={loading}>
                    {loading ? 'Generating...' : 'Generate Image'}
                    </button>                    </>
                ) : (
                    <button type="button" onClick={handleButtonClick} className="expand-button">
                    Search
                    </button>
                )}
                </div>
              <button type="button" className="expand-button" >
                Download Image
              </button>
            </form>
        </div>
      )}

    {imageData && error && (
        <div
          className="background-image"
          style={{
            backgroundImage: `url(data:image/png;base64,${imageData})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            height: '100vh',
            width: '100vw',
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
                    <button type="submit" className="failedsubmit-button" disabled={loading}>
                    {loading ? 'Generating...' : 'Failed. Try Again!'}
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