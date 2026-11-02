import { useNavigate } from "react-router-dom";
import Header from "./Header.jsx";
import { useAuth } from "../auth/AuthContext.jsx";
import { isPlatformAdmin } from "../auth/roles.js";
import { useI18n } from "../i18n/I18nContext.jsx";

function ActingBanner() {
  const navigate = useNavigate();
  const { profile, actingTenant } = useAuth();
  const { t } = useI18n();
  if (isPlatformAdmin(profile) && actingTenant) {
    return (
      <div className="acting-banner" role="status">
        <span>
          {t("banner.acting", { company: actingTenant.companyName, id: actingTenant.tenantId })}
        </span>
        <button type="button" className="btn btn--ghost" onClick={() => navigate("/companies")}>
          {t("banner.change")}
        </button>
      </div>
    );
  }
  return null;
}

export default function Layout({ orgName, children }) {
  return (
    <div className="app">
      <Header orgName={orgName} />
      <ActingBanner />
      <main className="main">{children}</main>
    </div>
  );
}
