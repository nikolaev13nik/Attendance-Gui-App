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

const emptyRow = () => ({ date: localWorkDate(), vacation: "1", sick: "0" });

export default function LeaveDays() {
  const navigate = useNavigate();
  const { token, profile } = useAuth();
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
      .catch((error) => setFailure(error.message));
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
      setHistoryFailure(error.message);
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
        next[index] = "Pick a date.";
        return;
      }
      if (seen.has(row.date)) {
        next[index] = "This date appears more than once.";
        return;
      }
      seen.add(row.date);
      const total = Number(row.vacation) + Number(row.sick);
      if (total === 0) {
        next[index] = "Choose vacation, sick, or both.";
      } else if (total > 1) {
        next[index] = "Vacation and sick together cannot exceed one full day.";
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
        `Recorded ${days.length} leave ${days.length === 1 ? "day" : "days"} for ${
          who ? displayName(who) : `user ${idUser}`
        }.`,
      );
      setRows([emptyRow()]);
      await loadHistory();
    } catch (error) {
      setFailure(error.message);
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
              Report leave days
            </h1>
            <p className="card__hint" style={{ marginBottom: 0 }}>
              Record vacation and sick days for an employee.
            </p>
          </div>
          <button type="button" className="btn" onClick={() => navigate("/home")}>
            Back
          </button>
        </div>

        <Notice kind="error">{failure}</Notice>
        <Notice kind="success">{success}</Notice>
        <Notice kind="info">
          One record per date: reporting a date again updates what was stored for it rather than adding
          a second row. Vacation and sickness on the same date cannot exceed a full day together, and the
          totals appear under employee statistics.
        </Notice>

        <form onSubmit={submit} noValidate>
          <Field
            label="Employee"
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

          <table className="table" style={{ marginBottom: "0.75rem" }}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Vacation</th>
                <th>Sick</th>
                <th aria-label="Actions" />
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
                      aria-label={`Date for row ${index + 1}`}
                    />
                    {errors[index] ? <span className="field__error">{errors[index]}</span> : null}
                  </td>
                  <td>
                    <select
                      className="field__input"
                      value={row.vacation}
                      onChange={updateRow(index, "vacation")}
                      aria-label={`Vacation for row ${index + 1}`}
                    >
                      {AMOUNTS.map((amount) => (
                        <option key={amount.value} value={amount.value}>
                          {amount.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      className="field__input"
                      value={row.sick}
                      onChange={updateRow(index, "sick")}
                      aria-label={`Sick for row ${index + 1}`}
                    >
                      {AMOUNTS.map((amount) => (
                        <option key={amount.value} value={amount.value}>
                          {amount.label}
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
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="row row--split">
            <button type="button" className="btn" onClick={addRow}>
              Add another date
            </button>
            <button type="submit" className="btn btn--primary" disabled={busy}>
              {busy ? "Saving…" : "Record leave days"}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <h2 className="card__title">What is already recorded</h2>
        <Notice kind="info">
          This list is read-only. To change or delete a record, use the Review sessions control panel.
        </Notice>
        <Notice kind="error">{historyFailure}</Notice>

        <div className="row" style={{ alignItems: "flex-end", marginBottom: "1rem" }}>
          <Field label="From" type="date" value={range.startDate} onChange={updateRange("startDate")} />
          <Field label="To" type="date" value={range.endDate} onChange={updateRange("endDate")} />
        </div>

        {recorded === null ? (
          <p className="spinner">Loading…</p>
        ) : leaveEntries(recorded, recordedLeave, sortDesc, startDesc).length === 0 ? (
          <p className="spinner">Nothing recorded in that range.</p>
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
