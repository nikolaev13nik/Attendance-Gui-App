import logo from "../assets/logo.png";
import { useAuth } from "../auth/AuthContext.jsx";
import { displayName, isAdministrator } from "../auth/roles.js";

export default function Header({ orgName }) {
  const { profile, isAuthenticated, signOut } = useAuth();
  const company = orgName || profile?.tenantName || (profile ? `Organization #${profile.tenantId}` : "Attendance");

  return (
    <header className="header">
      <img className="header__logo" src={logo} alt="" />
      <span className="header__org">{company}</span>
      <span className="header__spacer" />
      {isAuthenticated ? (
        <>
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
