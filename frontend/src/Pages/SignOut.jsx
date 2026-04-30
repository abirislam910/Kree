import { useState, useContext } from "react";
import { UserContext } from './UserContext.jsx';
import { useNavigate, useLocation } from "react-router-dom";
import '../App.css'

function Signout() {
  const navigate = useNavigate();
  const redirect = useLocation();
  const { signout } = useContext(UserContext);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      await signout();
      navigate(redirect.state.from === '/collection' ? '/' : redirect.state.from);
    }
    catch (err) {
      setMessage(err.message)
      console.log(err);
    }
  };

    return (
        <div>
            <div className="auth-container">
                <div className="auth-card">
                    <h2 className="auth-title">Log Out</h2>
                    <p className="subtitle">See you soon!</p>
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