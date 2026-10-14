import { useCallback, useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout.jsx";
import Notice from "../components/Notice.jsx";
import Field from "../components/Field.jsx";
import MessageAdmin from "../components/MessageAdmin.jsx";
import SessionTable, { leaveEntries } from "../components/SessionTable.jsx";
import { closeSession, getLeaveDays, getSessions, openSession } from "../api/timetracking.js";
import { daysAgo, formatLongDate, formatTime, localWorkDate } from "../api/time.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { displayName } from "../auth/roles.js";

function storageKey(tenantId, idUser, workDate) {
  return `attendance.session.${tenantId}.${idUser}.${workDate}`;
}

function readRecord(key) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeRecord(key, record) {
  try {
    sessionStorage.setItem(key, JSON.stringify(record));
  } catch {
    /* storage unavailable; the record stays in memory only */
  }
}

function statusOf(record) {
  if (!record) {
    return "none";
  }
  if (record.openSessionDate && !record.closeSessionDate) {
    return "open";
  }
  if (!record.openSessionDate && record.closeSessionDate) {
    return "orphan";
  }
  return "closed";
}

export default function Session() {
  const { token, profile } = useAuth();
  const { idUser, tenantId } = profile;
  const workDate = localWorkDate();
  const key = useMemo(() => storageKey(tenantId, idUser, workDate), [tenantId, idUser, workDate]);

  const [record, setRecord] = useState(() => readRecord(key));
  const [failure, setFailure] = useState(null);
  const [busy, setBusy] = useState(null);
  const [range, setRange] = useState({ startDate: daysAgo(7), endDate: workDate });
  const [rows, setRows] = useState(null);
  const [leave, setLeave] = useState([]);
  const [historyFailure, setHistoryFailure] = useState(null);

  useEffect(() => {
    setRecord(readRecord(key));
  }, [key]);

  const loadHistory = useCallback(async () => {
    setHistoryFailure(null);
    setRows(null);
    const query = { tenantId, token, idUser, startDate: range.startDate, endDate: range.endDate };
    try {
      const [sessions, leaveDays] = await Promise.all([getSessions(query), getLeaveDays(query)]);
      setRows(sessions || []);
      setLeave(leaveDays || []);
    } catch (error) {
      setHistoryFailure(error.message);
      setRows([]);
      setLeave([]);
    }
  }, [idUser, range, tenantId, token]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const run = useCallback(
    async (action, label) => {
      setFailure(null);
      setBusy(label);
      try {
        const next = await action({ tenantId, idUser, token });
        writeRecord(key, next);
        setRecord(next);
        await loadHistory();
      } catch (error) {
        setFailure(error.message);
      } finally {
        setBusy(null);
      }
    },
    [idUser, key, loadHistory, tenantId, token],
  );

  const status = statusOf(record);
  const openedAt = formatTime(record?.openSessionDate);
  const closedAt = formatTime(record?.closeSessionDate);
  const updateRange = (field) => (event) => setRange((prev) => ({ ...prev, [field]: event.target.value }));
  const entries = leaveEntries(rows, leave, true);

  return (
    <Layout>
      <div className="card card--narrow">
        <h1 className="card__title">Report session</h1>
        <p className="clock__date">{formatLongDate()}</p>

        <Notice kind="error">{failure}</Notice>
        {status === "orphan" ? (
          <Notice kind="error">
            This was recorded as a session end with no matching start. An administrator needs to correct
            it before reports for this period will run.
          </Notice>
        ) : null}

        <div className="clock__state">
          {status === "none" ? (
            <p style={{ margin: 0 }}>No session recorded yet today.</p>
          ) : (
            <dl>
              <dt>Started</dt>
              <dd>{openedAt || "not recorded"}</dd>
              <dt>Ended</dt>
              <dd>{closedAt || "still open"}</dd>
            </dl>
          )}
        </div>

        <div className="stack">
          {status === "open" ? (
            <button
              type="button"
              className="btn btn--primary btn--block btn--large"
              disabled={busy !== null}
              onClick={() => run(closeSession, "close")}
            >
              {busy === "close" ? "Recording…" : "Close session"}
            </button>
          ) : (
            <button
              type="button"
              className="btn btn--primary btn--block btn--large"
              disabled={busy !== null}
              onClick={() => run(openSession, "open")}
            >
              {busy === "open" ? "Recording…" : "Open session"}
            </button>
          )}

          {status === "closed" ? (
            <p className="card__hint" style={{ margin: 0 }}>
              Your last session ended at {closedAt}. Opening another one records a second period for
              today, which is how a break is logged.
            </p>
          ) : null}

          {status === "none" ? (
            <button
              type="button"
              className="btn btn--block"
              disabled={busy !== null}
              onClick={() => run(closeSession, "close")}
            >
              {busy === "close" ? "Recording…" : "Close session"}
            </button>
          ) : null}
        </div>

        <hr style={{ margin: "1.5rem 0 1rem", border: "none", borderTop: "1px solid var(--border)" }} />

        <MessageAdmin
          heading="Something wrong with today?"
          hint="If you forgot to open a session, or the times above are wrong, ask an administrator to correct the record for you."
          subject={`Attendance correction for ${workDate} - ${displayName(profile)} (ID ${idUser})`}
          bodyTemplate={
            `Hello,\n\nMy attendance record for ${workDate} needs correcting.\n\n` +
            `I forgot to open my session this morning, so I cannot close it now. ` +
            `Please record the correct hours for me.\n\n` +
            `Start time: \nEnd time: `
          }
        />
      </div>

      <div className="card">
        <h2 className="card__title">What is already recorded</h2>
        <Notice kind="info">
          This list is read-only. To change or delete a record, an administrator has to use the Review
          sessions control panel.
        </Notice>
        <Notice kind="error">{historyFailure}</Notice>

        <div className="row" style={{ alignItems: "flex-end", marginBottom: "1rem" }}>
          <Field label="From" type="date" value={range.startDate} onChange={updateRange("startDate")} />
          <Field label="To" type="date" value={range.endDate} onChange={updateRange("endDate")} />
        </div>

        {rows === null ? (
          <p className="spinner">Loading…</p>
        ) : entries.length === 0 ? (
          <p className="spinner">Nothing recorded for you in that range.</p>
        ) : (
          <SessionTable sessions={rows} leave={leave} />
        )}
      </div>
    </Layout>
  );
}
