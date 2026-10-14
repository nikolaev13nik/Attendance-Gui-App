import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import Notice from "../components/Notice.jsx";
import Field from "../components/Field.jsx";
import Modal from "../components/Modal.jsx";
import SessionTable, { LEAVE_AMOUNTS, leaveEntries } from "../components/SessionTable.jsx";
import { listUsers } from "../api/accounting.js";
import {
  addLeaveDays,
  changeLeaveDay,
  changeSession,
  checkIncomplete,
  closeSession,
  getLeaveDays,
  getSessions,
  openSession,
  removeLeaveDay,
  removeSession,
} from "../api/timetracking.js";
import { daysAgo, localWorkDate, timestampOn, toTimeInput } from "../api/time.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { displayName, isAdministrator } from "../auth/roles.js";

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const emptyLeaveForm = (date) => ({ date, sick: "0", vacation: "1" });

export default function Sessions() {
  const navigate = useNavigate();
  const { token, profile } = useAuth();
  const tenantId = profile.tenantId;
  const admin = isAdministrator(profile);
  const today = localWorkDate();

  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({
    idUser: String(profile.idUser),
    startDate: daysAgo(7),
    endDate: today,
  });
  const [rows, setRows] = useState(null);
  const [leave, setLeave] = useState([]);
  const [sortDesc, setSortDesc] = useState(true);
  const [incompleteIds, setIncompleteIds] = useState(new Set());
  const [failure, setFailure] = useState(null);
  const [success, setSuccess] = useState(null);
  const [busy, setBusy] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ open: "", close: "" });
  const [editErrors, setEditErrors] = useState({});
  const [leaveForm, setLeaveForm] = useState(emptyLeaveForm(today));
  const [leaveErrors, setLeaveErrors] = useState({});
  const [recordingLeave, setRecordingLeave] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [recording, setRecording] = useState(false);
  const [recordForm, setRecordForm] = useState({ workDate: today, open: "09:00", close: "17:00" });
  const [recordErrors, setRecordErrors] = useState({});

  useEffect(() => {
    if (!admin) {
      return;
    }
    listUsers({ tenantId, token })
      .then((list) => setUsers(list || []))
      .catch((error) => setFailure(error.message));
  }, [admin, tenantId, token]);

  const load = useCallback(async () => {
    setFailure(null);
    setRows(null);
    const query = { tenantId, token, idUser: Number(filters.idUser), startDate: filters.startDate, endDate: filters.endDate };
    try {
      const [sessions, incomplete, leaveDays] = await Promise.all([
        getSessions(query),
        checkIncomplete(query),
        getLeaveDays(query),
      ]);
      setRows(sessions || []);
      setLeave(leaveDays || []);
      setIncompleteIds(new Set((incomplete || []).map((row) => row.id)));
    } catch (error) {
      setFailure(error.message);
      setRows([]);
      setLeave([]);
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

  function openEdit(entry) {
    setFailure(null);
    setEditing(entry);
    if (entry.kind === "leave") {
      setLeaveErrors({});
      setLeaveForm({
        date: entry.row.date,
        sick: String(entry.row.sickAmount ?? 0),
        vacation: String(entry.row.vacationAmount ?? 0),
      });
      return;
    }
    setEditErrors({});
    setEditForm({ open: toTimeInput(entry.row.openSessionDate), close: toTimeInput(entry.row.closeSessionDate) });
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

  function validateLeave({ date, sick, vacation }, { takenDates }) {
    const next = {};
    if (!date) {
      next.date = "Pick a date.";
    } else if (takenDates && takenDates.includes(date)) {
      next.date = "That date already has a leave day. Edit that row instead.";
    }
    const total = Number(sick) + Number(vacation);
    if (total <= 0) {
      next.vacation = "Record at least half a day of sickness or vacation.";
    } else if (total > 1) {
      next.vacation = "Sickness and vacation together cannot exceed a full day.";
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
    const row = editing.row;
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

  async function submitLeaveEdit(event) {
    event.preventDefault();
    const row = editing.row;
    const takenDates = leave.filter((day) => day.id !== row.id).map((day) => day.date);
    const errors = validateLeave(leaveForm, { takenDates });
    setLeaveErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }
    const ok = await act(
      "edit-leave",
      () =>
        changeLeaveDay({
          tenantId,
          token,
          id: row.id,
          date: leaveForm.date,
          sickAmount: Number(leaveForm.sick),
          vacationAmount: Number(leaveForm.vacation),
        }),
      `Leave day on ${leaveForm.date} was updated.`,
    );
    if (ok) {
      setEditing(null);
    }
  }

  async function submitLeaveRecord(event) {
    event.preventDefault();
    const errors = validateLeave(leaveForm, { takenDates: leave.map((day) => day.date) });
    setLeaveErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }
    const sick = Number(leaveForm.sick);
    const vacation = Number(leaveForm.vacation);
    const ok = await act(
      "record-leave",
      () =>
        addLeaveDays({
          tenantId,
          token,
          idUser: Number(filters.idUser),
          days: [
            {
              date: leaveForm.date,
              ...(vacation > 0 ? { vacationAmount: vacation } : {}),
              ...(sick > 0 ? { sickAmount: sick } : {}),
            },
          ],
        }),
      `Leave day on ${leaveForm.date} was recorded.`,
    );
    if (ok) {
      setRecordingLeave(false);
      setLeaveErrors({});
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
  const updateLeave = (key) => (event) => setLeaveForm((prev) => ({ ...prev, [key]: event.target.value }));
  const updateRecord = (key) => (event) => setRecordForm((prev) => ({ ...prev, [key]: event.target.value }));

  const selectedUser = users.find((user) => String(user.idUser) === filters.idUser);

  const entries = leaveEntries(rows, leave, sortDesc);
  const editingLeave = Boolean(editing && editing.kind === "leave");
  const modalOpen = Boolean(editing || recording || recordingLeave || confirmRemove);

  const rowActions = (entry) => (
    <div className="table__actions">
      {admin ? (
        <>
          <button type="button" className="btn btn--link" onClick={() => openEdit(entry)}>
            Edit
          </button>
          <button
            type="button"
            className="btn btn--link"
            disabled={busy !== null}
            onClick={() => {
              setFailure(null);
              setConfirmRemove(entry);
            }}
          >
            Delete
          </button>
        </>
      ) : null}
    </div>
  );

  return (
    <Layout>
      <div className="card">
        <div className="row row--split" style={{ marginBottom: "0.75rem" }}>
          <div>
            <h1 className="card__title" style={{ marginBottom: 0 }}>
              {admin ? "Sessions" : "My sessions"}
            </h1>
            <p className="card__hint" style={{ marginBottom: 0 }}>
              {admin ? "Review and correct recorded work sessions." : "Your recorded sessions and leave days."}
            </p>
          </div>
          <div className="row">
            <button type="button" className="btn" onClick={() => navigate("/home")}>
              Back
            </button>
            {admin ? (
              <>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setFailure(null);
                    setLeaveErrors({});
                    setLeaveForm(emptyLeaveForm(today));
                    setRecordingLeave(true);
                  }}
                >
                  Add new leave day
                </button>
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => {
                    setFailure(null);
                    setRecording(true);
                  }}
                >
                  Add new session
                </button>
              </>
            ) : null}
          </div>
        </div>

        <div className="row" style={{ alignItems: "flex-end", marginBottom: "1rem" }}>
          {admin ? (
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
          ) : null}
          <Field label="From" type="date" value={filters.startDate} onChange={updateFilter("startDate")} />
          <Field label="To" type="date" value={filters.endDate} onChange={updateFilter("endDate")} />
        </div>

        {modalOpen ? null : <Notice kind="error">{failure}</Notice>}
        <Notice kind="success">{success}</Notice>
        {incompleteIds.size > 0 ? (
          <Notice kind="error">
            {incompleteIds.size} session{incompleteIds.size === 1 ? " is" : "s are"} incomplete (marked
            below). Reports for this period will be refused until each one is corrected or removed.
          </Notice>
        ) : null}

        {rows === null ? (
          <p className="spinner">Loading…</p>
        ) : entries.length === 0 ? (
          <p className="spinner">
            Nothing recorded for {admin && selectedUser ? displayName(selectedUser) : "you"} in that range.
          </p>
        ) : (
          <SessionTable
            sessions={rows}
            leave={leave}
            incompleteIds={incompleteIds}
            sortDesc={sortDesc}
            onToggleSort={() => setSortDesc((d) => !d)}
            actions={admin ? rowActions : undefined}
          />
        )}
      </div>

      {editing && !editingLeave ? (
        <Modal
          title={`Edit session ${editing.row.id}`}
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
          <Notice kind="error">{failure}</Notice>
          <p className="card__hint">Work date {editing.row.workDate}. Times are in your local timezone.</p>
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

      {editingLeave ? (
        <Modal
          title="Edit leave day"
          onClose={() => setEditing(null)}
          actions={
            <>
              <button type="button" className="btn" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button type="submit" form="edit-leave" className="btn btn--primary" disabled={busy !== null}>
                {busy === "edit-leave" ? "Saving…" : "Save"}
              </button>
            </>
          }
        >
          <Notice kind="error">{failure}</Notice>
          <p className="card__hint">
            One record per date. Setting both portions to none is not an edit — delete the row instead.
          </p>
          <form id="edit-leave" onSubmit={submitLeaveEdit} noValidate>
            <Field
              label="Date"
              type="date"
              value={leaveForm.date}
              onChange={updateLeave("date")}
              error={leaveErrors.date}
            />
            <div className="grid-2">
              <Field label="Sickness" as="select" value={leaveForm.sick} onChange={updateLeave("sick")}>
                {LEAVE_AMOUNTS.map((amount) => (
                  <option key={amount.value} value={amount.value}>
                    {amount.label}
                  </option>
                ))}
              </Field>
              <Field
                label="Vacation"
                as="select"
                value={leaveForm.vacation}
                onChange={updateLeave("vacation")}
                error={leaveErrors.vacation}
              >
                {LEAVE_AMOUNTS.map((amount) => (
                  <option key={amount.value} value={amount.value}>
                    {amount.label}
                  </option>
                ))}
              </Field>
            </div>
          </form>
        </Modal>
      ) : null}

      {recordingLeave ? (
        <Modal
          title="Add new leave day"
          onClose={() => setRecordingLeave(false)}
          actions={
            <>
              <button type="button" className="btn" onClick={() => setRecordingLeave(false)}>
                Cancel
              </button>
              <button type="submit" form="record-leave" className="btn btn--primary" disabled={busy !== null}>
                {busy === "record-leave" ? "Adding…" : "Add leave day"}
              </button>
            </>
          }
        >
          <p className="card__hint">
            For {selectedUser ? displayName(selectedUser) : "the selected employee"}. A date may hold half
            sickness and half vacation, but never more than a full day.
          </p>
          <Notice kind="error">{failure}</Notice>
          <form id="record-leave" onSubmit={submitLeaveRecord} noValidate>
            <Field
              label="Date"
              type="date"
              value={leaveForm.date}
              onChange={updateLeave("date")}
              error={leaveErrors.date}
            />
            <div className="grid-2">
              <Field label="Sickness" as="select" value={leaveForm.sick} onChange={updateLeave("sick")}>
                {LEAVE_AMOUNTS.map((amount) => (
                  <option key={amount.value} value={amount.value}>
                    {amount.label}
                  </option>
                ))}
              </Field>
              <Field
                label="Vacation"
                as="select"
                value={leaveForm.vacation}
                onChange={updateLeave("vacation")}
                error={leaveErrors.vacation}
              >
                {LEAVE_AMOUNTS.map((amount) => (
                  <option key={amount.value} value={amount.value}>
                    {amount.label}
                  </option>
                ))}
              </Field>
            </div>
          </form>
        </Modal>
      ) : null}

      {recording ? (
        <Modal
          title="Add new session"
          onClose={() => setRecording(false)}
          actions={
            <>
              <button type="button" className="btn" onClick={() => setRecording(false)}>
                Cancel
              </button>
              <button type="submit" form="record-session" className="btn btn--primary" disabled={busy !== null}>
                {busy === "record" ? "Adding…" : "Add session"}
              </button>
            </>
          }
        >
          <p className="card__hint">
            For {selectedUser ? displayName(selectedUser) : "the selected employee"}. As an administrator
            you may record earlier days; future dates are refused.
          </p>
          <Notice kind="error">{failure}</Notice>
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
          title={confirmRemove.kind === "leave" ? "Delete leave day" : "Delete session"}
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
                  if (target.kind === "leave") {
                    await act(
                      "delete",
                      () => removeLeaveDay({ tenantId, token, id: target.row.id }),
                      `Leave day on ${target.row.date} was deleted.`,
                    );
                    return;
                  }
                  await act(
                    "delete",
                    () => removeSession({ tenantId, token, id: target.row.id }),
                    `Session ${target.row.id} was deleted.`,
                  );
                }}
              >
                {busy === "delete" ? "Deleting…" : "Delete"}
              </button>
            </>
          }
        >
          <p style={{ marginTop: 0 }}>
            {confirmRemove.kind === "leave"
              ? `Delete the leave day on ${confirmRemove.row.date}? This cannot be undone.`
              : `Delete session ${confirmRemove.row.id} on ${confirmRemove.row.workDate}? This cannot be undone.`}
          </p>
        </Modal>
      ) : null}
    </Layout>
  );
}
