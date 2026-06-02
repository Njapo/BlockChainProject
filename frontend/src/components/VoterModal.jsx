import React from "react";

// Modal where a single voter casts a YES/NO choice on every event.
// Choices are recorded locally; proofs are generated later at submit time.
export default function VoterModal({
  voter,
  events,
  choices,
  setChoice,
  onClose,
}) {
  if (!voter) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-head">
          <h3>Voter #{voter.id} · ballots</h3>
          <button className="btn btn-tiny btn-ghost" onClick={onClose}>
            ✕
          </button>
        </header>

        {events.length === 0 && (
          <p className="empty">Add an event first, then this voter can vote.</p>
        )}

        <ul className="ballot-list">
          {events.map((ev) => {
            const key = `${voter.id}:${ev.id}`;
            const choice = choices[key];
            return (
              <li key={ev.id.toString()} className="ballot-row">
                <div className="ballot-text">
                  <span className="badge">#{ev.id.toString()}</span>
                  {ev.description}
                </div>
                <div className="choice-group">
                  <button
                    className={`btn btn-choice ${
                      choice === 1 ? "choice-yes-active" : ""
                    }`}
                    onClick={() => setChoice(key, 1)}
                  >
                    YES
                  </button>
                  <button
                    className={`btn btn-choice ${
                      choice === 0 ? "choice-no-active" : ""
                    }`}
                    onClick={() => setChoice(key, 0)}
                  >
                    NO
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        <footer className="modal-foot">
          <button className="btn btn-primary" onClick={onClose}>
            Done
          </button>
        </footer>
      </div>
    </div>
  );
}
