import React, { useState } from "react";
import Hamburger from 'hamburger-react'
import { Link } from "react-router-dom";
import '../App.css';

function Header(props) {
  const [isOpen, setOpen] = useState(false);

  return (
    <div className="header">
      <Hamburger toggled={isOpen} toggle={setOpen} color={props.image ? '#faf7eb' : '#35BB8B'}/>
      <nav className={props.image ? "nav-links-image" : "nav-links"}>
        {isOpen && window.location.pathname !== '/' && 
          <Link to="/">
            <strong>Home</strong>
          </Link>
        }
        {isOpen && window.location.pathname !== '/login' && !props.user &&
            <Link to="/login">
              <strong>Login</strong>
            </Link>
        }
        {isOpen && window.location.pathname !== '/login' && props.user &&
            <Link to="/signout">
              <strong>Sign Out</strong>
            </Link>
        }
        {isOpen && window.location.pathname !== '/registration' && 
          <Link to="/registration">
            <strong>Register</strong>
          </Link>
        }
      </nav>
    </div>
  );
}

export default Header;