import { useContext, useEffect, useState } from "react";
import Hamburger from 'hamburger-react'
import { Link, useLocation } from "react-router-dom";
import { UserContext } from './UserContext.jsx';
import { ContentContext } from "./ContentContext";
import '../App.css';

function Header() {
  const [isOpen, setOpen] = useState(false);
  const  { user } = useContext(UserContext);
  const { pathname } = useLocation();

  return (
    <div className="header" style={{backgroundColor: pathname === '/generated'  ? 'transparent' : '#faf7eb'}}>
      <Hamburger toggled={isOpen} toggle={setOpen} color={pathname === '/generated' ? '#faf7eb' : '#35BB8B'}/>
      <nav className={pathname === '/generated' ? "nav-links-image" : "nav-links"}>
        {isOpen && pathname !== '/' && pathname !== '/generated' && 
          <Link to="/">
            <strong>Home</strong>
          </Link>
        }
        {isOpen && pathname  !== '/login' && !user &&
            <Link to="/login">
              <strong>Login</strong>
            </Link>
        }
        {isOpen && pathname !== '/signout' && user &&
            <Link to="/signout">
              <strong>Sign Out</strong>
            </Link>
        }
        {isOpen && pathname !== '/collection' && user &&
            <Link to="/collection">
              <strong>Collection</strong>
            </Link>
        }
        {isOpen && pathname !== '/registration' && !user &&
          <Link to="/registration">
            <strong>Register</strong>
          </Link>
        }
      </nav>
    </div>
  );
}

export default Header;