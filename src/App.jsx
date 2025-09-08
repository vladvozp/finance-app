import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Home from "./pages/Home.jsx";
import Layout from "./components/Layout.jsx";

export default function App() {
  return (
    
      <Routes>
        <Route path="/" element={<Layout />}>
        
        {/* Redirect root ("/") to login page */}
         <Route index element={<Navigate to="/login" replace />} />
        
        {/* Login page */}
        <Route path="login" element={<Login />} />

        {/* Home page after login */}
        <Route path="home" element={<Home />} />
        </Route>
        
      {/* Fallback: unknown paths redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
    
      </Routes>
   
  );
}
