import { createContext, useState } from 'react';

export const ContentContext = createContext();

export function ContentProvider({ children }) {
  const [imageData, setImageData] = useState(null);
  const [audioBuffer, setAudioBuffer] = useState(null);
  const [location, setLocation] = useState(null);

  return (
    <ContentContext.Provider value={{ imageData, setImageData, audioBuffer, setAudioBuffer, location, setLocation }}>
      {children}
    </ContentContext.Provider>
  );
};

export default ContentProvider;