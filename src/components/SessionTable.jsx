import { formatTime } from "../api/time.js";
import { useI18n } from "../i18n/I18nContext.jsx";

export const LEAVE_AMOUNTS = [
  { value: "0", label: "leave.none" },
  { value: "0.5", label: "leave.half" },
  { value: "1", label: "leave.full" },
];

function startedAt(isoString) {
  if (!isoString) {
    return null;
  }
  const parsed = new Date(isoString).getTime();
  return Number.isNaN(parsed) ? null : parsed;
}

export function leaveEntries(sessions, leave, sortDesc, startDesc = sortDesc) {
  const dateDirection = sortDesc ? -1 : 1;
  const startDirection = startDesc ? -1 : 1;
  return [
    ...(sessions || []).map((row) => ({
      kind: "session",
      date: row.workDate,
      start: startedAt(row.openSessionDate),
      row,
    })),
    ...(leave || []).map((day) => ({ kind: "leave", date: day.date, start: null, row: day })),
  ].sort((a, b) => {
    // date is always the primary key; Start only decides the order within one date
    if (a.date !== b.date) {
      return (a.date < b.date ? -1 : 1) * dateDirection;
    }
    // a leave day has no start, and an unopened session has lost its own, so both sit after the
    // sessions they share a date with whichever way either column is pointing
    if (a.start === null || b.start === null) {
      return a.start === b.start ? 0 : a.start === null ? 1 : -1;
    }
    return a.start === b.start ? 0 : (a.start < b.start ? -1 : 1) * startDirection;
  });
}

function portion(amount) {
  if (amount === null || amount === undefined) {
    return "—";
  }
  return amount === 0.5 ? "½" : String(amount);
}

export default function SessionTable({
  sessions,
  leave,
  incompleteIds,
  sortDesc = true,
  startDesc = sortDesc,
  onToggleSort,
  onToggleStartSort,
  actions,
}) {
  const { t } = useI18n();
  const entries = leaveEntries(sessions, leave, sortDesc, startDesc);
  const needsFixing = incompleteIds || new Set();

  return (
    <table className="table">
      <thead>
        <tr>
          <th>{t("table.type")}</th>
          <th>
            {onToggleSort ? (
              <button type="button" className="btn btn--link" onClick={onToggleSort}>
                {t("common.date")} {sortDesc ? "↓" : "↑"}
              </button>
            ) : (
              t("common.date")
            )}
          </th>
          <th>
            {onToggleStartSort ? (
              <button type="button" className="btn btn--link" onClick={onToggleStartSort}>
                {t("common.start")} {startDesc ? "\u2193" : "\u2191"}
              </button>
            ) : (
              t("common.start")
            )}
          </th>
          <th>{t("common.end")}</th>
          <th>{t("common.sickness")}</th>
          <th>{t("common.vacation")}</th>
          {actions ? <th aria-label={t("common.actions")} /> : null}
        </tr>
      </thead>
      <tbody>
        {entries.map((entry) =>
          entry.kind === "leave" ? (
            <tr key={`leave-${entry.row.id}`}>
              <td>{t("table.leaveDay")}</td>
              <td>{entry.row.date}</td>
              <td>&mdash;</td>
              <td>&mdash;</td>
              <td>{portion(entry.row.sickAmount)}</td>
              <td>{portion(entry.row.vacationAmount)}</td>
              {actions ? <td>{actions(entry)}</td> : null}
            </tr>
          ) : (
            <tr key={`session-${entry.row.id}`}>
              <td>
                {t("table.workHours")}
                {needsFixing.has(entry.row.id) ? (
                  <>
                    {" "}
                    <span className="tag tag--admin">{t("table.needsFixing")}</span>
                  </>
                ) : null}
              </td>
              <td>{entry.row.workDate}</td>
              <td>{formatTime(entry.row.openSessionDate) || <span className="tag">{t("table.missing")}</span>}</td>
              <td>{formatTime(entry.row.closeSessionDate) || <span className="tag">{t("table.missing")}</span>}</td>
              <td>&mdash;</td>
              <td>&mdash;</td>
              {actions ? <td>{actions(entry)}</td> : null}
            </tr>
          ),
        )}
      </tbody>
    </table>
  );
}
