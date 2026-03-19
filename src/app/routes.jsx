import { createBrowserRouter } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import Login from "../pages/Login.tsx";
import Dashboard from "../pages/Dashboard.tsx";
import SettingsPage from "../pages/SettingsPage.tsx";
import Berichte from "../pages/Berichte.tsx";
import MonthPage from "../pages/MonthPage.tsx"
import GuestTransactionOne from "../pages/GuestTransactionOne.tsx"
import SetupPage from "../pages/SetupPage.tsx";
import AccountEditPage from "../pages/AccountEditPage.tsx";
import TransactionEditPage from "../pages/TransactionEditPage.tsx";


export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <Login /> },
      { path: "/login", element: <Login /> },
      { path: "/Dashboard", element: <Dashboard /> },
      { path: "/SettingsPage", element: <SettingsPage /> },
      { path: "/Berichte", element: <Berichte /> },
      { path: "/GuestTransactionOne", element: <GuestTransactionOne /> },
      { path: "/MonthPage", element: <MonthPage /> },
      { path: "/setup", element: <SetupPage /> },
      { path: "/account/:id", element: <AccountEditPage /> },
      { path: "/transaction/:id/edit", element: <TransactionEditPage /> },

    ],
  },
]);
