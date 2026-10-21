import { useEffect, useState } from "react";
import Notice from "./Notice.jsx";
import Modal from "./Modal.jsx";
import Field from "./Field.jsx";
import { listUsers } from "../api/accounting.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { displayName, isAdministrator } from "../auth/roles.js";
import { useI18n } from "../i18n/I18nContext.jsx";

export default function MessageAdmin({ heading, hint, subject, bodyTemplate }) {
  const { token, profile } = useAuth();
  const { t } = useI18n();
  const { idUser, tenantId } = profile;

  const [admins, setAdmins] = useState([]);
  const [messaging, setMessaging] = useState(false);
  const [messageText, setMessageText] = useState("");

  useEffect(() => {
    listUsers({ tenantId, token })
      .then((list) => setAdmins((list || []).filter((user) => isAdministrator(user) && user.email)))
      .catch(() => setAdmins([]));
  }, [tenantId, token]);

  function startMessage() {
    setMessageText(`${bodyTemplate}\n\n${t("message.signature", { name: displayName(profile), id: idUser })}`);
    setMessaging(true);
  }

  function sendMessage() {
    const to = admins.map((admin) => admin.email).join(",");
    window.location.href =
      `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(messageText)}`;
    setMessaging(false);
  }

  return (
    <>
      <h2 style={{ fontSize: "1.05rem" }}>{heading}</h2>
      <p className="card__hint">{hint}</p>
      {admins.length === 0 ? (
        <Notice kind="info">
          {t("message.noAdmin")}
        </Notice>
      ) : (
        <button type="button" className="btn btn--block" onClick={startMessage}>
          {t("message.button")}
        </button>
      )}

      {messaging ? (
        <Modal
          title={t("message.button")}
          onClose={() => setMessaging(false)}
          actions={
            <>
              <button type="button" className="btn" onClick={() => setMessaging(false)}>
                {t("common.cancel")}
              </button>
              <button type="button" className="btn btn--primary" onClick={sendMessage}>
                {t("message.openEmail")}
              </button>
            </>
          }
        >
          <p className="card__hint">
            {t("message.goesTo", { emails: admins.map((admin) => admin.email).join(", ") })}
          </p>
          <Field
            label={t("message.label")}
            as="textarea"
            value={messageText}
            onChange={(event) => setMessageText(event.target.value)}
          />
        </Modal>
      ) : null}
    </>
  );
}
