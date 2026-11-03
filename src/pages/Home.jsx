import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import MessageAdmin from "../components/MessageAdmin.jsx";
import Icon from "../components/Icon.jsx";
import { useAuth } from "../auth/AuthContext.jsx";
import { displayName, isAdministrator, isPlatformAdmin } from "../auth/roles.js";
import { useI18n } from "../i18n/I18nContext.jsx";

export default function Home() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { profile, actingTenant } = useAuth();
  const admin = isAdministrator(profile);
  const platformAdmin = isPlatformAdmin(profile);

  const tiles = [
    platformAdmin
      ? null
      : {
          to: "/session",
          icon: "clock",
          title: t("home.reportSession"),
          desc: t("home.reportSessionDesc"),
          primary: true,
        },
    {
      to: "/sessions",
      icon: "list",
      title: admin ? t("home.reviewSessions") : t("home.mySessions"),
      desc: admin ? t("home.reviewSessionsDesc") : t("home.mySessionsDesc"),
    },
    admin
      ? { to: "/leave-days", icon: "calendar", title: t("home.reportLeave"), desc: t("home.reportLeaveDesc") }
      : null,
    admin
      ? { to: "/statistics", icon: "chart", title: t("home.statistics"), desc: t("home.statisticsDesc") }
      : null,
    admin
      ? { to: "/users", icon: "users", title: t("home.manageUsers"), desc: t("home.manageUsersDesc") }
      : null,
  ].filter(Boolean);

  return (
    <Layout>
      <section className="home">
        <h1 className="home__title">{t("home.welcome", { name: displayName(profile) })}</h1>
        <p className="card__hint">
          {platformAdmin
            ? t("home.platformHint", { company: actingTenant?.companyName ?? "" })
            : admin
              ? t("home.adminHint")
              : t("home.userHint")}
        </p>

        <div className="tiles">
          {tiles.map((tile) => (
            <button
              key={tile.to}
              type="button"
              className={tile.primary ? "tile tile--primary" : "tile"}
              onClick={() => navigate(tile.to)}
            >
              <span className="tile__icon">
                <Icon name={tile.icon} />
              </span>
              <span className="tile__text">
                <span className="tile__title">{tile.title}</span>
                <span className="tile__desc">{tile.desc}</span>
              </span>
              <Icon name="chevron" className="tile__chevron" />
            </button>
          ))}
        </div>

        {admin ? null : (
          <div className="card">
            <MessageAdmin
              heading={t("home.correctHeading")}
              hint={t("home.correctHint")}
              subject={t("home.mailSubject", { name: displayName(profile), id: profile.idUser })}
              bodyTemplate={t("home.mailBody")}
            />
          </div>
        )}
      </section>
    </Layout>
  );
}
