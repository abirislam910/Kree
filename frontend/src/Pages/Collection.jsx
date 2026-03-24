import React, { useState, useContext } from "react";
import Header from './Header.jsx';
import { UserContext } from './UserContext.jsx';
import { useNavigate } from "react-router-dom";
import axios from "axios";
import '../App.css'

function Collection() {
  const navigate = useNavigate();
  const { user, setUser } = useContext(UserContext);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

    return (
        <div>
            <Header user={user} />
        </div>
    );
}

export default Collection;