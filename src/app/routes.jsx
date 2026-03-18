import { createBrowserRouter } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import Home from "../pages/Home.jsx";
import Login from "../pages/Login.jsx";
import Guest from "../pages/Guest.jsx";
import GuestTransactionStep1 from "../pages/GuestTransactionStep1.jsx";
import GuestTransactionStep2 from "../pages/GuestTransactionStep2.jsx";
import GuestTransactionStep3 from "../pages/GuestTransactionStep3.tsx";
import TestErgebniss from "../pages/TestErgebniss.jsx";
import Dashboard from "../pages/Dashboard.tsx";
import SettingsPage from "../pages/SettingsPage.tsx";
import Berichte from "../pages/Berichte.tsx";
import ProtectedRoute from "../app/ProtectedRoute.jsx"
import MonthPage from "../pages/MonthPage.tsx"
import GuestTransactionOne from "../pages/GuestTransactionOne.tsx"
import SetupPage from "../pages/SetupPage.tsx";


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
      { path: "/TestErgebniss", element: <TestErgebniss /> },
      { path: "/Dashboard", element: <Dashboard /> },
      { path: "/SettingsPage", element: <SettingsPage /> },
      { path: "/Berichte", element: <Berichte /> },
      { path: "/GuestTransactionOne", element: <GuestTransactionOne /> },
      { path: "/MonthPage", element: <MonthPage /> },
      { path: "/setup", element: <SetupPage /> },
    ],
  },
]);
