import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import Notice from "../components/Notice.jsx";
import Field from "../components/Field.jsx";
import { registerUser } from "../api/accounting.js";
import { isAdministrator } from "../auth/roles.js";
import { useI18n } from "../i18n/I18nContext.jsx";

export default function SignUpAdmin() {
  const navigate = useNavigate();
  const { t, roleLabel } = useI18n();
  const { state } = useLocation();
  const tenantId = state?.tenantId;
  const companyName = state?.companyName;

  const [form, setForm] = useState({ idUser: "", firstName: "", lastName: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState(null);
  const [created, setCreated] = useState(null);
  const [busy, setBusy] = useState(false);

  if (!tenantId) {
    return <Navigate to="/signup/organization" replace />;
  }

  const update = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  function validate() {
    const next = {};
    if (!/^\d+$/.test(form.idUser) || Number(form.idUser) < 1) {
      next.idUser = t("validation.wholeNumber");
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      next.email = t("validation.email");
    }
    if (form.password.length < 4) {
      next.password = t("validation.passwordLength");
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
      const profile = await registerUser({
        idUser: Number(form.idUser),
        password: form.password,
        email: form.email.trim(),
        tenantId,
        firstName: form.firstName.trim() || undefined,
        lastName: form.lastName.trim() || undefined,
      });
      setCreated(profile);
    } catch (error) {
      setFailure(error.message);
    } finally {
      setBusy(false);
    }
  }

  if (created) {
    const admin = isAdministrator(created);
    return (
      <Layout orgName={companyName}>
        <div className="card card--narrow">
          <h1 className="card__title">{t("signupAdmin.readyTitle")}</h1>
          <Notice kind={admin ? "success" : "error"}>
            {admin
              ? t("signupAdmin.ready", { company: companyName, id: created.idUser })
              : t("signupAdmin.notAdmin", { id: created.idUser })}
          </Notice>
          <div className="clock__state">
            <dl>
              <dt>{t("signupAdmin.organization")}</dt>
              <dd>
                {t("signupAdmin.organizationValue", { company: companyName, id: tenantId })}
              </dd>
              <dt>{t("common.idNumber")}</dt>
              <dd>{created.idUser}</dd>
              <dt>{t("signupAdmin.roles")}</dt>
              <dd>
                {(created.roles || []).map((role) => (
                  <span
                    key={role}
                    className={`tag${role.toUpperCase() === "ADMINISTRATOR" ? " tag--admin" : ""}`}
                  >
                    {roleLabel(role)}
                  </span>
                ))}
              </dd>
            </dl>
          </div>
          <p className="card__hint">
            {t("signupAdmin.signInHint")}
          </p>
          <button
            type="button"
            className="btn btn--primary btn--block"
            onClick={() => navigate("/login", { state: { companyName, idUser: created.idUser } })}
          >
            {t("signupAdmin.continue")}
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout orgName={companyName}>
      <div className="card card--narrow">
        <h1 className="card__title">{t("signupAdmin.title")}</h1>
        <p className="card__hint">
          {t("signupAdmin.hint", { company: companyName })}
        </p>
        <Notice kind="error">{failure}</Notice>
        <form onSubmit={submit} noValidate>
          <Field
            label={t("common.idNumber")}
            type="number"
            min="1"
            step="1"
            value={form.idUser}
            onChange={update("idUser")}
            error={errors.idUser}
            hint={t("common.idNumberHint")}
            autoFocus
          />
          <div className="grid-2">
            <Field label={t("common.firstName")} value={form.firstName} onChange={update("firstName")} autoComplete="given-name" />
            <Field label={t("common.lastName")} value={form.lastName} onChange={update("lastName")} autoComplete="family-name" />
          </div>
          <Field
            label={t("common.email")}
            type="email"
            value={form.email}
            onChange={update("email")}
            error={errors.email}
            autoComplete="email"
          />
          <Field
            label={t("common.password")}
            type="password"
            value={form.password}
            onChange={update("password")}
            error={errors.password}
            autoComplete="new-password"
          />
          <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
            {busy ? t("common.creating") : t("signupAdmin.submit")}
          </button>
        </form>
        <p className="card__hint" style={{ marginTop: "1rem", marginBottom: 0 }}>
          <Link to="/signup/organization">{t("signupAdmin.back")}</Link>
        </p>
      </div>
    </Layout>
  );
}
