import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import MessageAdmin from "../components/MessageAdmin.jsx";
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
          <button
            type="button"
            className="btn btn--block btn--large"
            onClick={() => navigate("/sessions")}
          >
            {admin ? "Review sessions" : "My sessions"}
          </button>
          {admin ? (
            <>
              <button
                type="button"
                className="btn btn--block btn--large"
                onClick={() => navigate("/leave-days")}
              >
                Report leave days
              </button>
              <button
                type="button"
                className="btn btn--block btn--large"
                onClick={() => navigate("/statistics")}
              >
                Employee statistics
              </button>
              <button
                type="button"
                className="btn btn--block btn--large"
                onClick={() => navigate("/users")}
              >
                Manage users
              </button>
            </>
          ) : null}
        </div>

        {admin ? null : (
          <>
            <hr style={{ margin: "1.5rem 0 1rem", border: "none", borderTop: "1px solid var(--border)" }} />
            <MessageAdmin
              heading="Need something corrected?"
              hint="Recording leave days and correcting sessions is done by an administrator. Send them the details and they will put it in for you."
              subject={`Attendance request - ${displayName(profile)} (ID ${profile.idUser})`}
              bodyTemplate={
                "Hello,\n\nPlease record the following for me:\n\n" +
                "Date(s): \nVacation or sick leave: \nSession times to correct: "
              }
            />
          </>
        )}
      </div>
    </Layout>
  );
}
