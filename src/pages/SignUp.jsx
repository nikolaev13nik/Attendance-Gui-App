import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import Notice from "../components/Notice.jsx";
import Field from "../components/Field.jsx";
import { signUp } from "../api/accounting.js";
import { msg, useI18n } from "../i18n/I18nContext.jsx";

const EMPTY_FORM = {
  companyName: "",
  phone: "",
  idUser: "",
  firstName: "",
  lastName: "",
  email: "",
  password: "",
};

export default function SignUp() {
  const navigate = useNavigate();
  const { t, roleLabel } = useI18n();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState(null);
  const [created, setCreated] = useState(null);
  const [busy, setBusy] = useState(false);

  const update = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  function validate() {
    const next = {};
    if (!form.companyName.trim()) {
      next.companyName = msg("signup.error.companyName");
    }
    if (!form.phone.trim()) {
      next.phone = msg("signup.error.phone");
    }
    if (!/^\d+$/.test(form.idUser) || Number(form.idUser) < 1) {
      next.idUser = msg("validation.wholeNumber");
    }
    if (!form.firstName.trim()) {
      next.firstName = msg("signup.error.firstName");
    }
    if (!form.lastName.trim()) {
      next.lastName = msg("signup.error.lastName");
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      next.email = msg("validation.email");
    }
    if (form.password.length < 4) {
      next.password = msg("validation.passwordLength");
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
      const result = await signUp({
        companyName: form.companyName.trim(),
        phone: form.phone.trim(),
        idUser: Number(form.idUser),
        password: form.password,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
      });
      setCreated(result);
    } catch (error) {
      setFailure(error);
    } finally {
      setBusy(false);
    }
  }

  if (created) {
    const { tenant, admin } = created;
    return (
      <Layout orgName={tenant.companyName}>
        <div className="card card--narrow">
          <h1 className="card__title">{t("signup.readyTitle")}</h1>
          <Notice kind="success">
            {t("signup.ready", { company: tenant.companyName, id: admin.idUser })}
          </Notice>
          <div className="clock__state">
            <dl>
              <dt>{t("signup.organization")}</dt>
              <dd>
                {t("signup.organizationValue", { company: tenant.companyName, id: tenant.tenantId })}
              </dd>
              <dt>{t("common.idNumber")}</dt>
              <dd>{admin.idUser}</dd>
              <dt>{t("signup.roles")}</dt>
              <dd>
                {(admin.roles || []).map((role) => (
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
          <p className="card__hint">{t("signup.signInHint")}</p>
          <button
            type="button"
            className="btn btn--primary btn--block"
            onClick={() =>
              navigate("/login", { state: { companyName: tenant.companyName, idUser: admin.idUser } })
            }
          >
            {t("signup.continue")}
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout orgName={form.companyName.trim() || undefined}>
      <div className="card card--narrow">
        <h1 className="card__title">{t("signup.title")}</h1>
        <p className="card__hint">{t("signup.hint")}</p>
        <Notice kind="error">{failure}</Notice>
        <form onSubmit={submit} noValidate>
          <h2 style={{ fontSize: "1.05rem" }}>{t("signup.sectionOrganization")}</h2>
          <Field
            label={t("login.companyName")}
            value={form.companyName}
            onChange={update("companyName")}
            error={errors.companyName}
            autoComplete="organization"
            autoFocus
          />
          <Field
            label={t("signup.phone")}
            type="tel"
            value={form.phone}
            onChange={update("phone")}
            error={errors.phone}
            autoComplete="tel"
          />
          <h2 style={{ fontSize: "1.05rem" }}>{t("signup.sectionAdmin")}</h2>
          <Field
            label={t("common.idNumber")}
            type="number"
            min="1"
            step="1"
            value={form.idUser}
            onChange={update("idUser")}
            error={errors.idUser}
            hint={t("common.idNumberHint")}
          />
          <div className="grid-2">
            <Field
              label={t("common.firstName")}
              value={form.firstName}
              onChange={update("firstName")}
              error={errors.firstName}
              autoComplete="given-name"
            />
            <Field
              label={t("common.lastName")}
              value={form.lastName}
              onChange={update("lastName")}
              error={errors.lastName}
              autoComplete="family-name"
            />
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
            {busy ? t("common.creating") : t("signup.submit")}
          </button>
        </form>
        <p className="card__hint" style={{ marginTop: "1rem", marginBottom: 0 }}>
          {t("signup.haveOrg")} <Link to="/login">{t("login.submit")}</Link>.
        </p>
      </div>
    </Layout>
  );
}
