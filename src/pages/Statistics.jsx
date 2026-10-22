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
import { msg, useI18n } from "../i18n/I18nContext.jsx";

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
  const { t } = useI18n();
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
      .catch((error) => setFailure(error));
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
          ? msg("statistics.computedReport")
          : msg("statistics.computed"),
      );
    } catch (error) {
      setFailure(error);
      setResults([]);
    } finally {
      setBusy(false);
    }
  }

  function submit(event) {
    event.preventDefault();
    if (!targetMonth) {
      setFailure(msg("statistics.pickMonth"));
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
    return found ? `${displayName(found)} (${userId})` : t("leaveDays.user", { id: userId });
  }

  return (
    <Layout>
      <div className="card">
        <div className="row row--split" style={{ marginBottom: "0.75rem" }}>
          <div>
            <h1 className="card__title" style={{ marginBottom: 0 }}>
              {t("home.statistics")}
            </h1>
            <p className="card__hint" style={{ marginBottom: 0 }}>
              {t("statistics.hint")}
            </p>
          </div>
          <button type="button" className="btn" onClick={() => navigate("/home")}>
            {t("common.back")}
          </button>
        </div>

        {confirmFanOut ? null : <Notice kind="error">{failure}</Notice>}
        <Notice kind="success">{success}</Notice>

        <form onSubmit={submit} noValidate>
          <div className="row" style={{ alignItems: "flex-end" }}>
            <Field
              label={t("common.month")}
              type="month"
              value={targetMonth}
              onChange={(event) => setTargetMonth(event.target.value)}
            />
            <div className="field" style={{ minWidth: "16rem" }}>
              <label className="field__label" htmlFor="statistic-user">
                {t("common.employee")}
              </label>
              <select
                id="statistic-user"
                className="field__input"
                value={idUser}
                onChange={(event) => setIdUser(event.target.value)}
              >
                <option value={ALL_EMPLOYEES}>{t("statistics.allEmployees")}</option>
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
                style={{ marginInlineEnd: "0.5rem" }}
              />
              {t("statistics.reportLabel")}
            </label>
            <span className="field__hint">
              {t("statistics.reportHint")}
            </span>
          </div>

          {fanOut ? (
            <Notice kind="error">
              {t("statistics.fanOutWarning")}
            </Notice>
          ) : null}

          <div className="row row--end">
            <button type="submit" className="btn btn--primary" disabled={busy}>
              {busy ? t("common.computing") : t("statistics.run")}
            </button>
          </div>
        </form>
      </div>

      {results !== null ? (
        <div className="card">
          <h2 className="card__title">
            {targetMonth} - {everyEmployee ? t("statistics.allEmployeesLower") : nameOf(Number(idUser))}
          </h2>
          {results.length === 0 ? (
            <p className="spinner">{t("statistics.nothing")}</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t("common.employee")}</th>
                    <th>{t("common.month")}</th>
                    <th>{t("statistics.workDays")}</th>
                    <th>{t("statistics.totalHours")}</th>
                    <th>{t("statistics.overtime")}</th>
                    <th>{t("statistics.vacationDays")}</th>
                    <th>{t("statistics.sickDays")}</th>
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
            </div>
          )}
        </div>
      ) : null}

      {confirmFanOut ? (
        <Modal
          title={t("statistics.confirmTitle")}
          onClose={() => setConfirmFanOut(false)}
          actions={
            <>
              <button type="button" className="btn" onClick={() => setConfirmFanOut(false)}>
                {t("common.cancel")}
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
                {busy ? t("common.computing") : t("statistics.send")}
              </button>
            </>
          }
        >
          <p style={{ marginTop: 0 }}>
            {t("statistics.confirmBody", { month: targetMonth })}
          </p>
        </Modal>
      ) : null}
    </Layout>
  );
}
