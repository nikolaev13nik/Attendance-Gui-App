import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { displayName, isAdministrator } from "../auth/roles.js";
import { LANGUAGES, useI18n } from "../i18n/I18nContext.jsx";

export default function Header({ orgName }) {
  const { profile, isAuthenticated, signOut } = useAuth();
  const { lang, setLang, t } = useI18n();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const company =
    orgName ||
    profile?.companyName ||
    (profile ? t("header.organization", { id: profile.tenantId }) : t("header.appName"));

  return (
    <header className="header">
      <span className="header__org">{company}</span>
      <span className="header__spacer" />
      <select
        className="header__lang"
        aria-label={t("header.language")}
        value={lang}
        onChange={(event) => setLang(event.target.value)}
      >
        {LANGUAGES.map((language) => (
          <option key={language.code} value={language.code}>
            {language.label}
          </option>
        ))}
      </select>
      {isAuthenticated ? (
        <>
          {pathname !== "/home" ? (
            <button type="button" className="btn btn--ghost" onClick={() => navigate("/home")}>
              {t("header.mainMenu")}
            </button>
          ) : null}
          <span className="header__user">
            {displayName(profile)}
            {isAdministrator(profile) ? t("header.administrator") : ""}
          </span>
          <button type="button" className="btn btn--ghost" onClick={signOut}>
            {t("header.signOut")}
          </button>
        </>
      ) : null}
    </header>
  );
}
