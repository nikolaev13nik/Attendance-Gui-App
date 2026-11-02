import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import { isAdministrator, isPlatformAdmin } from "./roles.js";

export default function RequireAuth({ children, adminOnly = false, ownHoursOnly = false, platformOnly = false }) {
  const { isAuthenticated, profile, actingTenant } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const platformAdmin = isPlatformAdmin(profile);
  if (platformOnly) {
    return platformAdmin ? children : <Navigate to="/home" replace />;
  }
  if (platformAdmin && ownHoursOnly) {
    return <Navigate to="/home" replace />;
  }
  if (platformAdmin && actingTenant === null) {
    return <Navigate to="/companies" replace />;
  }

  if (adminOnly && !isAdministrator(profile)) {
    return <Navigate to="/home" replace />;
  }

  return children;
}
