import { formatTime } from "../api/time.js";

export const LEAVE_AMOUNTS = [
  { value: "0", label: "none" },
  { value: "0.5", label: "half day" },
  { value: "1", label: "full day" },
];

export function leaveEntries(sessions, leave, sortDesc) {
  const direction = sortDesc ? -1 : 1;
  return [
    ...(sessions || []).map((row) => ({ kind: "session", date: row.workDate, row })),
    ...(leave || []).map((day) => ({ kind: "leave", date: day.date, row: day })),
  ].sort((a, b) => (a.date === b.date ? 0 : (a.date < b.date ? -1 : 1) * direction));
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
  onToggleSort,
  actions,
}) {
  const entries = leaveEntries(sessions, leave, sortDesc);
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
          <th>Start</th>
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
