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

  const [form, setForm] = useState({
    tenantId: state?.tenantId != null ? String(state.tenantId) : "",
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

  function validate() {
    const next = {};
    if (!/^\d+$/.test(form.tenantId)) {
      next.tenantId = "Enter the organization ID as a number.";
    }
    if (!/^\d+$/.test(form.idUser)) {
      next.idUser = "Enter your user ID as a number.";
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
        tenantId: Number(form.tenantId),
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
        <p className="card__hint">Use the organization ID and the user ID you were given.</p>
        <Notice kind="error">{failure}</Notice>
        <form onSubmit={submit} noValidate>
          <Field
            label="Organization ID"
            type="number"
            min="0"
            step="1"
            value={form.tenantId}
            onChange={update("tenantId")}
            error={errors.tenantId}
            autoFocus={!form.tenantId}
          />
          <Field
            label="User ID"
            type="number"
            min="1"
            step="1"
            value={form.idUser}
            onChange={update("idUser")}
            error={errors.idUser}
            autoComplete="username"
          />
          <Field
            label="Password"
            type="password"
            value={form.password}
            onChange={update("password")}
            error={errors.password}
            autoComplete="current-password"
            autoFocus={Boolean(form.tenantId)}
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
