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
          const response = await axios.get(`${process.env.REACT_APP_API_URL}/user`, { withCredentials: true });
          setUser(response.data.user);
        }
          catch (err) {      
          console.log('Error fetching user data:', err);
        }
    };

  const login = useCallback(async (e, email, password) => {
    e.preventDefault();

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/login`, {
        email: email,
        password: password
      },
       { withCredentials: true }
    );
      console.log("Login successful");
      setUser(response.data);
    }
    catch (err) {
      console.log("Error logging in: ", err);
    }
  }, []);

  const signout = useCallback(async () => {
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/signout`, {}, { withCredentials: true });
      setUser('');
    }
    catch (err) {
      console.log(err);
    }
  }, []);

  const contextValue = useMemo(() => ({
    user,
    login,
    signout
  }), [user, login, signout]);

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;