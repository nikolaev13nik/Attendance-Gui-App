import { clockMinutes } from "./hours.js";
import { request } from "./http.js";

export const TURNSTILE_TEST_SITE_KEY = "1x00000000000000000000AA";

export const DEFAULT_CONFIG = {
  overtimeDailyThresholdMinutes: 8 * 60,
  turnstileSiteKey: TURNSTILE_TEST_SITE_KEY,
};

let pending = null;

export function loadConfig() {
  if (!pending) {
    pending = request("/config.json")
      .then((body) => ({
        overtimeDailyThresholdMinutes:
          clockMinutes(body?.overtimeDailyThreshold) ?? DEFAULT_CONFIG.overtimeDailyThresholdMinutes,
        turnstileSiteKey: body?.turnstileSiteKey || DEFAULT_CONFIG.turnstileSiteKey,
      }))
      .catch(() => DEFAULT_CONFIG);
  }
  return pending;
}
