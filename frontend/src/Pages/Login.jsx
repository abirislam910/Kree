import React, { useState } from "react";
import supabase from "../Supabase/supabaseClient";
import { Link, useNavigate } from "react-router-dom";
import '../App.css'

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      setMessage(error.message);
      setEmail("");
      setPassword("");
      setLoading(false);
      return;
    }

    if (data) {
      navigate("/");
      return null;
    }
  };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1 className="auth-title">Welcome Back</h1>
                <p className="auth-subtitle">Sign in to continue</p>
                {message && <span className="auth-subtitle">{message}</span>}
                <form onSubmit={handleSubmit} className="auth-form">
                <input
                    onChange={(e) => setEmail(e.target.value)}
                    value={email}
                    required
                    type="email"
                    placeholder="Email"
                    className="auth-input"
                />
                <input
                    onChange={(e) => setPassword(e.target.value)}
                    value={password}
                    required
                    type="password"
                    placeholder="Password"
                    className="auth-input"
                />

                <button type="submit" className="auth-button" style={{
                    opacity: loading ? 0.7 : 1,
                    cursor: loading ? "not-allowed" : "pointer"}}>
                    {loading ? "Signing in..." : "Log In"}
                </button>
                </form>

                <p className="auth-footer">
                    Don’t have an account?
                    <br></br>
                    <Link to="/registration" className="auth-link" style={{textDecoration: 'none'}}>Register.</Link>
                </p>
            </div>
        </div>
    );
}

export default Login;