import React, { useContext, useState } from "react";
import Hamburger from 'hamburger-react'
import { ContentContext } from './ContentContext.jsx';
import { Link, useLocation } from "react-router-dom";
import '../App.css';

function Header() {
  const [isOpen, setOpen] = useState(false);
  const location = useLocation();
  const pathname = location.pathname;
  const { user } = useContext(ContentContext);
  const { imageData } = useContext(ContentContext);

  return (
    <div className="header" style={{backgroundColor: pathname === '/generated'  ? 'transparent' : '#faf7eb'}}>
      <Hamburger toggled={isOpen} toggle={setOpen} color={pathname === '/generated' ? '#faf7eb' : '#35BB8B'}/>
      <nav className={pathname === '/generated' ? "nav-links-image" : "nav-links"}>
        {isOpen && pathname !== '/' && pathname !== '/generated' && 
          <Link to={imageData ? '/generated' : '/'}>
            <strong>{imageData ? 'Wallpaper' : 'Home'}</strong>
          </Link>
        }
        {isOpen && window.location.pathname !== '/login' && !user &&
            <Link to="/login">
              <strong>Login</strong>
            </Link>
        }
        {isOpen && window.location.pathname !== '/signout' && user &&
            <Link to="/signout">
              <strong>Sign Out</strong>
            </Link>
        }
        {isOpen && window.location.pathname !== '/collection' && user &&
            <Link to="/collection">
              <strong>Collection</strong>
            </Link>
        }
        {isOpen && window.location.pathname !== '/registration' && !user &&
          <Link to="/registration">
            <strong>Register</strong>
          </Link>
        }
      </nav>
    </div>
  );
}

export default Header;