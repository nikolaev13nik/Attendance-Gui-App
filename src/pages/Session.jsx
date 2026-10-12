import { useCallback, useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout.jsx";
import Notice from "../components/Notice.jsx";
import { closeSession, openSession } from "../api/timetracking.js";
import { formatLongDate, formatTime, localWorkDate } from "../api/time.js";
import { useAuth } from "../auth/AuthContext.jsx";

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

  useEffect(() => {
    setRecord(readRecord(key));
  }, [key]);

  const run = useCallback(
    async (action, label) => {
      setFailure(null);
      setBusy(label);
      try {
        const next = await action({ tenantId, idUser, token });
        writeRecord(key, next);
        setRecord(next);
      } catch (error) {
        setFailure(error.message);
      } finally {
        setBusy(null);
      }
    },
    [idUser, key, tenantId, token],
  );

  const status = statusOf(record);
  const openedAt = formatTime(record?.openSessionDate);
  const closedAt = formatTime(record?.closeSessionDate);

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
      </div>
    </Layout>
  );
}
