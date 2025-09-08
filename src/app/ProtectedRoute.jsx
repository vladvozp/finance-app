import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const isAuthed = !!localStorage.getItem("token"); // test
  return isAuthed ? children : <Navigate to="/login" replace />;
}
