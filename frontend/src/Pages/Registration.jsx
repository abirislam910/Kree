import React, { useState } from "react";
import supabase from "../Supabase/supabaseClient";
import Header from './Header.jsx';
import { Link } from "react-router-dom";

function Registration() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

  const { data, error } = await supabase.auth.signUp(
    {
        email: email,
        password: password,
        options: {
        data: {
            name: name,
        }
        }
    }
    )
    if (error) {
      setMessage(error.message);
      return;
    }

    if (data) {
      setMessage("Please check your email for a confirmation link");
    }

    setEmail("");
    setPassword("");
    setName("");
  };

  return (
    <div>
        <Header />
        <div className="auth-container">
            <div className="auth-card">
                <h2 className="auth-title">Register</h2>
                <p className="auth-subtitle">Welcome to Kree!</p>
                {message && <span>{message}</span>}
                <form onSubmit={handleSubmit} className="auth-form">
                    <input
                    onChange={(e) => setEmail(e.target.value)}
                    value={email}
                    type="email"
                    placeholder="Email"
                    required
                    className="auth-input"
                    />
                    <input
                    onChange={(e) => setPassword(e.target.value)}
                    value={password}
                    type="password"
                    placeholder="Password"
                    required
                    className="auth-input"
                    />
                    <input
                    onChange={(e) => setName(e.target.value)}
                    value={name}
                    type="text"
                    placeholder="Name"
                    required
                    className="auth-input"
                    />
                    <button type="submit" className="auth-button">Create Account</button>
                </form>
                <p className="auth-footer">Already have an account?
                    <br></br>
                    <Link to="/login" className="auth-link" style={{textDecoration: 'none'}}>Log in.</Link>
                </p>
        </div>
        </div>
    </div>
  );
}

export default Registration;