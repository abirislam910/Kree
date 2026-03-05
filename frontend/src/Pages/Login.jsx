import React, { useState, useContext } from "react";
import Header from './Header.jsx';
import { UserContext } from './UserContext.jsx';
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import '../App.css'

function Login() {
  const navigate = useNavigate();
  const { user, setUser } = useContext(UserContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/login`, {
        email: email,
        password: password
      },
       { withCredentials: true }
    );

      setUser(response.data);
      console.log(response.data);
      navigate("/");
    }
    catch (err) {
      setMessage(err);
      setEmail("");
      setPassword("");
      setLoading(false);
      console.log(err);
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

                    {<span className="auth-footer">
                        <br></br>
                        <p>Don’t have an account?</p>
                        <Link to="/registration" className="auth-link" style={{textDecoration: 'none'}}>Register</Link>
                    </span>}
                </div>
            </div>
        </div>
    );
}

export default Login;