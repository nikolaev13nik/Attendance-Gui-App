import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import Notice from "../components/Notice.jsx";
import Field from "../components/Field.jsx";
import { useAuth } from "../auth/AuthContext.jsx";
import { msg, useI18n } from "../i18n/I18nContext.jsx";

export default function Login() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { signIn, isAuthenticated } = useAuth();
  const { t } = useI18n();

  const [by, setBy] = useState(state?.tenantId != null ? "id" : "name");
  const [form, setForm] = useState({
    tenantId: state?.tenantId != null ? String(state.tenantId) : "",
    companyName: state?.companyName ?? "",
    idUser: state?.idUser != null ? String(state.idUser) : "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState(null);
  const [busy, setBusy] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  const update = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  function switchTo(next) {
    setBy(next);
    setErrors({});
    setFailure(null);
  }

  function validate() {
    const next = {};
    if (by === "id") {
      if (!/^\d+$/.test(form.tenantId)) {
        next.tenantId = msg("login.error.tenantId");
      }
    } else if (!form.companyName.trim()) {
      next.companyName = msg("login.error.companyName");
    }
    if (!/^\d+$/.test(form.idUser)) {
      next.idUser = msg("login.error.idUser");
    }
    if (!form.password) {
      next.password = msg("login.error.password");
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit(event) {
    event.preventDefault();
    setFailure(null);
    if (!validate()) {
      return;
    }
    setBusy(true);
    try {
      await signIn({
        idUser: Number(form.idUser),
        password: form.password,
        tenantId: by === "id" ? Number(form.tenantId) : undefined,
        companyName: by === "name" ? form.companyName.trim() : undefined,
      });
      navigate(state?.from || "/home", { replace: true });
    } catch (error) {
      setFailure(error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Layout>
      <div className="card card--narrow">
        <h1 className="card__title">{t("login.title")}</h1>
        <p className="card__hint">{t("login.hint")}</p>
        <Notice kind="error">{failure}</Notice>

        <div className="row" style={{ marginBottom: "1rem" }}>
          <button
            type="button"
            className={`btn${by === "name" ? " btn--primary" : ""}`}
            onClick={() => switchTo("name")}
          >
            {t("login.companyName")}
          </button>
          <button
            type="button"
            className={`btn${by === "id" ? " btn--primary" : ""}`}
            onClick={() => switchTo("id")}
          >
            {t("login.organizationId")}
          </button>
        </div>

        <form onSubmit={submit} noValidate>
          {by === "name" ? (
            <Field
              label={t("login.companyName")}
              value={form.companyName}
              onChange={update("companyName")}
              error={errors.companyName}
              autoComplete="organization"
              autoFocus
            />
          ) : (
            <Field
              label={t("login.organizationId")}
              type="number"
              min="0"
              step="1"
              value={form.tenantId}
              onChange={update("tenantId")}
              error={errors.tenantId}
              autoFocus
            />
          )}
          <Field
            label={t("login.idNumber")}
            type="number"
            min="1"
            step="1"
            value={form.idUser}
            onChange={update("idUser")}
            error={errors.idUser}
            hint={t("login.idNumberHint")}
            autoComplete="username"
          />
          <Field
            label={t("login.password")}
            type="password"
            value={form.password}
            onChange={update("password")}
            error={errors.password}
            autoComplete="current-password"
          />
          <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
            {busy ? t("login.submitting") : t("login.submit")}
          </button>
        </form>
        <p className="card__hint" style={{ marginTop: "1rem", marginBottom: 0 }}>
          {t("login.newHere")} <Link to="/signup/organization">{t("login.setUpOrganization")}</Link>.
        </p>
      </div>
    </Layout>
  );
}
