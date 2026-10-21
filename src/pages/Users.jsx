import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import Notice from "../components/Notice.jsx";
import Field from "../components/Field.jsx";
import Modal from "../components/Modal.jsx";
import { addRole, deleteUser, editUser, listUsers, registerUser, removeRole } from "../api/accounting.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { ADMINISTRATOR, displayName, isAdministrator } from "../auth/roles.js";
import { msg, useI18n } from "../i18n/I18nContext.jsx";

const EMPTY_CREATE = { idUser: "", firstName: "", lastName: "", email: "", password: "" };

export default function Users() {
  const navigate = useNavigate();
  const { token, profile } = useAuth();
  const { t, roleLabel } = useI18n();
  const tenantId = profile.tenantId;

  const [users, setUsers] = useState(null);
  const [failure, setFailure] = useState(null);
  const [success, setSuccess] = useState(null);
  const [busy, setBusy] = useState(null);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE);
  const [createErrors, setCreateErrors] = useState({});
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmRole, setConfirmRole] = useState(null);

  const refresh = useCallback(async () => {
    setFailure(null);
    try {
      const rows = await listUsers({ tenantId, token });
      setUsers(rows || []);
    } catch (error) {
      setFailure(error);
      setUsers([]);
    }
  }, [tenantId, token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function act(label, operation, message) {
    setFailure(null);
    setSuccess(null);
    setBusy(label);
    try {
      await operation();
      await refresh();
      setSuccess(message);
      return true;
    } catch (error) {
      setFailure(error);
      return false;
    } finally {
      setBusy(null);
    }
  }

  function validateCreate() {
    const next = {};
    if (!/^\d+$/.test(createForm.idUser) || Number(createForm.idUser) < 1) {
      next.idUser = msg("validation.wholeNumber");
    }
    if (!/^\S+@\S+\.\S+$/.test(createForm.email)) {
      next.email = msg("validation.email");
    }
    if (createForm.password.length < 4) {
      next.password = msg("validation.passwordLength");
    }
    setCreateErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submitCreate(event) {
    event.preventDefault();
    if (!validateCreate()) {
      return;
    }
    const ok = await act(
      "create",
      () =>
        registerUser({
          idUser: Number(createForm.idUser),
          password: createForm.password,
          email: createForm.email.trim(),
          tenantId,
          firstName: createForm.firstName.trim() || undefined,
          lastName: createForm.lastName.trim() || undefined,
        }),
      msg("users.added", { id: createForm.idUser }),
    );
    if (ok) {
      setCreating(false);
      setCreateForm(EMPTY_CREATE);
      setCreateErrors({});
    }
  }

  async function submitEdit(event) {
    event.preventDefault();
    const target = editing;
    const ok = await act(
      "edit",
      () =>
        editUser({
          idUser: target.idUser,
          token,
          firstName: editForm.firstName.trim() || undefined,
          lastName: editForm.lastName.trim() || undefined,
          email: editForm.email.trim() || undefined,
          password: editForm.password || undefined,
        }),
      msg("users.updated", { id: target.idUser }),
    );
    if (ok) {
      setEditing(null);
    }
  }

  const update = (setter) => (key) => (event) =>
    setter((prev) => ({ ...prev, [key]: event.target.value }));
  const updateCreate = update(setCreateForm);
  const updateEdit = update(setEditForm);

  const modalOpen = Boolean(creating || editing || confirmRole || confirmDelete);

  return (
    <Layout>
      <div className="card">
        <div className="row row--split" style={{ marginBottom: "0.75rem" }}>
          <div>
            <h1 className="card__title" style={{ marginBottom: 0 }}>
              {t("users.title")}
            </h1>
            <p className="card__hint" style={{ marginBottom: 0 }}>
              {t("users.hint", { id: tenantId })}
            </p>
          </div>
          <div className="row">
            <button type="button" className="btn" onClick={() => navigate("/home")}>
              {t("common.back")}
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => {
                setFailure(null);
                setCreating(true);
              }}
            >
              {t("users.add")}
            </button>
          </div>
        </div>

        {modalOpen ? null : <Notice kind="error">{failure}</Notice>}
        <Notice kind="success">{success}</Notice>

        {users === null ? (
          <p className="spinner">{t("common.loading")}</p>
        ) : users.length === 0 ? (
          <p className="spinner">{t("users.none")}</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>{t("common.idNumber")}</th>
                <th>{t("users.name")}</th>
                <th>{t("common.email")}</th>
                <th>{t("users.roles")}</th>
                <th aria-label={t("common.actions")} />
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const self = user.idUser === profile.idUser;
                const admin = isAdministrator(user);
                return (
                  <tr key={user.idUser}>
                    <td>{user.idUser}</td>
                    <td>
                      {displayName(user)}
                      {self ? <span className="tag tag--you" style={{ marginInlineStart: "0.4rem" }}>{t("users.you")}</span> : null}
                    </td>
                    <td>{user.email || "—"}</td>
                    <td>
                      {(user.roles || []).map((role) => (
                        <span
                          key={role}
                          className={`tag${role.toUpperCase() === ADMINISTRATOR ? " tag--admin" : ""}`}
                        >
                          {roleLabel(role)}
                        </span>
                      ))}
                    </td>
                    <td>
                      <div className="table__actions">
                        <button
                          type="button"
                          className="btn btn--link"
                          onClick={() => {
                            setFailure(null);
                            setEditing(user);
                            setEditForm({
                              firstName: user.firstName || "",
                              lastName: user.lastName || "",
                              email: user.email || "",
                              password: "",
                            });
                          }}
                        >
                          {t("common.edit")}
                        </button>
                        <button
                          type="button"
                          className="btn btn--link"
                          disabled={(admin && self) || busy !== null}
                          title={admin && self ? t("users.cannotRevokeSelf") : undefined}
                          onClick={() => setConfirmRole({ user, grant: !admin })}
                        >
                          {admin ? t("users.revokeAdmin") : t("users.grantAdmin")}
                        </button>
                        <button
                          type="button"
                          className="btn btn--link"
                          disabled={self || busy !== null}
                          title={self ? t("users.cannotDeleteSelf") : undefined}
                          onClick={() => setConfirmDelete(user)}
                        >
                          {t("common.delete")}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {creating ? (
        <Modal
          title={t("users.add")}
          onClose={() => setCreating(false)}
          actions={
            <>
              <button type="button" className="btn" onClick={() => setCreating(false)}>
                {t("common.cancel")}
              </button>
              <button type="submit" form="create-user" className="btn btn--primary" disabled={busy !== null}>
                {busy === "create" ? t("common.adding") : t("users.add")}
              </button>
            </>
          }
        >
          <Notice kind="error">{failure}</Notice>
          <p className="card__hint">
            {t("users.addHint")}
          </p>
          <form id="create-user" onSubmit={submitCreate} noValidate>
            <Field
              label={t("common.idNumber")}
              type="number"
              min="1"
              step="1"
              value={createForm.idUser}
              onChange={updateCreate("idUser")}
              error={createErrors.idUser}
              hint={t("common.idNumberHint")}
              autoFocus
            />
            <div className="grid-2">
              <Field label={t("common.firstName")} value={createForm.firstName} onChange={updateCreate("firstName")} />
              <Field label={t("common.lastName")} value={createForm.lastName} onChange={updateCreate("lastName")} />
            </div>
            <Field
              label={t("common.email")}
              type="email"
              value={createForm.email}
              onChange={updateCreate("email")}
              error={createErrors.email}
            />
            <Field
              label={t("common.password")}
              type="password"
              value={createForm.password}
              onChange={updateCreate("password")}
              error={createErrors.password}
              autoComplete="new-password"
            />
          </form>
        </Modal>
      ) : null}

      {editing ? (
        <Modal
          title={t("users.editTitle", { id: editing.idUser })}
          onClose={() => setEditing(null)}
          actions={
            <>
              <button type="button" className="btn" onClick={() => setEditing(null)}>
                {t("common.cancel")}
              </button>
              <button type="submit" form="edit-user" className="btn btn--primary" disabled={busy !== null}>
                {busy === "edit" ? t("common.saving") : t("common.saveChanges")}
              </button>
            </>
          }
        >
          <Notice kind="error">{failure}</Notice>
          <form id="edit-user" onSubmit={submitEdit} noValidate>
            <div className="grid-2">
              <Field label={t("common.firstName")} value={editForm.firstName} onChange={updateEdit("firstName")} autoFocus />
              <Field label={t("common.lastName")} value={editForm.lastName} onChange={updateEdit("lastName")} />
            </div>
            <Field label={t("common.email")} type="email" value={editForm.email} onChange={updateEdit("email")} />
            <Field
              label={t("users.newPassword")}
              type="password"
              value={editForm.password}
              onChange={updateEdit("password")}
              hint={t("users.newPasswordHint")}
              autoComplete="new-password"
            />
          </form>
        </Modal>
      ) : null}


      {confirmRole ? (
        <Modal
          title={confirmRole.grant ? t("users.grantTitle") : t("users.revokeTitle")}
          onClose={() => setConfirmRole(null)}
          actions={
            <>
              <button type="button" className="btn" onClick={() => setConfirmRole(null)}>
                {t("common.cancel")}
              </button>
              <button
                type="button"
                className={confirmRole.grant ? "btn btn--primary" : "btn btn--danger"}
                disabled={busy !== null}
                onClick={async () => {
                  const { user, grant } = confirmRole;
                  setConfirmRole(null);
                  await act(
                    "role",
                    () =>
                      grant
                        ? addRole({ idUser: user.idUser, role: ADMINISTRATOR, token })
                        : removeRole({ idUser: user.idUser, role: ADMINISTRATOR, token }),
                    grant
                      ? msg("users.granted", { id: user.idUser })
                      : msg("users.revoked", { id: user.idUser }),
                  );
                }}
              >
                {busy === "role" ? t("common.saving") : confirmRole.grant ? t("users.grantAdmin") : t("users.revokeAdmin")}
              </button>
            </>
          }
        >
          <p style={{ marginTop: 0 }}>
            {confirmRole.grant
              ? t("users.grantConfirm", { name: displayName(confirmRole.user), id: confirmRole.user.idUser })
              : t("users.revokeConfirm", { name: displayName(confirmRole.user), id: confirmRole.user.idUser })}
          </p>
        </Modal>
      ) : null}

      {confirmDelete ? (
        <Modal
          title={t("users.deleteTitle")}
          onClose={() => setConfirmDelete(null)}
          actions={
            <>
              <button type="button" className="btn" onClick={() => setConfirmDelete(null)}>
                {t("common.cancel")}
              </button>
              <button
                type="button"
                className="btn btn--danger"
                disabled={busy !== null}
                onClick={async () => {
                  const target = confirmDelete;
                  setConfirmDelete(null);
                  await act(
                    "delete",
                    () => deleteUser({ idUser: target.idUser, token }),
                    msg("users.deleted", { id: target.idUser }),
                  );
                }}
              >
                {busy === "delete" ? t("common.deleting") : t("common.delete")}
              </button>
            </>
          }
        >
          <p style={{ marginTop: 0 }}>
            {t("users.deleteConfirm", { name: displayName(confirmDelete), id: confirmDelete.idUser })}
          </p>
        </Modal>
      ) : null}
    </Layout>
  );
}
