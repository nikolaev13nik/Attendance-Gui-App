const pad = (value, width = 2) => String(Math.abs(value)).padStart(width, "0");

export function localWorkDate(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function localMonth(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

function offsetSuffix(date) {
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  return `${sign}${pad(Math.trunc(Math.abs(offsetMinutes) / 60))}:${pad(Math.abs(offsetMinutes) % 60)}`;
}

export function localTimestamp(date = new Date()) {
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`;
  return `${localWorkDate(date)}T${time}${offsetSuffix(date)}`;
}

export function timestampOn(workDate, timeOfDay) {
  const [year, month, day] = workDate.split("-").map(Number);
  const [hours, minutes] = timeOfDay.split(":").map(Number);
  const moment = new Date(year, month - 1, day, hours, minutes, 0, 0);
  return localTimestamp(moment);
}

export function toTimeInput(isoString) {
  if (!isoString) {
    return "";
  }
  const parsed = new Date(isoString);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  return `${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
}

export function daysAgo(count, from = new Date()) {
  const date = new Date(from);
  date.setDate(date.getDate() - count);
  return localWorkDate(date);
}

export function formatTime(isoString) {
  if (!isoString) {
    return null;
  }
  const parsed = new Date(isoString);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function formatLongDate(date = new Date()) {
  return date.toLocaleDateString([], {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
