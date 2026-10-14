import { formatTime } from "../api/time.js";

export const LEAVE_AMOUNTS = [
  { value: "0", label: "none" },
  { value: "0.5", label: "half day" },
  { value: "1", label: "full day" },
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
  const entries = leaveEntries(sessions, leave, sortDesc, startDesc);
  const needsFixing = incompleteIds || new Set();

  return (
    <table className="table">
      <thead>
        <tr>
          <th>Type</th>
          <th>
            {onToggleSort ? (
              <button type="button" className="btn btn--link" onClick={onToggleSort}>
                Date {sortDesc ? "↓" : "↑"}
              </button>
            ) : (
              "Date"
            )}
          </th>
          <th>
            {onToggleStartSort ? (
              <button type="button" className="btn btn--link" onClick={onToggleStartSort}>
                Start {startDesc ? "\u2193" : "\u2191"}
              </button>
            ) : (
              "Start"
            )}
          </th>
          <th>End</th>
          <th>Sickness</th>
          <th>Vacation</th>
          {actions ? <th aria-label="Actions" /> : null}
        </tr>
      </thead>
      <tbody>
        {entries.map((entry) =>
          entry.kind === "leave" ? (
            <tr key={`leave-${entry.row.id}`}>
              <td>Leave day</td>
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
                Work hours
                {needsFixing.has(entry.row.id) ? (
                  <>
                    {" "}
                    <span className="tag tag--admin">needs fixing</span>
                  </>
                ) : null}
              </td>
              <td>{entry.row.workDate}</td>
              <td>{formatTime(entry.row.openSessionDate) || <span className="tag">missing</span>}</td>
              <td>{formatTime(entry.row.closeSessionDate) || <span className="tag">missing</span>}</td>
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
