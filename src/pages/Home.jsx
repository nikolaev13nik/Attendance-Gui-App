import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import { useAuth } from "../auth/AuthContext.jsx";
import { displayName, isAdministrator } from "../auth/roles.js";

export default function Home() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const admin = isAdministrator(profile);

  return (
    <Layout>
      <div className="card card--narrow">
        <h1 className="card__title">Welcome, {displayName(profile)}</h1>
        <p className="card__hint">
          {admin
            ? "You are an administrator of this organization."
            : "Record the start and end of your work sessions here."}
        </p>
        <div className="stack">
          <button
            type="button"
            className="btn btn--primary btn--block btn--large"
            onClick={() => navigate("/session")}
          >
            Report session
          </button>
          {admin ? (
            <>
              <button
                type="button"
                className="btn btn--block btn--large"
                onClick={() => navigate("/users")}
              >
                Manage users
              </button>
              <button
                type="button"
                className="btn btn--block btn--large"
                onClick={() => navigate("/sessions")}
              >
                Review sessions
              </button>
              <button
                type="button"
                className="btn btn--block btn--large"
                onClick={() => navigate("/leave-days")}
              >
                Report leave days
              </button>
            </>
          ) : null}
        </div>
      </div>
    </Layout>
  );
}
