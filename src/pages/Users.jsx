import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import Notice from "../components/Notice.jsx";
import Field from "../components/Field.jsx";
import Modal from "../components/Modal.jsx";
import { addRole, deleteUser, editUser, listUsers, registerUser, removeRole } from "../api/accounting.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { ADMINISTRATOR, displayName, isAdministrator } from "../auth/roles.js";

const EMPTY_CREATE = { idUser: "", firstName: "", lastName: "", email: "", password: "" };

export default function Users() {
  const navigate = useNavigate();
  const { token, profile } = useAuth();
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
      setFailure(error.message);
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
      setFailure(error.message);
      return false;
    } finally {
      setBusy(null);
    }
  }

  function validateCreate() {
    const next = {};
    if (!/^\d+$/.test(createForm.idUser) || Number(createForm.idUser) < 1) {
      next.idUser = "Enter a whole number of 1 or more.";
    }
    if (!/^\S+@\S+\.\S+$/.test(createForm.email)) {
      next.email = "Enter a valid email address.";
    }
    if (createForm.password.length < 4) {
      next.password = "Use at least 4 characters.";
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
      `User ${createForm.idUser} was added.`,
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
      `User ${target.idUser} was updated.`,
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
              Users
            </h1>
            <p className="card__hint" style={{ marginBottom: 0 }}>
              Everyone in organization {tenantId}.
            </p>
          </div>
          <div className="row">
            <button type="button" className="btn" onClick={() => navigate("/home")}>
              Back
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => {
                setFailure(null);
                setCreating(true);
              }}
            >
              Add user
            </button>
          </div>
        </div>

        {modalOpen ? null : <Notice kind="error">{failure}</Notice>}
        <Notice kind="success">{success}</Notice>

        {users === null ? (
          <p className="spinner">Loading…</p>
        ) : users.length === 0 ? (
          <p className="spinner">No users found in this organization.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Roles</th>
                <th aria-label="Actions" />
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
                      {self ? <span className="tag tag--you" style={{ marginLeft: "0.4rem" }}>you</span> : null}
                    </td>
                    <td>{user.email || "—"}</td>
                    <td>
                      {(user.roles || []).map((role) => (
                        <span
                          key={role}
                          className={`tag${role.toUpperCase() === ADMINISTRATOR ? " tag--admin" : ""}`}
                        >
                          {role}
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
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn--link"
                          disabled={(admin && self) || busy !== null}
                          title={admin && self ? "You cannot remove your own administrator role" : undefined}
                          onClick={() => setConfirmRole({ user, grant: !admin })}
                        >
                          {admin ? "Revoke admin" : "Grant admin"}
                        </button>
                        <button
                          type="button"
                          className="btn btn--link"
                          disabled={self || busy !== null}
                          title={self ? "You cannot delete your own account" : undefined}
                          onClick={() => setConfirmDelete(user)}
                        >
                          Delete
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
          title="Add user"
          onClose={() => setCreating(false)}
          actions={
            <>
              <button type="button" className="btn" onClick={() => setCreating(false)}>
                Cancel
              </button>
              <button type="submit" form="create-user" className="btn btn--primary" disabled={busy !== null}>
                {busy === "create" ? "Adding…" : "Add user"}
              </button>
            </>
          }
        >
          <Notice kind="error">{failure}</Notice>
          <p className="card__hint">
            New users receive the standard role. Grant administrator from the table afterwards if needed.
          </p>
          <form id="create-user" onSubmit={submitCreate} noValidate>
            <Field
              label="User ID"
              type="number"
              min="1"
              step="1"
              value={createForm.idUser}
              onChange={updateCreate("idUser")}
              error={createErrors.idUser}
              autoFocus
            />
            <div className="grid-2">
              <Field label="First name" value={createForm.firstName} onChange={updateCreate("firstName")} />
              <Field label="Last name" value={createForm.lastName} onChange={updateCreate("lastName")} />
            </div>
            <Field
              label="Email"
              type="email"
              value={createForm.email}
              onChange={updateCreate("email")}
              error={createErrors.email}
            />
            <Field
              label="Password"
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
          title={`Edit user ${editing.idUser}`}
          onClose={() => setEditing(null)}
          actions={
            <>
              <button type="button" className="btn" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button type="submit" form="edit-user" className="btn btn--primary" disabled={busy !== null}>
                {busy === "edit" ? "Saving…" : "Save changes"}
              </button>
            </>
          }
        >
          <Notice kind="error">{failure}</Notice>
          <form id="edit-user" onSubmit={submitEdit} noValidate>
            <div className="grid-2">
              <Field label="First name" value={editForm.firstName} onChange={updateEdit("firstName")} autoFocus />
              <Field label="Last name" value={editForm.lastName} onChange={updateEdit("lastName")} />
            </div>
            <Field label="Email" type="email" value={editForm.email} onChange={updateEdit("email")} />
            <Field
              label="New password"
              type="password"
              value={editForm.password}
              onChange={updateEdit("password")}
              hint="Leave blank to keep the current password."
              autoComplete="new-password"
            />
          </form>
        </Modal>
      ) : null}


      {confirmRole ? (
        <Modal
          title={confirmRole.grant ? "Grant administrator" : "Revoke administrator"}
          onClose={() => setConfirmRole(null)}
          actions={
            <>
              <button type="button" className="btn" onClick={() => setConfirmRole(null)}>
                Cancel
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
                      ? `User ${user.idUser} is now an administrator.`
                      : `User ${user.idUser} is no longer an administrator.`,
                  );
                }}
              >
                {busy === "role" ? "Saving…" : confirmRole.grant ? "Grant admin" : "Revoke admin"}
              </button>
            </>
          }
        >
          <p style={{ marginTop: 0 }}>
            {confirmRole.grant
              ? `Give ${displayName(confirmRole.user)} (ID ${confirmRole.user.idUser}) administrator rights? They will be able to manage every user and every session in this organization.`
              : `Remove administrator rights from ${displayName(confirmRole.user)} (ID ${confirmRole.user.idUser})? They will keep their account and can still record their own sessions.`}
          </p>
        </Modal>
      ) : null}

      {confirmDelete ? (
        <Modal
          title="Delete user"
          onClose={() => setConfirmDelete(null)}
          actions={
            <>
              <button type="button" className="btn" onClick={() => setConfirmDelete(null)}>
                Cancel
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
                    `User ${target.idUser} was deleted.`,
                  );
                }}
              >
                {busy === "delete" ? "Deleting…" : "Delete"}
              </button>
            </>
          }
        >
          <p style={{ marginTop: 0 }}>
            Delete {displayName(confirmDelete)} (ID {confirmDelete.idUser})? Their recorded work sessions
            are kept, but they will no longer be able to sign in.
          </p>
        </Modal>
      ) : null}
    </Layout>
  );
}
