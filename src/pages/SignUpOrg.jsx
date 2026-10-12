import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import Notice from "../components/Notice.jsx";
import Field from "../components/Field.jsx";
import { addTenant } from "../api/accounting.js";

export default function SignUpOrg() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ tenantName: "", tenantId: "", email: "" });
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState(null);
  const [busy, setBusy] = useState(false);

  const update = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  function validate() {
    const next = {};
    if (!form.tenantName.trim()) {
      next.tenantName = "Enter the company name.";
    }
    if (!/^\d+$/.test(form.tenantId) || Number(form.tenantId) < 1) {
      next.tenantId = "Enter a whole number of 1 or more.";
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
        tenantId: Number(form.tenantId),
        tenantName: form.tenantName.trim(),
        email: form.email.trim(),
      });
      navigate("/signup/administrator", {
        state: { tenantId: tenant.tenantId, tenantName: tenant.tenantName },
      });
    } catch (error) {
      setFailure(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Layout orgName={form.tenantName.trim() || undefined}>
      <div className="card card--narrow">
        <h1 className="card__title">Step 1 of 2 — your organization</h1>
        <p className="card__hint">
          The company name becomes the heading on every screen. The ID is a number you choose and will
          need every time you sign in, so keep it memorable.
        </p>
        <Notice kind="error">{failure}</Notice>
        <form onSubmit={submit} noValidate>
          <Field
            label="Company name"
            value={form.tenantName}
            onChange={update("tenantName")}
            error={errors.tenantName}
            autoComplete="organization"
            autoFocus
          />
          <Field
            label="Organization ID"
            type="number"
            min="1"
            step="1"
            value={form.tenantId}
            onChange={update("tenantId")}
            error={errors.tenantId}
            hint="A whole number, for example 2."
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
