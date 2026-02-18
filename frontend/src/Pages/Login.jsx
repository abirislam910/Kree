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
    <div style={styles.wrapper}>
        <div style={styles.card}>
            <h2 style={styles.title}>Login</h2>
            <br></br>
            {message && <span style={styles.error}>{message}</span>}
            <form onSubmit={handleSubmit} style={styles.form}>
                <input
                    className="input-field"
                    onChange={(e) => setEmail(e.target.value)}
                    value={email}
                    type="email"
                    placeholder="Email"
                    required
                />
                <input
                    style={styles.input}
                    onChange={(e) => setPassword(e.target.value)}
                    value={password}
                    type="password"
                    placeholder="Password"
                    required
                />
                <button type="submit" style={{
                    ...styles.button,
                    opacity: loading ? 0.7 : 1,
                    cursor: loading ? "not-allowed" : "pointer",
                    }}>{loading ? "Signing in..." : "Log In"}</button>
            </form>
            <div style={styles.footer}>
                <span>Don't have an account?</span>
                <Link to="/registration" style={styles.link}>Register.</Link>
            </div>
        </div>
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background:
      "linear-gradient(135deg, #0f2027, #203a43, #2c5364)",
  },
  card: {
    background: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(15px)",
    padding: "3rem",
    borderRadius: "20px",
    width: "100%",
    maxWidth: "400px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
    color: "#fff",
    animation: "fadeIn 0.6s ease-out",
  },
  title: {
    marginBottom: "1.5rem",
    fontWeight: 500,
    textAlign: "center",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  input: {
    padding: "0.9rem 1rem",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.2)",
    background: "rgba(255,255,255,0.1)",
    color: "#fff",
    outline: "none",
    fontSize: "0.95rem",
  },
  button: {
    padding: "0.9rem",
    borderRadius: "12px",
    border: "none",
    background: "#4f9cff",
    color: "#fff",
    fontWeight: 500,
    fontSize: "1rem",
    transition: "all 0.2s ease",
  },
  error: {
    background: "rgba(255, 0, 0, 0.15)",
    padding: "0.75rem",
    borderRadius: "10px",
    marginBottom: "1rem",
    fontSize: "0.85rem",
  },
  footer: {
    marginTop: "1.5rem",
    display: "flex",
    justifyContent: "center",
    gap: "0.5rem",
    fontSize: "0.9rem",
  },
  link: {
    color: "#4f9cff",
    textDecoration: "none",
    fontWeight: 500,
  },
};

export default Login;