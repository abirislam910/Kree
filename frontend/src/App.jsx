import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./Pages/Home.jsx";
import Login from "./Pages/Login.jsx";
import Signout from "./Pages/SignOut.jsx";
import Registration from "./Pages/Registration.jsx";
import GeneratedPage from "./Pages/GeneratedPage.jsx";
import Collection from "./Pages/Collection.jsx";
import Header from "./Pages/Header.jsx";
import { UserProvider } from "./Pages/UserContext.jsx";
import { ContentProvider } from "./Pages/ContentContext.jsx";

function App() {

  return (
    <ContentProvider>
      <UserProvider>
        <BrowserRouter>
          <Header />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signout" element={<Signout />} />
              <Route path="/registration" element={<Registration />} />
              <Route path="/generated" element={<GeneratedPage />} />
              <Route path="/collection" element={<Collection />} />
            </Routes>
        </BrowserRouter>
      </UserProvider>
    </ContentProvider>
  );
}

export default App;