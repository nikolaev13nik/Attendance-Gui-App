import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import Notice from "../components/Notice.jsx";
import Field from "../components/Field.jsx";
import Modal from "../components/Modal.jsx";
import { listUsers } from "../api/accounting.js";
import {
  changeSession,
  checkIncomplete,
  closeSession,
  getSessions,
  openSession,
  removeSession,
} from "../api/timetracking.js";
import { daysAgo, formatTime, localWorkDate, timestampOn, toTimeInput } from "../api/time.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { displayName } from "../auth/roles.js";

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export default function Sessions() {
  const navigate = useNavigate();
  const { token, profile } = useAuth();
  const tenantId = profile.tenantId;
  const today = localWorkDate();

  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({
    idUser: String(profile.idUser),
    startDate: daysAgo(7),
    endDate: today,
  });
  const [rows, setRows] = useState(null);
  const [incompleteIds, setIncompleteIds] = useState(new Set());
  const [failure, setFailure] = useState(null);
  const [success, setSuccess] = useState(null);
  const [busy, setBusy] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ open: "", close: "" });
  const [editErrors, setEditErrors] = useState({});
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [recording, setRecording] = useState(false);
  const [recordForm, setRecordForm] = useState({ workDate: today, open: "09:00", close: "17:00" });
  const [recordErrors, setRecordErrors] = useState({});

  useEffect(() => {
    listUsers({ tenantId, token })
      .then((list) => setUsers(list || []))
      .catch((error) => setFailure(error.message));
  }, [tenantId, token]);

  const load = useCallback(async () => {
    setFailure(null);
    setRows(null);
    const query = { tenantId, token, idUser: Number(filters.idUser), startDate: filters.startDate, endDate: filters.endDate };
    try {
      const [sessions, incomplete] = await Promise.all([getSessions(query), checkIncomplete(query)]);
      setRows(sessions || []);
      setIncompleteIds(new Set((incomplete || []).map((row) => row.id)));
    } catch (error) {
      setFailure(error.message);
      setRows([]);
      setIncompleteIds(new Set());
    }
  }, [filters, tenantId, token]);

  useEffect(() => {
    load();
  }, [load]);

  async function act(label, operation, message) {
    setFailure(null);
    setSuccess(null);
    setBusy(label);
    try {
      await operation();
      await load();
      setSuccess(message);
      return true;
    } catch (error) {
      setFailure(error.message);
      return false;
    } finally {
      setBusy(null);
    }
  }

  function openEdit(row) {
    setEditing(row);
    setEditErrors({});
    setEditForm({ open: toTimeInput(row.openSessionDate), close: toTimeInput(row.closeSessionDate) });
  }

  function validateTimes({ open, close }, { requireBoth }) {
    const next = {};
    if (open && !TIME_PATTERN.test(open)) {
      next.open = "Use HH:MM, for example 09:00.";
    }
    if (close && !TIME_PATTERN.test(close)) {
      next.close = "Use HH:MM, for example 17:30.";
    }
    if (requireBoth) {
      if (!open) {
        next.open = "Enter a start time.";
      }
      if (!close) {
        next.close = "Enter an end time.";
      }
    }
    if (!next.open && !next.close && open && close && open >= close) {
      next.close = "The end time must be after the start time.";
    }
    return next;
  }

  async function submitEdit(event) {
    event.preventDefault();
    const errors = validateTimes(editForm, { requireBoth: false });
    setEditErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }
    const row = editing;
    const ok = await act(
      "edit",
      () =>
        changeSession({
          tenantId,
          token,
          id: row.id,
          openSessionDate: editForm.open ? timestampOn(row.workDate, editForm.open) : undefined,
          closeSessionDate: editForm.close ? timestampOn(row.workDate, editForm.close) : undefined,
        }),
      `Session ${row.id} was updated.`,
    );
    if (ok) {
      setEditing(null);
    }
  }

  async function submitRecord(event) {
    event.preventDefault();
    const errors = validateTimes(recordForm, { requireBoth: true });
    if (!recordForm.workDate) {
      errors.workDate = "Pick a date.";
    } else if (recordForm.workDate > today) {
      errors.workDate = "The server rejects future dates.";
    }
    setRecordErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }
    const { workDate, open, close } = recordForm;
    const target = Number(filters.idUser);
    const ok = await act(
      "record",
      async () => {
        const [y, m, d] = workDate.split("-").map(Number);
        const [oh, om] = open.split(":").map(Number);
        const [ch, cm] = close.split(":").map(Number);
        await openSession({ tenantId, token, idUser: target, at: new Date(y, m - 1, d, oh, om, 0, 0) });
        await closeSession({ tenantId, token, idUser: target, at: new Date(y, m - 1, d, ch, cm, 0, 0) });
      },
      `Recorded ${open}–${close} on ${workDate}.`,
    );
    if (ok) {
      setRecording(false);
      setRecordErrors({});
    }
  }

  const updateFilter = (key) => (event) => setFilters((prev) => ({ ...prev, [key]: event.target.value }));
  const updateEdit = (key) => (event) => setEditForm((prev) => ({ ...prev, [key]: event.target.value }));
  const updateRecord = (key) => (event) => setRecordForm((prev) => ({ ...prev, [key]: event.target.value }));

  const selectedUser = users.find((user) => String(user.idUser) === filters.idUser);

  return (
    <Layout>
      <div className="card">
        <div className="row row--split" style={{ marginBottom: "0.75rem" }}>
          <div>
            <h1 className="card__title" style={{ marginBottom: 0 }}>
              Sessions
            </h1>
            <p className="card__hint" style={{ marginBottom: 0 }}>
              Review and correct recorded work sessions.
            </p>
          </div>
          <div className="row">
            <button type="button" className="btn" onClick={() => navigate("/home")}>
              Back
            </button>
            <button type="button" className="btn btn--primary" onClick={() => setRecording(true)}>
              Record a session
            </button>
          </div>
        </div>

        <div className="row" style={{ alignItems: "flex-end", marginBottom: "1rem" }}>
          <div className="field" style={{ marginBottom: 0, minWidth: "14rem" }}>
            <label className="field__label" htmlFor="filter-user">
              Employee
            </label>
            <select
              id="filter-user"
              className="field__input"
              value={filters.idUser}
              onChange={updateFilter("idUser")}
            >
              {users.map((user) => (
                <option key={user.idUser} value={String(user.idUser)}>
                  {displayName(user)} ({user.idUser})
                </option>
              ))}
            </select>
          </div>
          <Field label="From" type="date" value={filters.startDate} onChange={updateFilter("startDate")} />
          <Field label="To" type="date" value={filters.endDate} onChange={updateFilter("endDate")} />
        </div>

        <Notice kind="error">{failure}</Notice>
        <Notice kind="success">{success}</Notice>
        {incompleteIds.size > 0 ? (
          <Notice kind="error">
            {incompleteIds.size} session{incompleteIds.size === 1 ? " is" : "s are"} incomplete (marked
            below). Reports for this period will be refused until each one is corrected or removed.
          </Notice>
        ) : null}

        {rows === null ? (
          <p className="spinner">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="spinner">
            No sessions for {selectedUser ? displayName(selectedUser) : "this employee"} in that range.
          </p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Work date</th>
                <th>Start</th>
                <th>End</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const incomplete = incompleteIds.has(row.id);
                return (
                  <tr key={row.id}>
                    <td>{row.id}</td>
                    <td>{row.workDate}</td>
                    <td>{formatTime(row.openSessionDate) || <span className="tag">missing</span>}</td>
                    <td>{formatTime(row.closeSessionDate) || <span className="tag">missing</span>}</td>
                    <td>
                      <div className="table__actions">
                        {incomplete ? <span className="tag tag--admin">needs fixing</span> : null}
                        <button type="button" className="btn btn--link" onClick={() => openEdit(row)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn--link"
                          disabled={busy !== null}
                          onClick={() => setConfirmRemove(row)}
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

      {editing ? (
        <Modal
          title={`Edit session ${editing.id}`}
          onClose={() => setEditing(null)}
          actions={
            <>
              <button type="button" className="btn" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button type="submit" form="edit-session" className="btn btn--primary" disabled={busy !== null}>
                {busy === "edit" ? "Saving…" : "Save"}
              </button>
            </>
          }
        >
          <p className="card__hint">Work date {editing.workDate}. Times are in your local timezone.</p>
          <form id="edit-session" onSubmit={submitEdit} noValidate>
            <div className="grid-2">
              <Field
                label="Start"
                type="time"
                value={editForm.open}
                onChange={updateEdit("open")}
                error={editErrors.open}
              />
              <Field
                label="End"
                type="time"
                value={editForm.close}
                onChange={updateEdit("close")}
                error={editErrors.close}
              />
            </div>
          </form>
        </Modal>
      ) : null}

      {recording ? (
        <Modal
          title="Record a session"
          onClose={() => setRecording(false)}
          actions={
            <>
              <button type="button" className="btn" onClick={() => setRecording(false)}>
                Cancel
              </button>
              <button type="submit" form="record-session" className="btn btn--primary" disabled={busy !== null}>
                {busy === "record" ? "Recording…" : "Record"}
              </button>
            </>
          }
        >
          <p className="card__hint">
            For {selectedUser ? displayName(selectedUser) : "the selected employee"}. As an administrator
            you may record earlier days; future dates are refused.
          </p>
          <form id="record-session" onSubmit={submitRecord} noValidate>
            <Field
              label="Work date"
              type="date"
              max={today}
              value={recordForm.workDate}
              onChange={updateRecord("workDate")}
              error={recordErrors.workDate}
            />
            <div className="grid-2">
              <Field
                label="Start"
                type="time"
                value={recordForm.open}
                onChange={updateRecord("open")}
                error={recordErrors.open}
              />
              <Field
                label="End"
                type="time"
                value={recordForm.close}
                onChange={updateRecord("close")}
                error={recordErrors.close}
              />
            </div>
          </form>
        </Modal>
      ) : null}

      {confirmRemove ? (
        <Modal
          title="Delete session"
          onClose={() => setConfirmRemove(null)}
          actions={
            <>
              <button type="button" className="btn" onClick={() => setConfirmRemove(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn--danger"
                disabled={busy !== null}
                onClick={async () => {
                  const target = confirmRemove;
                  setConfirmRemove(null);
                  await act(
                    "delete",
                    () => removeSession({ tenantId, token, id: target.id }),
                    `Session ${target.id} was deleted.`,
                  );
                }}
              >
                {busy === "delete" ? "Deleting…" : "Delete"}
              </button>
            </>
          }
        >
          <p style={{ marginTop: 0 }}>
            Delete session {confirmRemove.id} on {confirmRemove.workDate}? This cannot be undone.
          </p>
        </Modal>
      ) : null}
    </Layout>
  );
}
