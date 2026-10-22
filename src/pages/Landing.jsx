import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import Notice from "../components/Notice.jsx";
import { useI18n } from "../i18n/I18nContext.jsx";

export default function Landing() {
  const navigate = useNavigate();
  const { t } = useI18n();

  return (
    <Layout>
      <div className="card card--narrow">
        <h1 className="card__title">Attendance</h1>
        <p className="card__hint">{t("landing.about")}</p>
        <Notice kind="info">{t("landing.firstVisit")}</Notice>
        <div className="stack">
          <button
            type="button"
            className="btn btn--primary btn--block btn--large"
            onClick={() => navigate("/login")}
          >
            {t("login.submit")}
          </button>
          <button
            type="button"
            className="btn btn--block btn--large"
            onClick={() => navigate("/signup/organization")}
          >
            {t("landing.signUp")}
          </button>
        </div>
      </div>
    </Layout>
  );
}
