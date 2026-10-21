import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import MessageAdmin from "../components/MessageAdmin.jsx";
import { useAuth } from "../auth/AuthContext.jsx";
import { displayName, isAdministrator } from "../auth/roles.js";
import { useI18n } from "../i18n/I18nContext.jsx";

export default function Home() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { profile } = useAuth();
  const admin = isAdministrator(profile);

  return (
    <Layout>
      <div className="card card--narrow">
        <h1 className="card__title">{t("home.welcome", { name: displayName(profile) })}</h1>
        <p className="card__hint">
          {admin
            ? t("home.adminHint")
            : t("home.userHint")}
        </p>
        <div className="stack">
          <button
            type="button"
            className="btn btn--primary btn--block btn--large"
            onClick={() => navigate("/session")}
          >
            {t("home.reportSession")}
          </button>
          <button
            type="button"
            className="btn btn--block btn--large"
            onClick={() => navigate("/sessions")}
          >
            {admin ? t("home.reviewSessions") : t("home.mySessions")}
          </button>
          {admin ? (
            <>
              <button
                type="button"
                className="btn btn--block btn--large"
                onClick={() => navigate("/leave-days")}
              >
                {t("home.reportLeave")}
              </button>
              <button
                type="button"
                className="btn btn--block btn--large"
                onClick={() => navigate("/statistics")}
              >
                {t("home.statistics")}
              </button>
              <button
                type="button"
                className="btn btn--block btn--large"
                onClick={() => navigate("/users")}
              >
                {t("home.manageUsers")}
              </button>
            </>
          ) : null}
        </div>

        {admin ? null : (
          <>
            <hr style={{ margin: "1.5rem 0 1rem", border: "none", borderTop: "1px solid var(--border)" }} />
            <MessageAdmin
              heading={t("home.correctHeading")}
              hint={t("home.correctHint")}
              subject={t("home.mailSubject", { name: displayName(profile), id: profile.idUser })}
              bodyTemplate={t("home.mailBody")}
            />
          </>
        )}
      </div>
    </Layout>
  );
}
