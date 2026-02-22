import React, { useState, useContext } from "react";
import supabase from "../Supabase/supabaseClient";
import Header from './Header.jsx';
import { UserContext } from './UserContext.jsx';
import { Link, useNavigate } from "react-router-dom";
import '../App.css'

function Login() {
  const navigate = useNavigate();
  const { user, setUser } = useContext(UserContext);
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
      setUser(data.session.user.user_metadata.name)
      navigate("/");
      return null;
    }
  };

    return (
        <div>
            <Header />
            <div className="auth-container">
                <div className="auth-card">
                    <h2 className="auth-title">Log In</h2>
                    <p className="auth-subtitle">Welcome Back!</p>
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

                    <span className="auth-footer">
                        <br></br>
                        <p>Don’t have an account?</p>
                        <Link to="/registration" className="auth-link" style={{textDecoration: 'none'}}>Register</Link>
                    </span>
                </div>
            </div>
        </div>
    );
}

export default Login;