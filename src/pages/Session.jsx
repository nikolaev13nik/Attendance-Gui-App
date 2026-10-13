import { useCallback, useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout.jsx";
import Notice from "../components/Notice.jsx";
import Modal from "../components/Modal.jsx";
import Field from "../components/Field.jsx";
import { closeSession, openSession } from "../api/timetracking.js";
import { listUsers } from "../api/accounting.js";
import { formatLongDate, formatTime, localWorkDate } from "../api/time.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { displayName, isAdministrator } from "../auth/roles.js";

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
  const [admins, setAdmins] = useState([]);
  const [messaging, setMessaging] = useState(false);
  const [messageText, setMessageText] = useState("");

  useEffect(() => {
    setRecord(readRecord(key));
  }, [key]);

  useEffect(() => {
    listUsers({ tenantId, token })
      .then((list) => setAdmins((list || []).filter((user) => isAdministrator(user) && user.email)))
      .catch(() => setAdmins([]));
  }, [tenantId, token]);

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

  function startMessage() {
    setMessageText(
      `Hello,\n\nMy attendance record for ${workDate} needs correcting.\n\n` +
        `I forgot to open my session this morning, so I cannot close it now. ` +
        `Please record the correct hours for me.\n\n` +
        `Start time: \nEnd time: \n\n` +
        `${displayName(profile)} (user ID ${idUser})`,
    );
    setMessaging(true);
  }

  function sendMessage() {
    const to = admins.map((admin) => admin.email).join(",");
    const subject = `Attendance correction for ${workDate} - ${displayName(profile)} (ID ${idUser})`;
    window.location.href =
      `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(messageText)}`;
    setMessaging(false);
  }

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

        <h2 style={{ fontSize: "1.05rem" }}>Something wrong with today?</h2>
        <p className="card__hint">
          If you forgot to open a session, or the times above are wrong, ask an administrator to correct
          the record for you.
        </p>
        {admins.length === 0 ? (
          <Notice kind="info">
            No administrator with an email address was found for this organization, so there is nobody to
            contact from here. Speak to your administrator directly.
          </Notice>
        ) : (
          <button type="button" className="btn btn--block" onClick={startMessage}>
            Message an administrator
          </button>
        )}
      </div>

      {messaging ? (
        <Modal
          title="Message an administrator"
          onClose={() => setMessaging(false)}
          actions={
            <>
              <button type="button" className="btn" onClick={() => setMessaging(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn--primary" onClick={sendMessage}>
                Open in email
              </button>
            </>
          }
        >
          <p className="card__hint">
            Goes to {admins.map((admin) => admin.email).join(", ")}. This opens your email program with
            the message ready to send, so you can check it before it leaves.
          </p>
          <Field
            label="Message"
            as="textarea"
            value={messageText}
            onChange={(event) => setMessageText(event.target.value)}
          />
        </Modal>
      ) : null}
    </Layout>
  );
}
