import { describe, expect, it } from "vitest";
import { clockMinutes, dailyHours, formatDuration, sessionMinutes, tableTotals } from "./hours.js";

function session(id, workDate, open, close) {
  return {
    id,
    workDate,
    openSessionDate: open ? `${workDate}T${open}:00Z` : null,
    closeSessionDate: close ? `${workDate}T${close}:00Z` : null,
  };
}

describe("sessionMinutes", () => {
  it("counts the minutes of a closed session", () => {
    expect(sessionMinutes(session(1, "2024-01-02", "09:00", "17:30"))).toBe(510);
  });

  it("is empty when the start or the end is missing", () => {
    expect(sessionMinutes(session(1, "2024-01-02", null, "17:30"))).toBeNull();
    expect(sessionMinutes(session(1, "2024-01-02", "09:00", null))).toBeNull();
  });

  it("is empty when the end is before the start", () => {
    expect(sessionMinutes(session(1, "2024-01-02", "17:00", "09:00"))).toBeNull();
  });
});

describe("dailyHours", () => {
  it("puts overtime on a single session that exceeds the threshold", () => {
    const hours = dailyHours([session(1, "2024-01-02", "09:00", "18:30")], 480);
    expect(hours.get(1)).toEqual({ total: 570, overtime: 90 });
  });

  it("leaves overtime empty when the day stays within the threshold", () => {
    const hours = dailyHours([session(1, "2024-01-02", "09:00", "17:00")], 480);
    expect(hours.get(1)).toEqual({ total: 480, overtime: null });
  });

  it("sums every session of a day and puts the overtime on the last one only", () => {
    const hours = dailyHours(
      [session(2, "2024-01-02", "14:00", "19:00"), session(1, "2024-01-02", "08:00", "12:00")],
      480,
    );
    expect(hours.get(1)).toEqual({ total: 240, overtime: null });
    expect(hours.get(2)).toEqual({ total: 300, overtime: 60 });
  });

  it("gives no overtime for a day that still has an unclosed session", () => {
    const hours = dailyHours(
      [session(1, "2024-01-02", "08:00", "17:00"), session(2, "2024-01-02", "18:00", null)],
      480,
    );
    expect(hours.get(1)).toEqual({ total: 540, overtime: null });
    expect(hours.get(2)).toEqual({ total: null, overtime: null });
  });

  it("keeps days apart", () => {
    const hours = dailyHours(
      [session(1, "2024-01-02", "08:00", "13:00"), session(2, "2024-01-03", "08:00", "13:00")],
      480,
    );
    expect(hours.get(1).overtime).toBeNull();
    expect(hours.get(2).overtime).toBeNull();
  });

  it("applies a threshold that is not a whole hour", () => {
    const hours = dailyHours([session(1, "2024-01-02", "09:00", "18:00")], clockMinutes("8.40"));
    expect(hours.get(1)).toEqual({ total: 540, overtime: 20 });
  });
});

describe("clockMinutes", () => {
  it("reads H.MM as hours and minutes", () => {
    expect(clockMinutes("8.40")).toBe(520);
    expect(clockMinutes("8.05")).toBe(485);
    expect(clockMinutes("9")).toBe(540);
  });

  it("right-pads a single minute digit, as an unquoted YAML 8.40 arrives as 8.4", () => {
    expect(clockMinutes(8.4)).toBe(520);
    expect(clockMinutes("8.4")).toBe(520);
  });

  it("rejects minutes of 60 or more and anything that is not H.MM", () => {
    expect(clockMinutes("8.60")).toBeNull();
    expect(clockMinutes("8.405")).toBeNull();
    expect(clockMinutes("abc")).toBeNull();
    expect(clockMinutes(undefined)).toBeNull();
  });
});

describe("tableTotals", () => {
  it("sums hours, overtime and leave over every row shown", () => {
    const sessions = [
      session(1, "2024-01-02", "08:00", "12:00"),
      session(2, "2024-01-02", "13:00", "18:30"),
      session(3, "2024-01-03", "09:00", null),
    ];
    const leave = [
      { id: 10, date: "2024-01-04", sickAmount: 1, vacationAmount: null },
      { id: 11, date: "2024-01-05", sickAmount: 0.5, vacationAmount: 0.5 },
    ];
    const totals = tableTotals(sessions, leave, dailyHours(sessions, 480));
    expect(totals).toEqual({ total: 570, overtime: 90, sick: 1.5, vacation: 0.5 });
  });

  it("is all zeros for an empty table", () => {
    expect(tableTotals([], [], new Map())).toEqual({ total: 0, overtime: 0, sick: 0, vacation: 0 });
  });
});

describe("formatDuration", () => {
  it("renders hours and zero-padded minutes", () => {
    expect(formatDuration(570)).toBe("9:30");
    expect(formatDuration(5)).toBe("0:05");
  });

  it("renders nothing for a missing value", () => {
    expect(formatDuration(null)).toBe("");
    expect(formatDuration(undefined)).toBe("");
  });
});
