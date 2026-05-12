import { useState, useContext } from "react";
import { UserContext } from './UserContext.jsx';
import { Link, useNavigate, useLocation } from "react-router-dom";
import '../App.css'

function Login() {
  const navigate = useNavigate();
  const { login } = useContext(UserContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const redirect = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      await login(email, password);
      navigate(redirect.state.from);
    }
    catch (err) {
      setMessage("Error logging in");
      setEmail("");
      setPassword("");
      setLoading(false);
    }
  };

    return (
        <div>
            <div className="auth-container">
                <div className="auth-card">
                    <h2 className="auth-title">Log In</h2>
                    {!message && <p className="subtitle">Welcome Back!</p>}
                    {message && <p className="subtitle" style={{color: 'red'}}><strong>{message}</strong></p>}
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