import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Home from "./pages/Home.jsx";

export default function App() {
  return (
    // BrowserRouter enables routing without page reloads
    <BrowserRouter>
      <Routes>
        {/* Redirect root ("/") to login page */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Login page */}
        <Route path="/login" element={<Login />} />

        {/* Home page after login */}
        <Route path="/home" element={<Home />} />

        {/* Fallback: unknown paths redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
