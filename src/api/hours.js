const MINUTE = 60 * 1000;

function instant(isoString) {
  if (!isoString) {
    return null;
  }
  const parsed = new Date(isoString).getTime();
  return Number.isNaN(parsed) ? null : parsed;
}

export function sessionMinutes(row) {
  const open = instant(row.openSessionDate);
  const close = instant(row.closeSessionDate);
  if (open === null || close === null || close < open) {
    return null;
  }
  return Math.round((close - open) / MINUTE);
}

export function clockMinutes(hoursDotMinutes) {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(String(hoursDotMinutes ?? "").trim());
  if (!match) {
    return null;
  }
  const minutes = Number((match[2] || "0").padEnd(2, "0"));
  return minutes < 60 ? Number(match[1]) * 60 + minutes : null;
}

export function dailyHours(sessions, limit) {
  const byDate = new Map();
  for (const row of sessions || []) {
    const day = byDate.get(row.workDate) || [];
    day.push(row);
    byDate.set(row.workDate, day);
  }

  const result = new Map();
  for (const day of byDate.values()) {
    const totals = day.map((row) => ({ row, total: sessionMinutes(row) }));
    totals.forEach(({ row, total }) => result.set(row.id, { total, overtime: null }));
    if (totals.some(({ total }) => total === null)) {
      continue;
    }
    const worked = totals.reduce((sum, { total }) => sum + total, 0);
    if (worked <= limit) {
      continue;
    }
    const last = day.reduce((latest, row) =>
      instant(row.openSessionDate) > instant(latest.openSessionDate) ? row : latest,
    );
    result.get(last.id).overtime = worked - limit;
  }
  return result;
}

export function formatDuration(minutes) {
  if (minutes === null || minutes === undefined) {
    return "";
  }
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}`;
}
