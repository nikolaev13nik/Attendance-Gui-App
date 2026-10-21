import { useId } from "react";

export default function Field({ label, hint, error, id, as = "input", children, ...controlProps }) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const className = `field__input${error ? " field__input--invalid" : ""}`;
  const shared = {
    id: inputId,
    className,
    "aria-invalid": error ? "true" : undefined,
    "aria-describedby": error ? `${inputId}-error` : undefined,
    ...controlProps,
  };

  return (
    <div className="field">
      <label className="field__label" htmlFor={inputId}>
        {label}
      </label>
      {as === "textarea" ? (
        <textarea rows={10} {...shared} />
      ) : as === "select" ? (
        <select {...shared}>{children}</select>
      ) : (
        <input {...shared} />
      )}
      {error ? (
        <span className="field__error" id={`${inputId}-error`}>
          {error}
        </span>
      ) : null}
      {!error && hint ? <span className="field__hint">{hint}</span> : null}
    </div>
  );
}
