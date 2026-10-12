import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import { isAdministrator } from "./roles.js";

export default function RequireAuth({ children, adminOnly = false }) {
  const { isAuthenticated, profile } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (adminOnly && !isAdministrator(profile)) {
    return <Navigate to="/home" replace />;
  }

  return children;
}
