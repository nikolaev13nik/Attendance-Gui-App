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

function secondsBetween(from, to) {
  const start = new Date(from).getTime();
  const end = new Date(to).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
    return 0;
  }
  return Math.floor((end - start) / 1000);
}

function workedToday(sessions, workDate, now) {
  return sessions
    .filter((session) => session.workDate === workDate && session.openSessionDate)
    .reduce((sum, session) => sum + secondsBetween(session.openSessionDate, session.closeSessionDate || now), 0);
}

function formatClock(seconds) {
  const two = (value) => String(value).padStart(2, "0");
  return `${Math.floor(seconds / 3600)}:${two(Math.floor(seconds / 60) % 60)}:${two(seconds % 60)}`;
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
  const [now, setNow] = useState(() => new Date());

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

  useEffect(() => {
    if (status !== "open") {
      return undefined;
    }
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, [status]);

  const worked = workedToday(rows || (record ? [record] : []), workDate, now);
  const statusLabel = {
    none: t("session.statusNone"),
    open: t("session.statusOpen"),
    closed: t("session.statusClosed"),
    orphan: t("session.statusOrphan"),
  }[status];
  const openedAt = formatTime(record?.openSessionDate);
  const closedAt = formatTime(record?.closeSessionDate);
  const updateRange = (field) => (event) => setRange((prev) => ({ ...prev, [field]: event.target.value }));
  const entries = leaveEntries(rows, leave, sortDesc, startDesc);

  return (
    <Layout>
      <div className="card card--narrow clock">
        <div className="clock__head">
          <h1 className="card__title">{t("home.reportSession")}</h1>
          <span className={`status status--${status}`}>{statusLabel}</span>
        </div>
        <p className="clock__date">{formatLongDate()}</p>

        <Notice kind="error">{failure}</Notice>
        {status === "orphan" ? (
          <Notice kind="error">
            {t("session.orphan")}
          </Notice>
        ) : null}

        {status === "none" ? (
          <p className="clock__empty">{t("session.none")}</p>
        ) : (
          <>
            {status === "orphan" ? null : (
              <div className="clock__worked">
                <span className="clock__worked-value">{formatClock(worked)}</span>
                <span className="clock__worked-label">{t("session.worked")}</span>
              </div>
            )}
            <dl className="clock__times">
              <div>
                <dt>{t("session.started")}</dt>
                <dd>{openedAt || t("session.notRecorded")}</dd>
              </div>
              <div>
                <dt>{t("session.ended")}</dt>
                <dd>{closedAt || t("session.stillOpen")}</dd>
              </div>
            </dl>
          </>
        )}

        <div className="stack">
          {status === "open" ? (
            <button
              type="button"
              className="btn btn--primary btn--block btn--xl"
              disabled={busy !== null}
              onClick={() => run(closeSession, "close")}
            >
              {busy === "close" ? t("common.recording") : t("session.close")}
            </button>
          ) : (
            <button
              type="button"
              className="btn btn--primary btn--block btn--xl"
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
      </div>

      <div className="card card--narrow">
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
