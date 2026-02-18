import React, { useState } from "react";
import supabase from "../Supabase/supabaseClient";
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
      <h2>Register</h2>
      <br></br>
      {message && <span>{message}</span>}
      <form onSubmit={handleSubmit}>
        <input
          onChange={(e) => setEmail(e.target.value)}
          value={email}
          type="email"
          placeholder="Email"
          required
        />
        <input
          onChange={(e) => setPassword(e.target.value)}
          value={password}
          type="password"
          placeholder="Password"
          required
        />
        <input
          onChange={(e) => setName(e.target.value)}
          value={name}
          type="text"
          placeholder="Name"
          required
        />
        <button type="submit">Create Account</button>
      </form>
      <span>Already have an account?</span>
      <Link to="/login">Log in.</Link>
    </div>
  );
}

export default Registration;