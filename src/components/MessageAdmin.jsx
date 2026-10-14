import { useEffect, useState } from "react";
import Notice from "./Notice.jsx";
import Modal from "./Modal.jsx";
import Field from "./Field.jsx";
import { listUsers } from "../api/accounting.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { displayName, isAdministrator } from "../auth/roles.js";

export default function MessageAdmin({ heading, hint, subject, bodyTemplate }) {
  const { token, profile } = useAuth();
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
    setMessageText(`${bodyTemplate}\n\n${displayName(profile)} (user ID ${idUser})`);
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
          No administrator with an email address was found for this organization, so there is nobody to
          contact from here. Speak to your administrator directly.
        </Notice>
      ) : (
        <button type="button" className="btn btn--block" onClick={startMessage}>
          Message an administrator
        </button>
      )}

      {messaging ? (
        <Modal
          title="Message an administrator"
          onClose={() => setMessaging(false)}
          actions={
            <>
              <button type="button" className="btn" onClick={() => setMessaging(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn--primary" onClick={sendMessage}>
                Open in email
              </button>
            </>
          }
        >
          <p className="card__hint">
            Goes to {admins.map((admin) => admin.email).join(", ")}. This opens your email program with
            the message ready to send, so you can check it before it leaves.
          </p>
          <Field
            label="Message"
            as="textarea"
            value={messageText}
            onChange={(event) => setMessageText(event.target.value)}
          />
        </Modal>
      ) : null}
    </>
  );
}
