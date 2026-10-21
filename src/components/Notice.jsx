import { useI18n } from "../i18n/I18nContext.jsx";

export default function Notice({ kind = "info", children }) {
  const { text } = useI18n();
  const content = text(children);
  if (!content) {
    return null;
  }
  return (
    <div className={`notice notice--${kind}`} role={kind === "error" ? "alert" : "status"}>
      {content}
    </div>
  );
}
