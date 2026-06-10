import React from "react";
import { formatOptionLabel } from "../lib/eventTypes";

// Popup for casting a single voter's ballot: pick one option, then confirm.
// Starts from the voter's existing choice (if any) so "Change vote" works.
export default function VoteModal({ voter, event, onConfirm, onClose }) {
  const [selected, setSelected] = React.useState(
    event.choices[voter.id] ?? null
  );

  function confirm() {
    if (selected === null) return;
    onConfirm(selected);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
        <header className="modal-head">
          <h3>{voter.name} · cast ballot</h3>
          <button className="btn btn-tiny btn-ghost" onClick={onClose}>
            ✕
          </button>
        </header>

        <p className="card-hint">{event.description}</p>

        <div className="vote-options">
          {event.options.map((label, idx) => (
            <button
              key={idx}
              className={`btn btn-option vote-option ${
                selected === idx ? "option-active" : ""
              }`}
              style={
                selected === idx
                  ? {
                      borderColor: event.color,
                      background: `${event.color}22`,
                      color: event.color,
                    }
                  : undefined
              }
              onClick={() => setSelected(idx)}
            >
              {formatOptionLabel(event.type, label)}
            </button>
          ))}
        </div>

        <footer className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={confirm}
            disabled={selected === null}
          >
            OK
          </button>
        </footer>
      </div>
    </div>
  );
}
