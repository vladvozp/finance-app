import { createBrowserRouter } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import Home from "../pages/Home.jsx";
import Login from "../pages/Login.jsx";
import Guest from "../pages/Guest.jsx";

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/login", element: <Login /> },
      { path: "/guest", element: <Guest /> },
    ],
  },
]);
