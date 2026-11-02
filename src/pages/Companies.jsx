import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import Notice from "../components/Notice.jsx";
import { listTenants } from "../api/accounting.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { useI18n } from "../i18n/I18nContext.jsx";

const PAGE_SIZE = 20;

export default function Companies() {
  const navigate = useNavigate();
  const { token, actingTenant, chooseTenant } = useAuth();
  const { t } = useI18n();
  const [page, setPage] = useState(0);
  const [result, setResult] = useState(null);
  const [failure, setFailure] = useState(null);

  useEffect(() => {
    let current = true;
    setResult(null);
    setFailure(null);
    listTenants({ token, page, size: PAGE_SIZE })
      .then((body) => {
        if (current) {
          setResult(body);
        }
      })
      .catch((error) => {
        if (current) {
          setFailure(error);
          setResult({ items: [], page, totalPages: 0 });
        }
      });
    return () => {
      current = false;
    };
  }, [page, token]);

  const manage = (tenant) => {
    chooseTenant(tenant);
    navigate("/home");
  };

  const items = result?.items ?? [];
  const totalPages = result?.totalPages ?? 0;

  return (
    <Layout>
      <div className="card">
        <div className="row row--split" style={{ marginBottom: "0.75rem" }}>
          <div>
            <h1 className="card__title" style={{ marginBottom: 0 }}>
              {t("companies.title")}
            </h1>
            <p className="card__hint" style={{ marginBottom: 0 }}>
              {t("companies.hint")}
            </p>
          </div>
        </div>

        <Notice kind="error">{failure}</Notice>

        {result === null ? (
          <p className="spinner">{t("common.loading")}</p>
        ) : items.length === 0 ? (
          <p className="spinner">{t("companies.none")}</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{t("companies.id")}</th>
                  <th>{t("companies.name")}</th>
                  <th>{t("companies.contact")}</th>
                  <th>{t("companies.status")}</th>
                  <th aria-label={t("common.actions")} />
                </tr>
              </thead>
              <tbody>
                {items.map((tenant) => (
                  <tr key={tenant.tenantId}>
                    <td>{tenant.tenantId}</td>
                    <td>{tenant.companyName}</td>
                    <td>{tenant.contactName || "—"}</td>
                    <td>{tenant.status || "—"}</td>
                    <td className="table__actions">
                      <button
                        type="button"
                        className={`btn${actingTenant?.tenantId === tenant.tenantId ? " btn--primary" : ""}`}
                        onClick={() => manage(tenant)}
                      >
                        {t("companies.manage")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 ? (
          <div className="row" style={{ justifyContent: "center", marginTop: "1rem" }}>
            <button type="button" className="btn" disabled={page === 0} onClick={() => setPage(page - 1)}>
              {t("companies.previous")}
            </button>
            <span className="card__hint" style={{ margin: 0 }}>
              {t("companies.page", { page: page + 1, total: totalPages })}
            </span>
            <button
              type="button"
              className="btn"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              {t("companies.next")}
            </button>
          </div>
        ) : null}
      </div>
    </Layout>
  );
}
