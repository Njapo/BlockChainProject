import React from "react";
import {
  EVENT_TYPES,
  EVENT_TYPE_LIST,
  MAX_OPTIONS,
  formatOptionLabel,
} from "../lib/eventTypes";

// Two-step create flow: pick a title + type, then add the type's options.
export default function NewEventModal({ onClose, onCreate, existingNames }) {
  const [title, setTitle] = React.useState("");
  const [typeKey, setTypeKey] = React.useState("yesno");
  const [options, setOptions] = React.useState([]);
  const [draft, setDraft] = React.useState("");
  const [error, setError] = React.useState("");

  const type = EVENT_TYPES[typeKey];
  const usesEditor = type.inputKind !== null;
  const effectiveOptions = usesEditor ? options : type.fixedOptions;

  function addOption(e) {
    e.preventDefault();
    const val = draft.trim();
    if (!val) return;
    if (options.length >= MAX_OPTIONS) {
      setError(`At most ${MAX_OPTIONS} options.`);
      return;
    }
    if (options.some((o) => o.toLowerCase() === val.toLowerCase())) {
      setError("That option is already in the list.");
      return;
    }
    setOptions((prev) => [...prev, val]);
    setDraft("");
    setError("");
  }

  function removeOption(i) {
    setOptions((prev) => prev.filter((_, idx) => idx !== i));
  }

  function create() {
    const name = title.trim();
    if (!name) {
      setError("Give the event a title.");
      return;
    }
    if (
      existingNames.some((n) => n.trim().toLowerCase() === name.toLowerCase())
    ) {
      setError("An event with this name already exists.");
      return;
    }
    if (usesEditor && options.length < 2) {
      setError("Add at least two options.");
      return;
    }
    onCreate({ description: name, type: typeKey, options: effectiveOptions });
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-head">
          <h3>New event</h3>
          <button className="btn btn-tiny btn-ghost" onClick={onClose}>
            ✕
          </button>
        </header>

        <label className="field-label">Title</label>
        <input
          className="input"
          placeholder="e.g. Adopt the new treasury policy"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <label className="field-label">Event type</label>
        <div className="type-grid">
          {EVENT_TYPE_LIST.map((t) => (
            <button
              key={t.key}
              className={`type-card ${typeKey === t.key ? "type-active" : ""}`}
              onClick={() => {
                setTypeKey(t.key);
                setOptions([]);
                setDraft("");
                setError("");
              }}
            >
              <span className="type-icon">{t.icon}</span>
              <span className="type-name">{t.name}</span>
              <span className="type-desc">{t.desc}</span>
            </button>
          ))}
        </div>

        {usesEditor ? (
          <>
            <label className="field-label">{type.name} options</label>
            <form className="row" onSubmit={addOption}>
              <input
                className="input"
                type={type.inputKind === "number" ? "number" : type.inputKind}
                placeholder={type.placeholder}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <button className="btn btn-primary" type="submit">
                {type.addLabel}
              </button>
            </form>
            <ul className="list">
              {options.length === 0 && (
                <li className="empty">No options yet. Add at least two.</li>
              )}
              {options.map((o, i) => (
                <li key={i} className="list-item">
                  <span className="badge">{i + 1}</span>
                  <span className="list-text">
                    {formatOptionLabel(typeKey, o)}
                  </span>
                  <button
                    className="btn btn-tiny btn-ghost"
                    onClick={() => removeOption(i)}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="fixed-options">
            Options: {type.fixedOptions.join(" · ")}
          </div>
        )}

        {error && <div className="form-error">{error}</div>}

        <footer className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={create}>
            Create event
          </button>
        </footer>
      </div>
    </div>
  );
}
