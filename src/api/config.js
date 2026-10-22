import { clockMinutes } from "./hours.js";
import { request } from "./http.js";

export const DEFAULT_CONFIG = { overtimeDailyThresholdMinutes: 8 * 60 };

let pending = null;

export function loadConfig() {
  if (!pending) {
    pending = request("/config.json")
      .then((body) => ({
        overtimeDailyThresholdMinutes:
          clockMinutes(body?.overtimeDailyThreshold) ?? DEFAULT_CONFIG.overtimeDailyThresholdMinutes,
      }))
      .catch(() => DEFAULT_CONFIG);
  }
  return pending;
}
