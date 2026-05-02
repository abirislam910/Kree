import { createContext, useEffect, useState, useCallback, useMemo } from 'react';
import axios from "axios";

export const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState('');

  useEffect(() => {
    getUserData();
  }, []);

  const getUserData = async () => {
        try {
          const response = await axios.get(`${process.env.REACT_APP_API_URL}/auth/user`, { withCredentials: true });
          setUser(response.data.user);
        }
          catch (err) {      
          console.log('Error fetching user data:', err);
        }
    };

  const register = useCallback(async (email, password, name) => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/auth/register`, {
        email: email,
        password: password,
        name: name
      },
       { withCredentials: true }
    );
      console.log("Registration successful");
    }
    catch (err) {
      console.log("Error registering: ", err);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/auth/login`, {
        email: email,
        password: password
      },
       { withCredentials: true }
    );
      console.log("Login successful");
      setUser(response.data.user);
    }
    catch (err) {
      console.log("Error logging in: ", err);
    }
  }, []);

  const signout = useCallback(async () => {
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/auth/signout`, {}, { withCredentials: true });
      setUser('');
    }
    catch (err) {
      console.log(err);
    }
  }, []);

  const contextValue = useMemo(() => ({
    user,
    login,
    signout, 
    register
  }), [user, login, signout, register]);

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;