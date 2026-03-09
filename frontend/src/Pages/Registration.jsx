import React, { useState } from "react";
import Header from './Header.jsx';
import { Link } from "react-router-dom";
import axios from "axios";

function Registration() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("Please check your email for a confirmation link");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/registration`, {
        email: email,
        password: password,
        name: name
      },
       { withCredentials: true }
    );

      setMessage("Please check your email for a confirmation link");
    }
    catch (err) {
      setMessage(err);
      console.log(err);
    }

    setLoading(false);
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
                {!message && <p className="auth-subtitle">Welcome to Kree!</p>}
                {message && <p className="auth-subtitle">{message}</p>}
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
                    <button type="submit" className="auth-button">{loading ? "Registering..." : "Register"}</button>
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