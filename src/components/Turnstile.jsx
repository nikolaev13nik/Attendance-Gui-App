import { useEffect, useRef, useState } from "react";
import Notice from "./Notice.jsx";
import { msg, useI18n } from "../i18n/I18nContext.jsx";

const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let scriptPromise = null;

function loadTurnstile() {
  if (window.turnstile) {
    return Promise.resolve(window.turnstile);
  }
  if (scriptPromise === null) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = SCRIPT_URL;
      script.async = true;
      script.onload = () => resolve(window.turnstile);
      script.onerror = () => {
        scriptPromise = null;
        reject(new Error("Turnstile script failed to load"));
      };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

export default function Turnstile({ siteKey, onToken, resetCount }) {
  const container = useRef(null);
  const widgetId = useRef(null);
  const { lang } = useI18n();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let current = true;
    setFailed(false);
    loadTurnstile()
      .then((turnstile) => {
        if (current && container.current) {
          widgetId.current = turnstile.render(container.current, {
            sitekey: siteKey,
            language: lang,
            callback: (token) => onToken(token),
            "expired-callback": () => onToken(null),
            "error-callback": () => onToken(null),
          });
        }
      })
      .catch(() => {
        if (current) {
          setFailed(true);
        }
      });
    return () => {
      current = false;
      if (widgetId.current !== null && window.turnstile) {
        window.turnstile.remove(widgetId.current);
      }
      widgetId.current = null;
      onToken(null);
    };
  }, [siteKey, lang, onToken]);

  useEffect(() => {
    if (resetCount > 0 && widgetId.current !== null && window.turnstile) {
      window.turnstile.reset(widgetId.current);
      onToken(null);
    }
  }, [resetCount, onToken]);

  return (
    <div style={{ margin: "0.75rem 0" }}>
      <div ref={container} />
      {failed ? <Notice kind="error">{msg("signup.captchaLoadFailed")}</Notice> : null}
    </div>
  );
}
