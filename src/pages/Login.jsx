import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import Notice from "../components/Notice.jsx";
import Field from "../components/Field.jsx";
import { useAuth } from "../auth/AuthContext.jsx";

export default function Login() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { signIn, isAuthenticated } = useAuth();

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
        next.tenantId = "Enter the organization ID as a number.";
      }
    } else if (!form.companyName.trim()) {
      next.companyName = "Enter your company name.";
    }
    if (!/^\d+$/.test(form.idUser)) {
      next.idUser = "Enter your ID number.";
    }
    if (!form.password) {
      next.password = "Enter your password.";
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
      setFailure(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Layout>
      <div className="card card--narrow">
        <h1 className="card__title">Log in</h1>
        <p className="card__hint">Identify your organization by name, or by the number it was given.</p>
        <Notice kind="error">{failure}</Notice>

        <div className="row" style={{ marginBottom: "1rem" }}>
          <button
            type="button"
            className={`btn${by === "name" ? " btn--primary" : ""}`}
            onClick={() => switchTo("name")}
          >
            Company name
          </button>
          <button
            type="button"
            className={`btn${by === "id" ? " btn--primary" : ""}`}
            onClick={() => switchTo("id")}
          >
            Organization ID
          </button>
        </div>

        <form onSubmit={submit} noValidate>
          {by === "name" ? (
            <Field
              label="Company name"
              value={form.companyName}
              onChange={update("companyName")}
              error={errors.companyName}
              autoComplete="organization"
              autoFocus
            />
          ) : (
            <Field
              label="Organization ID"
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
            label="ID number"
            type="number"
            min="1"
            step="1"
            value={form.idUser}
            onChange={update("idUser")}
            error={errors.idUser}
            hint="Your national ID number."
            autoComplete="username"
          />
          <Field
            label="Password"
            type="password"
            value={form.password}
            onChange={update("password")}
            error={errors.password}
            autoComplete="current-password"
          />
          <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
            {busy ? "Signing in…" : "Log in"}
          </button>
        </form>
        <p className="card__hint" style={{ marginTop: "1rem", marginBottom: 0 }}>
          New here? <Link to="/signup/organization">Set up an organization</Link>.
        </p>
      </div>
    </Layout>
  );
}
