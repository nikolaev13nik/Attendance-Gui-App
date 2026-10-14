import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import Notice from "../components/Notice.jsx";
import Field from "../components/Field.jsx";
import Modal from "../components/Modal.jsx";
import { listUsers } from "../api/accounting.js";
import { getMonthStatistic } from "../api/timetracking.js";
import { localMonth } from "../api/time.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { displayName } from "../auth/roles.js";

const ALL_EMPLOYEES = "";

function hours(value) {
  return value === null || value === undefined ? "—" : value.toFixed(2);
}

function days(value) {
  return value === null || value === undefined ? "—" : String(value);
}

export default function Statistics() {
  const navigate = useNavigate();
  const { token, profile } = useAuth();
  const tenantId = profile.tenantId;

  const [users, setUsers] = useState([]);
  const [targetMonth, setTargetMonth] = useState(localMonth());
  const [idUser, setIdUser] = useState(ALL_EMPLOYEES);
  const [report, setReport] = useState(false);
  const [confirmFanOut, setConfirmFanOut] = useState(false);
  const [results, setResults] = useState(null);
  const [failure, setFailure] = useState(null);
  const [success, setSuccess] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listUsers({ tenantId, token })
      .then((list) => setUsers(list || []))
      .catch((error) => setFailure(error.message));
  }, [tenantId, token]);

  const everyEmployee = idUser === ALL_EMPLOYEES;
  const fanOut = report && everyEmployee;

  async function run() {
    setFailure(null);
    setSuccess(null);
    setBusy(true);
    try {
      const body = await getMonthStatistic({ tenantId, token, targetMonth, idUser, report });
      setResults(body || []);
      setSuccess(
        report
          ? "Statistics computed. The AI analysis is emailed to you once it is ready."
          : "Statistics computed.",
      );
    } catch (error) {
      setFailure(error.message);
      setResults([]);
    } finally {
      setBusy(false);
    }
  }

  function submit(event) {
    event.preventDefault();
    if (!targetMonth) {
      setFailure("Pick a month.");
      return;
    }
    if (fanOut) {
      setConfirmFanOut(true);
      return;
    }
    run();
  }

  function nameOf(userId) {
    const found = users.find((user) => user.idUser === userId);
    return found ? `${displayName(found)} (${userId})` : `User ${userId}`;
  }

  return (
    <Layout>
      <div className="card">
        <div className="row row--split" style={{ marginBottom: "0.75rem" }}>
          <div>
            <h1 className="card__title" style={{ marginBottom: 0 }}>
              Employee statistics
            </h1>
            <p className="card__hint" style={{ marginBottom: 0 }}>
              Worked days, hours, overtime and leave for a month.
            </p>
          </div>
          <button type="button" className="btn" onClick={() => navigate("/home")}>
            Back
          </button>
        </div>

        {confirmFanOut ? null : <Notice kind="error">{failure}</Notice>}
        <Notice kind="success">{success}</Notice>

        <form onSubmit={submit} noValidate>
          <div className="row" style={{ alignItems: "flex-end" }}>
            <Field
              label="Month"
              type="month"
              value={targetMonth}
              onChange={(event) => setTargetMonth(event.target.value)}
            />
            <div className="field" style={{ minWidth: "16rem" }}>
              <label className="field__label" htmlFor="statistic-user">
                Employee
              </label>
              <select
                id="statistic-user"
                className="field__input"
                value={idUser}
                onChange={(event) => setIdUser(event.target.value)}
              >
                <option value={ALL_EMPLOYEES}>All employees</option>
                {users.map((user) => (
                  <option key={user.idUser} value={String(user.idUser)}>
                    {displayName(user)} ({user.idUser})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="statistic-report">
              <input
                id="statistic-report"
                type="checkbox"
                checked={report}
                onChange={(event) => setReport(event.target.checked)}
                style={{ marginRight: "0.5rem" }}
              />
              Also email me an AI analysis
            </label>
            <span className="field__hint">
              Leave this off to just read the numbers. Turning it on asks the AI service for a trend
              analysis and emails it to you.
            </span>
          </div>

          {fanOut ? (
            <Notice kind="error">
              With every employee selected this sends one analysis per employee, so you will receive one
              email for each of them.
            </Notice>
          ) : null}

          <div className="row row--end">
            <button type="submit" className="btn btn--primary" disabled={busy}>
              {busy ? "Computing…" : "Run"}
            </button>
          </div>
        </form>
      </div>

      {results !== null ? (
        <div className="card">
          <h2 className="card__title">
            {targetMonth} {everyEmployee ? "- all employees" : `- ${nameOf(Number(idUser))}`}
          </h2>
          {results.length === 0 ? (
            <p className="spinner">Nothing recorded for that month.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Month</th>
                  <th>Work days</th>
                  <th>Total hours</th>
                  <th>Overtime hours</th>
                  <th>Vacation days</th>
                  <th>Sick days</th>
                </tr>
              </thead>
              <tbody>
                {results.map((stat) => (
                  <tr key={stat.userId}>
                    <td>{nameOf(stat.userId)}</td>
                    <td>{stat.yearMonth}</td>
                    <td>{days(stat.workDays)}</td>
                    <td>{hours(stat.totalWorkHours)}</td>
                    <td>{hours(stat.overtimeHours)}</td>
                    <td>{days(stat.vacationDays)}</td>
                    <td>{days(stat.sickDays)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : null}

      {confirmFanOut ? (
        <Modal
          title="Email an analysis for every employee?"
          onClose={() => setConfirmFanOut(false)}
          actions={
            <>
              <button type="button" className="btn" onClick={() => setConfirmFanOut(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn--primary"
                disabled={busy}
                onClick={() => {
                  setConfirmFanOut(false);
                  run();
                }}
              >
                {busy ? "Computing…" : "Send them"}
              </button>
            </>
          }
        >
          <p style={{ marginTop: 0 }}>
            The analysis is produced per employee, so this will send you one email for each employee who
            has activity in {targetMonth}. To get a single analysis, pick one employee instead.
          </p>
        </Modal>
      ) : null}
    </Layout>
  );
}
