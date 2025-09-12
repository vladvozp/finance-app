import { createBrowserRouter } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import Home from "../pages/Home.jsx";
import Login from "../pages/Login.jsx";
import Guest from "../pages/Guest.jsx";
import GuestTransactionStep1 from "../pages/GuestTransactionStep1.jsx";
import GuestTransactionStep2 from "../pages/GuestTransactionStep2.jsx";
import GuestTransactionStep3 from "../pages/GuestTransactionStep3.jsx";

import ProtectedRoute from "../app/ProtectedRoute.jsx"

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      // Protected
      { path: "/", element: <ProtectedRoute><Home /></ProtectedRoute> },

      // Public
      { path: "/login", element: <Login /> },
      { path: "/guest", element: <Guest /> },
      { path: "/guestTransactionStep1", element: <GuestTransactionStep1 /> },
      { path: "/guestTransactionStep2", element: <GuestTransactionStep2 /> },
      { path: "/guestTransactionStep3", element: <GuestTransactionStep3 /> },
    ],
  },
]);
