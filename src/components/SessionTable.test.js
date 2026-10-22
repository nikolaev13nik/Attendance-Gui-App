import { describe, expect, it } from "vitest";
import { alternateDays } from "./SessionTable.jsx";

describe("alternateDays", () => {
  it("shades every second date group, however many rows a date has", () => {
    const entries = ["2024-01-02", "2024-01-02", "2024-01-03", "2024-01-03", "2024-01-03", "2024-01-04"].map(
      (date) => ({ date }),
    );
    expect(alternateDays(entries)).toEqual([false, false, true, true, true, false]);
  });

  it("is empty for an empty table", () => {
    expect(alternateDays([])).toEqual([]);
  });
});
