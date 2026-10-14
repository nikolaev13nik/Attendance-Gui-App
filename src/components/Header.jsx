import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { displayName, isAdministrator } from "../auth/roles.js";

export default function Header({ orgName }) {
  const { profile, isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const company = orgName || profile?.companyName || (profile ? `Organization #${profile.tenantId}` : "Attendance");

  return (
    <header className="header">
      <span className="header__org">{company}</span>
      <span className="header__spacer" />
      {isAuthenticated ? (
        <>
          {pathname !== "/home" ? (
            <button type="button" className="btn btn--ghost" onClick={() => navigate("/home")}>
              Main menu
            </button>
          ) : null}
          <span className="header__user">
            {displayName(profile)}
            {isAdministrator(profile) ? " · administrator" : ""}
          </span>
          <button type="button" className="btn btn--ghost" onClick={signOut}>
            Sign out
          </button>
        </>
      ) : null}
    </header>
  );
}
