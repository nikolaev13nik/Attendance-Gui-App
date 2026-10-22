import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import Notice from "../components/Notice.jsx";
import Field from "../components/Field.jsx";
import SessionTable, { LEAVE_AMOUNTS as AMOUNTS, leaveEntries } from "../components/SessionTable.jsx";
import { listUsers } from "../api/accounting.js";
import { addLeaveDays, getLeaveDays, getSessions } from "../api/timetracking.js";
import { daysAgo, localWorkDate } from "../api/time.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { displayName } from "../auth/roles.js";
import { msg, useI18n } from "../i18n/I18nContext.jsx";

const emptyRow = () => ({ date: localWorkDate(), vacation: "1", sick: "0" });

export default function LeaveDays() {
  const navigate = useNavigate();
  const { token, profile } = useAuth();
  const { t, text } = useI18n();
  const tenantId = profile.tenantId;

  const [users, setUsers] = useState([]);
  const [idUser, setIdUser] = useState(String(profile.idUser));
  const [rows, setRows] = useState([emptyRow()]);
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState(null);
  const [success, setSuccess] = useState(null);
  const [busy, setBusy] = useState(false);
  const [range, setRange] = useState({ startDate: daysAgo(7), endDate: localWorkDate() });
  const [recorded, setRecorded] = useState(null);
  const [recordedLeave, setRecordedLeave] = useState([]);
  const [historyFailure, setHistoryFailure] = useState(null);
  const [sortDesc, setSortDesc] = useState(true);
  const [startDesc, setStartDesc] = useState(false);

  useEffect(() => {
    listUsers({ tenantId, token })
      .then((list) => setUsers(list || []))
      .catch((error) => setFailure(error));
  }, [tenantId, token]);

  const loadHistory = useCallback(async () => {
    setHistoryFailure(null);
    setRecorded(null);
    const query = {
      tenantId,
      token,
      idUser: Number(idUser),
      startDate: range.startDate,
      endDate: range.endDate,
    };
    try {
      const [sessions, leaveDays] = await Promise.all([getSessions(query), getLeaveDays(query)]);
      setRecorded(sessions || []);
      setRecordedLeave(leaveDays || []);
    } catch (error) {
      setHistoryFailure(error);
      setRecorded([]);
      setRecordedLeave([]);
    }
  }, [idUser, range, tenantId, token]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const updateRow = (index, key) => (event) =>
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [key]: event.target.value } : row)));

  const updateRange = (field) => (event) => setRange((prev) => ({ ...prev, [field]: event.target.value }));

  const addRow = () => setRows((prev) => [...prev, emptyRow()]);
  const removeRow = (index) => setRows((prev) => prev.filter((_, i) => i !== index));

  function validate() {
    const next = {};
    const seen = new Set();
    rows.forEach((row, index) => {
      if (!row.date) {
        next[index] = msg("common.pickDate");
        return;
      }
      if (seen.has(row.date)) {
        next[index] = msg("leaveDays.error.duplicate");
        return;
      }
      seen.add(row.date);
      const total = Number(row.vacation) + Number(row.sick);
      if (total === 0) {
        next[index] = msg("leaveDays.error.none");
      } else if (total > 1) {
        next[index] = msg("leaveDays.error.max");
      }
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit(event) {
    event.preventDefault();
    setFailure(null);
    setSuccess(null);
    if (!validate()) {
      return;
    }
    setBusy(true);
    try {
      const days = rows.map((row) => {
        const entry = { date: row.date };
        if (Number(row.vacation) > 0) {
          entry.vacationAmount = Number(row.vacation);
        }
        if (Number(row.sick) > 0) {
          entry.sickAmount = Number(row.sick);
        }
        return entry;
      });
      await addLeaveDays({ tenantId, idUser: Number(idUser), days, token });
      const who = users.find((user) => String(user.idUser) === idUser);
      setSuccess(
        msg("leaveDays.recorded", {
          count: days.length,
          name: who ? displayName(who) : msg("leaveDays.user", { id: idUser }),
        }),
      );
      setRows([emptyRow()]);
      await loadHistory();
    } catch (error) {
      setFailure(error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Layout>
      <div className="card">
        <div className="row row--split" style={{ marginBottom: "0.75rem" }}>
          <div>
            <h1 className="card__title" style={{ marginBottom: 0 }}>
              {t("home.reportLeave")}
            </h1>
            <p className="card__hint" style={{ marginBottom: 0 }}>
              {t("leaveDays.hint")}
            </p>
          </div>
          <button type="button" className="btn" onClick={() => navigate("/home")}>
            {t("common.back")}
          </button>
        </div>

        <Notice kind="error">{failure}</Notice>
        <Notice kind="success">{success}</Notice>
        <Notice kind="info">
          {t("leaveDays.info")}
        </Notice>

        <form onSubmit={submit} noValidate>
          <Field
            label={t("common.employee")}
            as="select"
            value={idUser}
            onChange={(event) => setIdUser(event.target.value)}
          >
            {users.map((user) => (
              <option key={user.idUser} value={String(user.idUser)}>
                {displayName(user)} ({user.idUser})
              </option>
            ))}
          </Field>

          <div className="table-wrap">
            <table className="table" style={{ marginBottom: "0.75rem" }}>
              <thead>
                <tr>
                  <th>{t("common.date")}</th>
                  <th>{t("common.vacation")}</th>
                  <th>{t("common.sickness")}</th>
                  <th aria-label={t("common.actions")} />
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={index}>
                    <td>
                      <input
                        type="date"
                        className={`field__input${errors[index] ? " field__input--invalid" : ""}`}
                        value={row.date}
                        onChange={updateRow(index, "date")}
                        aria-label={t("leaveDays.rowDate", { row: index + 1 })}
                      />
                      {errors[index] ? <span className="field__error">{text(errors[index])}</span> : null}
                    </td>
                    <td>
                      <select
                        className="field__input"
                        value={row.vacation}
                        onChange={updateRow(index, "vacation")}
                        aria-label={t("leaveDays.rowVacation", { row: index + 1 })}
                      >
                        {AMOUNTS.map((amount) => (
                          <option key={amount.value} value={amount.value}>
                            {t(amount.label)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        className="field__input"
                        value={row.sick}
                        onChange={updateRow(index, "sick")}
                        aria-label={t("leaveDays.rowSick", { row: index + 1 })}
                      >
                        {AMOUNTS.map((amount) => (
                          <option key={amount.value} value={amount.value}>
                            {t(amount.label)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn--link"
                        disabled={rows.length === 1}
                        onClick={() => removeRow(index)}
                      >
                        {t("leaveDays.remove")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="row row--split">
            <button type="button" className="btn" onClick={addRow}>
              {t("leaveDays.addDate")}
            </button>
            <button type="submit" className="btn btn--primary" disabled={busy}>
              {busy ? t("common.saving") : t("leaveDays.submit")}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <h2 className="card__title">{t("common.alreadyRecorded")}</h2>
        <Notice kind="info">
          {t("leaveDays.readOnly")}
        </Notice>
        <Notice kind="error">{historyFailure}</Notice>

        <div className="row" style={{ alignItems: "flex-end", marginBottom: "1rem" }}>
          <Field label={t("common.from")} type="date" value={range.startDate} onChange={updateRange("startDate")} />
          <Field label={t("common.to")} type="date" value={range.endDate} onChange={updateRange("endDate")} />
        </div>

        {recorded === null ? (
          <p className="spinner">{t("common.loading")}</p>
        ) : leaveEntries(recorded, recordedLeave, sortDesc, startDesc).length === 0 ? (
          <p className="spinner">{t("leaveDays.nothing")}</p>
        ) : (
          <SessionTable
            sessions={recorded}
            leave={recordedLeave}
            sortDesc={sortDesc}
            startDesc={startDesc}
            onToggleSort={() => setSortDesc((d) => !d)}
            onToggleStartSort={() => setStartDesc((d) => !d)}
          />
        )}
      </div>
    </Layout>
  );
}
