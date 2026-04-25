import { useState, useEffect } from 'react';

function ParallaxLogo() {
  const [position, setPosition] = useState({ x: 0, y: 0 });

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

  return (
    <div>
        <img style={moveStyle} src="./logo.png" alt="Logo"/>
    </div>
  );
};


export default ParallaxLogo;