import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout.jsx";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="card card--narrow">
        <h1 className="card__title">Attendance</h1>
        <p className="card__hint">
          Sign in to record your work sessions, or set up a new organization if this is your first visit.
        </p>
        <div className="stack">
          <button
            type="button"
            className="btn btn--primary btn--block btn--large"
            onClick={() => navigate("/login")}
          >
            Log in
          </button>
          <button
            type="button"
            className="btn btn--block btn--large"
            onClick={() => navigate("/signup/organization")}
          >
            Sign up a new organization
          </button>
        </div>
      </div>
    </Layout>
  );
}
