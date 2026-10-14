import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import Notice from "../components/Notice.jsx";
import Field from "../components/Field.jsx";
import { addTenant } from "../api/accounting.js";

export default function SignUpOrg() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ companyName: "", contactName: "", phone: "", email: "" });
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState(null);
  const [busy, setBusy] = useState(false);

  const update = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  function validate() {
    const next = {};
    if (!form.companyName.trim()) {
      next.companyName = "Enter the company name.";
    }
    if (!form.contactName.trim()) {
      next.contactName = "Enter who is responsible for the organization.";
    }
    if (!form.phone.trim()) {
      next.phone = "Enter a contact phone number.";
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      next.email = "Enter a valid email address.";
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
        <h1 className="card__title">Step 1 of 2 — your organization</h1>
        <p className="card__hint">
          The company name becomes the heading on every screen, and you can sign in with it. Your
          organization number is assigned for you.
        </p>
        <Notice kind="error">{failure}</Notice>
        <form onSubmit={submit} noValidate>
          <Field
            label="Company name"
            value={form.companyName}
            onChange={update("companyName")}
            error={errors.companyName}
            autoComplete="organization"
            autoFocus
          />
          <Field
            label="Contact name"
            value={form.contactName}
            onChange={update("contactName")}
            error={errors.contactName}
            autoComplete="name"
          />
          <Field
            label="Phone"
            type="tel"
            value={form.phone}
            onChange={update("phone")}
            error={errors.phone}
            autoComplete="tel"
          />
          <Field
            label="Contact email"
            type="email"
            value={form.email}
            onChange={update("email")}
            error={errors.email}
            autoComplete="email"
          />
          <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
            {busy ? "Creating…" : "Create organization"}
          </button>
        </form>
        <p className="card__hint" style={{ marginTop: "1rem", marginBottom: 0 }}>
          Already have an organization? <Link to="/login">Log in</Link>.
        </p>
      </div>
    </Layout>
  );
}
