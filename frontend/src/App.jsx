import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import Problems from "./pages/Problems";
import Target from "./pages/Target";
import Profile from "./pages/Profile";
import Problem from "./pages/Problem";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import AdminUpload from "./pages/AdminUpload";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/problems" element={<Problems />} />
          <Route path="/target" element={<Target />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/problem/:id" element={<Problem />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin/upload" element={<AdminUpload />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
