export default function Modal({ title, children, onClose, actions }) {
  return (
    <div className="modal__backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="card__title">{title}</h2>
        {children}
        <div className="row row--end" style={{ marginTop: "1rem" }}>
          {actions}
        </div>
      </div>
    </div>
  );
}
