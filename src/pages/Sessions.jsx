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
import { msg, useI18n } from "../i18n/I18nContext.jsx";

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const emptyLeaveForm = (date) => ({ date, sick: "0", vacation: "1" });

export default function Sessions() {
  const navigate = useNavigate();
  const { token, profile } = useAuth();
  const { t } = useI18n();
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
  const [startDesc, setStartDesc] = useState(false);
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
      .catch((error) => setFailure(error));
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
      setFailure(error);
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
      setFailure(error);
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
      next.open = msg("sessions.error.openFormat");
    }
    if (close && !TIME_PATTERN.test(close)) {
      next.close = msg("sessions.error.closeFormat");
    }
    if (requireBoth) {
      if (!open) {
        next.open = msg("sessions.error.openRequired");
      }
      if (!close) {
        next.close = msg("sessions.error.closeRequired");
      }
    }
    if (!next.open && !next.close && open && close && open >= close) {
      next.close = msg("sessions.error.order");
    }
    return next;
  }

  function validateLeave({ date, sick, vacation }, { takenDates }) {
    const next = {};
    if (!date) {
      next.date = msg("common.pickDate");
    } else if (takenDates && takenDates.includes(date)) {
      next.date = msg("sessions.error.dateTaken");
    }
    const total = Number(sick) + Number(vacation);
    if (total <= 0) {
      next.vacation = msg("sessions.error.leaveMin");
    } else if (total > 1) {
      next.vacation = msg("sessions.error.leaveMax");
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
      msg("sessions.updated", { id: row.id }),
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
      msg("sessions.leaveUpdated", { date: leaveForm.date }),
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
      msg("sessions.leaveRecorded", { date: leaveForm.date }),
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
      errors.workDate = msg("common.pickDate");
    } else if (recordForm.workDate > today) {
      errors.workDate = msg("sessions.error.future");
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
      msg("sessions.recorded", { open, close, date: workDate }),
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

  const entries = leaveEntries(rows, leave, sortDesc, startDesc);
  const editingLeave = Boolean(editing && editing.kind === "leave");
  const modalOpen = Boolean(editing || recording || recordingLeave || confirmRemove);

  const rowActions = (entry) => (
    <div className="table__actions">
      {admin ? (
        <>
          <button type="button" className="btn btn--link" onClick={() => openEdit(entry)}>
            {t("common.edit")}
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
            {t("common.delete")}
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
              {admin ? t("sessions.title") : t("home.mySessions")}
            </h1>
            <p className="card__hint" style={{ marginBottom: 0 }}>
              {admin ? t("sessions.adminHint") : t("sessions.userHint")}
            </p>
          </div>
          <div className="row">
            <button type="button" className="btn" onClick={() => navigate("/home")}>
              {t("common.back")}
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
                  {t("sessions.addLeave")}
                </button>
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => {
                    setFailure(null);
                    setRecording(true);
                  }}
                >
                  {t("sessions.addSession")}
                </button>
              </>
            ) : null}
          </div>
        </div>

        <div className="row" style={{ alignItems: "flex-end", marginBottom: "1rem" }}>
          {admin ? (
            <div className="field" style={{ marginBottom: 0, minWidth: "14rem" }}>
              <label className="field__label" htmlFor="filter-user">
                {t("common.employee")}
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
          <Field label={t("common.from")} type="date" value={filters.startDate} onChange={updateFilter("startDate")} />
          <Field label={t("common.to")} type="date" value={filters.endDate} onChange={updateFilter("endDate")} />
        </div>

        {modalOpen ? null : <Notice kind="error">{failure}</Notice>}
        <Notice kind="success">{success}</Notice>
        {incompleteIds.size > 0 ? (
          <Notice kind="error">
            {t("sessions.incomplete", { count: incompleteIds.size })}
          </Notice>
        ) : null}

        {rows === null ? (
          <p className="spinner">{t("common.loading")}</p>
        ) : entries.length === 0 ? (
          <p className="spinner">
            {admin && selectedUser
              ? t("sessions.nothingFor", { name: displayName(selectedUser) })
              : t("session.nothingForYou")}
          </p>
        ) : (
          <SessionTable
            sessions={rows}
            leave={leave}
            incompleteIds={incompleteIds}
            sortDesc={sortDesc}
            startDesc={startDesc}
            onToggleSort={() => setSortDesc((d) => !d)}
            onToggleStartSort={() => setStartDesc((d) => !d)}
            actions={admin ? rowActions : undefined}
          />
        )}
      </div>

      {editing && !editingLeave ? (
        <Modal
          title={t("sessions.editTitle", { id: editing.row.id })}
          onClose={() => setEditing(null)}
          actions={
            <>
              <button type="button" className="btn" onClick={() => setEditing(null)}>
                {t("common.cancel")}
              </button>
              <button type="submit" form="edit-session" className="btn btn--primary" disabled={busy !== null}>
                {busy === "edit" ? t("common.saving") : t("common.save")}
              </button>
            </>
          }
        >
          <Notice kind="error">{failure}</Notice>
          <p className="card__hint">{t("sessions.editHint", { date: editing.row.workDate })}</p>
          <form id="edit-session" onSubmit={submitEdit} noValidate>
            <div className="grid-2">
              <Field
                label={t("common.start")}
                type="time"
                value={editForm.open}
                onChange={updateEdit("open")}
                error={editErrors.open}
              />
              <Field
                label={t("common.end")}
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
          title={t("sessions.editLeaveTitle")}
          onClose={() => setEditing(null)}
          actions={
            <>
              <button type="button" className="btn" onClick={() => setEditing(null)}>
                {t("common.cancel")}
              </button>
              <button type="submit" form="edit-leave" className="btn btn--primary" disabled={busy !== null}>
                {busy === "edit-leave" ? t("common.saving") : t("common.save")}
              </button>
            </>
          }
        >
          <Notice kind="error">{failure}</Notice>
          <p className="card__hint">
            {t("sessions.editLeaveHint")}
          </p>
          <form id="edit-leave" onSubmit={submitLeaveEdit} noValidate>
            <Field
              label={t("common.date")}
              type="date"
              value={leaveForm.date}
              onChange={updateLeave("date")}
              error={leaveErrors.date}
            />
            <div className="grid-2">
              <Field label={t("common.sickness")} as="select" value={leaveForm.sick} onChange={updateLeave("sick")}>
                {LEAVE_AMOUNTS.map((amount) => (
                  <option key={amount.value} value={amount.value}>
                    {t(amount.label)}
                  </option>
                ))}
              </Field>
              <Field
                label={t("common.vacation")}
                as="select"
                value={leaveForm.vacation}
                onChange={updateLeave("vacation")}
                error={leaveErrors.vacation}
              >
                {LEAVE_AMOUNTS.map((amount) => (
                  <option key={amount.value} value={amount.value}>
                    {t(amount.label)}
                  </option>
                ))}
              </Field>
            </div>
          </form>
        </Modal>
      ) : null}

      {recordingLeave ? (
        <Modal
          title={t("sessions.addLeave")}
          onClose={() => setRecordingLeave(false)}
          actions={
            <>
              <button type="button" className="btn" onClick={() => setRecordingLeave(false)}>
                {t("common.cancel")}
              </button>
              <button type="submit" form="record-leave" className="btn btn--primary" disabled={busy !== null}>
                {busy === "record-leave" ? t("common.adding") : t("sessions.addLeaveSubmit")}
              </button>
            </>
          }
        >
          <p className="card__hint">
            {t("sessions.addLeaveHint", { name: selectedUser ? displayName(selectedUser) : t("sessions.selectedEmployee") })}
          </p>
          <Notice kind="error">{failure}</Notice>
          <form id="record-leave" onSubmit={submitLeaveRecord} noValidate>
            <Field
              label={t("common.date")}
              type="date"
              value={leaveForm.date}
              onChange={updateLeave("date")}
              error={leaveErrors.date}
            />
            <div className="grid-2">
              <Field label={t("common.sickness")} as="select" value={leaveForm.sick} onChange={updateLeave("sick")}>
                {LEAVE_AMOUNTS.map((amount) => (
                  <option key={amount.value} value={amount.value}>
                    {t(amount.label)}
                  </option>
                ))}
              </Field>
              <Field
                label={t("common.vacation")}
                as="select"
                value={leaveForm.vacation}
                onChange={updateLeave("vacation")}
                error={leaveErrors.vacation}
              >
                {LEAVE_AMOUNTS.map((amount) => (
                  <option key={amount.value} value={amount.value}>
                    {t(amount.label)}
                  </option>
                ))}
              </Field>
            </div>
          </form>
        </Modal>
      ) : null}

      {recording ? (
        <Modal
          title={t("sessions.addSession")}
          onClose={() => setRecording(false)}
          actions={
            <>
              <button type="button" className="btn" onClick={() => setRecording(false)}>
                {t("common.cancel")}
              </button>
              <button type="submit" form="record-session" className="btn btn--primary" disabled={busy !== null}>
                {busy === "record" ? t("common.adding") : t("sessions.addSessionSubmit")}
              </button>
            </>
          }
        >
          <p className="card__hint">
            {t("sessions.addSessionHint", { name: selectedUser ? displayName(selectedUser) : t("sessions.selectedEmployee") })}
          </p>
          <Notice kind="error">{failure}</Notice>
          <form id="record-session" onSubmit={submitRecord} noValidate>
            <Field
              label={t("sessions.workDate")}
              type="date"
              max={today}
              value={recordForm.workDate}
              onChange={updateRecord("workDate")}
              error={recordErrors.workDate}
            />
            <div className="grid-2">
              <Field
                label={t("common.start")}
                type="time"
                value={recordForm.open}
                onChange={updateRecord("open")}
                error={recordErrors.open}
              />
              <Field
                label={t("common.end")}
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
          title={confirmRemove.kind === "leave" ? t("sessions.deleteLeaveTitle") : t("sessions.deleteSessionTitle")}
          onClose={() => setConfirmRemove(null)}
          actions={
            <>
              <button type="button" className="btn" onClick={() => setConfirmRemove(null)}>
                {t("common.cancel")}
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
                      msg("sessions.leaveDeleted", { date: target.row.date }),
                    );
                    return;
                  }
                  await act(
                    "delete",
                    () => removeSession({ tenantId, token, id: target.row.id }),
                    msg("sessions.deleted", { id: target.row.id }),
                  );
                }}
              >
                {busy === "delete" ? t("common.deleting") : t("common.delete")}
              </button>
            </>
          }
        >
          <p style={{ marginTop: 0 }}>
            {confirmRemove.kind === "leave"
              ? t("sessions.deleteLeaveConfirm", { date: confirmRemove.row.date })
              : t("sessions.deleteSessionConfirm", { id: confirmRemove.row.id, date: confirmRemove.row.workDate })}
          </p>
        </Modal>
      ) : null}
    </Layout>
  );
}
