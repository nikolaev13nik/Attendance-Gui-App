import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import Notice from "../components/Notice.jsx";
import Field from "../components/Field.jsx";
import { registerUser } from "../api/accounting.js";
import { isAdministrator } from "../auth/roles.js";

export default function SignUpAdmin() {
  const navigate = useNavigate();
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
      next.idUser = "Enter a whole number of 1 or more.";
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      next.email = "Enter a valid email address.";
    }
    if (form.password.length < 4) {
      next.password = "Use at least 4 characters.";
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
          <h1 className="card__title">Organization ready</h1>
          <Notice kind={admin ? "success" : "error"}>
            {admin
              ? `${companyName} is set up, and user ${created.idUser} is its administrator.`
              : `User ${created.idUser} was created but did not receive the administrator role. An existing administrator will have to grant it.`}
          </Notice>
          <div className="clock__state">
            <dl>
              <dt>Organization</dt>
              <dd>
                {companyName} (ID {tenantId})
              </dd>
              <dt>ID number</dt>
              <dd>{created.idUser}</dd>
              <dt>Roles granted</dt>
              <dd>
                {(created.roles || []).map((role) => (
                  <span
                    key={role}
                    className={`tag${role.toUpperCase() === "ADMINISTRATOR" ? " tag--admin" : ""}`}
                  >
                    {role}
                  </span>
                ))}
              </dd>
            </dl>
          </div>
          <p className="card__hint">
            Sign in with the company name, that ID number and the password you just chose.
          </p>
          <button
            type="button"
            className="btn btn--primary btn--block"
            onClick={() => navigate("/login", { state: { companyName, idUser: created.idUser } })}
          >
            Continue to log in
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout orgName={companyName}>
      <div className="card card--narrow">
        <h1 className="card__title">Step 2 of 2 — the administrator</h1>
        <p className="card__hint">
          This is the first user of {companyName}, so it is granted the administrator role automatically.
        </p>
        <Notice kind="error">{failure}</Notice>
        <form onSubmit={submit} noValidate>
          <Field
            label="ID number"
            type="number"
            min="1"
            step="1"
            value={form.idUser}
            onChange={update("idUser")}
            error={errors.idUser}
            hint="The person's national ID number. This is what they sign in with."
            autoFocus
          />
          <div className="grid-2">
            <Field label="First name" value={form.firstName} onChange={update("firstName")} autoComplete="given-name" />
            <Field label="Last name" value={form.lastName} onChange={update("lastName")} autoComplete="family-name" />
          </div>
          <Field
            label="Email"
            type="email"
            value={form.email}
            onChange={update("email")}
            error={errors.email}
            autoComplete="email"
          />
          <Field
            label="Password"
            type="password"
            value={form.password}
            onChange={update("password")}
            error={errors.password}
            autoComplete="new-password"
          />
          <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
            {busy ? "Creating…" : "Create administrator"}
          </button>
        </form>
        <p className="card__hint" style={{ marginTop: "1rem", marginBottom: 0 }}>
          <Link to="/signup/organization">Back to step 1</Link>
        </p>
      </div>
    </Layout>
  );
}
