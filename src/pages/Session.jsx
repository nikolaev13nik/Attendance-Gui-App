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
import { useI18n } from "../i18n/I18nContext.jsx";

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
  const { t } = useI18n();
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
  const [sortDesc, setSortDesc] = useState(true);
  const [startDesc, setStartDesc] = useState(false);

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
      setHistoryFailure(error);
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
        setFailure(error);
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
  const entries = leaveEntries(rows, leave, sortDesc, startDesc);

  return (
    <Layout>
      <div className="card card--narrow">
        <h1 className="card__title">{t("home.reportSession")}</h1>
        <p className="clock__date">{formatLongDate()}</p>

        <Notice kind="error">{failure}</Notice>
        {status === "orphan" ? (
          <Notice kind="error">
            {t("session.orphan")}
          </Notice>
        ) : null}

        <div className="clock__state">
          {status === "none" ? (
            <p style={{ margin: 0 }}>{t("session.none")}</p>
          ) : (
            <dl>
              <dt>{t("session.started")}</dt>
              <dd>{openedAt || t("session.notRecorded")}</dd>
              <dt>{t("session.ended")}</dt>
              <dd>{closedAt || t("session.stillOpen")}</dd>
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
              {busy === "close" ? t("common.recording") : t("session.close")}
            </button>
          ) : (
            <button
              type="button"
              className="btn btn--primary btn--block btn--large"
              disabled={busy !== null}
              onClick={() => run(openSession, "open")}
            >
              {busy === "open" ? t("common.recording") : t("session.open")}
            </button>
          )}

          {status === "closed" ? (
            <p className="card__hint" style={{ margin: 0 }}>
              {t("session.closedHint", { time: closedAt })}
            </p>
          ) : null}

          {status === "none" ? (
            <button
              type="button"
              className="btn btn--block"
              disabled={busy !== null}
              onClick={() => run(closeSession, "close")}
            >
              {busy === "close" ? t("common.recording") : t("session.close")}
            </button>
          ) : null}
        </div>

        <hr style={{ margin: "1.5rem 0 1rem", border: "none", borderTop: "1px solid var(--border)" }} />

        <MessageAdmin
          heading={t("session.wrongHeading")}
          hint={t("session.wrongHint")}
          subject={t("session.mailSubject", { date: workDate, name: displayName(profile), id: idUser })}
          bodyTemplate={t("session.mailBody", { date: workDate })}
        />
      </div>

      <div className="card">
        <h2 className="card__title">{t("common.alreadyRecorded")}</h2>
        <Notice kind="info">
          {t("session.readOnly")}
        </Notice>
        <Notice kind="error">{historyFailure}</Notice>

        <div className="row" style={{ alignItems: "flex-end", marginBottom: "1rem" }}>
          <Field label={t("common.from")} type="date" value={range.startDate} onChange={updateRange("startDate")} />
          <Field label={t("common.to")} type="date" value={range.endDate} onChange={updateRange("endDate")} />
        </div>

        {rows === null ? (
          <p className="spinner">{t("common.loading")}</p>
        ) : entries.length === 0 ? (
          <p className="spinner">{t("session.nothingForYou")}</p>
        ) : (
          <SessionTable
            sessions={rows}
            leave={leave}
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
