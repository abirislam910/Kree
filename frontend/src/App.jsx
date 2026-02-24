import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./Pages/Home";
import Login from "./Pages/Login";
import Signout from "./Pages/SignOut";
import Registration from "./Pages/Registration";
import { UserProvider } from "./Pages/UserContext.jsx";

function App() {

  return (
    <UserProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signout" element={<Signout />} />
          <Route path="/registration" element={<Registration />} />
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;