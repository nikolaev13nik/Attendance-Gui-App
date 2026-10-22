import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function respond(status, body) {
  return Promise.resolve(new Response(body, { status }));
}

describe("loadConfig", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reads the threshold from /config.json as H.MM", async () => {
    const fetchMock = vi.fn(() => respond(200, '{"overtimeDailyThreshold": "8.40"}'));
    vi.stubGlobal("fetch", fetchMock);
    const { loadConfig } = await import("./config.js");
    expect(await loadConfig()).toEqual({ overtimeDailyThresholdMinutes: 520 });
    expect(fetchMock).toHaveBeenCalledWith("/config.json", expect.anything());
  });

  it("fetches the file once however many tables ask", async () => {
    const fetchMock = vi.fn(() => respond(200, '{"overtimeDailyThreshold": "9.00"}'));
    vi.stubGlobal("fetch", fetchMock);
    const { loadConfig } = await import("./config.js");
    await Promise.all([loadConfig(), loadConfig()]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to the default when the file is missing", async () => {
    vi.stubGlobal("fetch", vi.fn(() => respond(404, "")));
    const { loadConfig, DEFAULT_CONFIG } = await import("./config.js");
    expect(await loadConfig()).toEqual(DEFAULT_CONFIG);
  });

  it("falls back to the default when the value is not H.MM", async () => {
    vi.stubGlobal("fetch", vi.fn(() => respond(200, '{"overtimeDailyThreshold": "8.75"}')));
    const { loadConfig, DEFAULT_CONFIG } = await import("./config.js");
    expect(await loadConfig()).toEqual(DEFAULT_CONFIG);
  });
});
