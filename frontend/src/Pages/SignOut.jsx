import React, { useState, useContext } from "react";
import supabase from "../Supabase/supabaseClient";
import Header from './Header.jsx';
import { UserContext } from './UserContext.jsx';
import { Link, useNavigate } from "react-router-dom";
import '../App.css'

function Signout() {
  const navigate = useNavigate();
  const { user, setUser } = useContext(UserContext);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    const { error } = await supabase.auth.signOut()

    if (error) {
      setMessage(error.message)
      return;
    }
    else {
      setLoading(false);
      setUser('')
      navigate("/");
    }
  };

    return (
        <div>
            <Header />
            <div className="auth-container">
                <div className="auth-card">
                    <h2 className="auth-title">Log Out</h2>
                    <p className="auth-subtitle">See you soon!</p>
                    {message && <span className="auth-subtitle">{message}</span>}
                    <button onClick={handleSubmit} className="auth-button" style={{
                        opacity: loading ? 0.7 : 1,
                        cursor: loading ? "not-allowed" : "pointer"}}>
                        {loading ? "Logging out..." : "Log Out"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Signout;