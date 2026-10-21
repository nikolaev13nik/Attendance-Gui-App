import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import Notice from "../components/Notice.jsx";
import Field from "../components/Field.jsx";
import { addTenant } from "../api/accounting.js";
import { useI18n } from "../i18n/I18nContext.jsx";

export default function SignUpOrg() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [form, setForm] = useState({ companyName: "", contactName: "", phone: "", email: "" });
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState(null);
  const [busy, setBusy] = useState(false);

  const update = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  function validate() {
    const next = {};
    if (!form.companyName.trim()) {
      next.companyName = t("signupOrg.error.companyName");
    }
    if (!form.contactName.trim()) {
      next.contactName = t("signupOrg.error.contactName");
    }
    if (!form.phone.trim()) {
      next.phone = t("signupOrg.error.phone");
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      next.email = t("validation.email");
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
      const tenant = await addTenant({
        companyName: form.companyName.trim(),
        contactName: form.contactName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
      });
      navigate("/signup/administrator", {
        state: { tenantId: tenant.tenantId, companyName: tenant.companyName },
      });
    } catch (error) {
      setFailure(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Layout orgName={form.companyName.trim() || undefined}>
      <div className="card card--narrow">
        <h1 className="card__title">{t("signupOrg.title")}</h1>
        <p className="card__hint">
          {t("signupOrg.hint")}
        </p>
        <Notice kind="error">{failure}</Notice>
        <form onSubmit={submit} noValidate>
          <Field
            label={t("login.companyName")}
            value={form.companyName}
            onChange={update("companyName")}
            error={errors.companyName}
            autoComplete="organization"
            autoFocus
          />
          <Field
            label={t("signupOrg.contactName")}
            value={form.contactName}
            onChange={update("contactName")}
            error={errors.contactName}
            autoComplete="name"
          />
          <Field
            label={t("signupOrg.phone")}
            type="tel"
            value={form.phone}
            onChange={update("phone")}
            error={errors.phone}
            autoComplete="tel"
          />
          <Field
            label={t("signupOrg.contactEmail")}
            type="email"
            value={form.email}
            onChange={update("email")}
            error={errors.email}
            autoComplete="email"
          />
          <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
            {busy ? t("common.creating") : t("signupOrg.submit")}
          </button>
        </form>
        <p className="card__hint" style={{ marginTop: "1rem", marginBottom: 0 }}>
          {t("signupOrg.haveOrg")} <Link to="/login">{t("login.submit")}</Link>.
        </p>
      </div>
    </Layout>
  );
}
