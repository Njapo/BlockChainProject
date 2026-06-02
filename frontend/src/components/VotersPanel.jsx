import React from "react";

// Counts how many events this voter has decided on.
function votedCount(voterId, events, choices) {
  return events.filter((ev) => choices[`${voterId}:${ev.id}`] !== undefined)
    .length;
}

export default function VotersPanel({
  voters,
  events,
  choices,
  addVoter,
  removeVoter,
  openVoter,
  locked,
}) {
  return (
    <section className="card">
      <header className="card-head">
        <h2>Voters</h2>
        <span className="count">{voters.length}</span>
      </header>
      <p className="card-hint">
        Each voter gets a secret identity (commitment) generated in your browser.
        Click a voter to cast their anonymous ballots.
      </p>

      {!locked && (
        <button className="btn btn-primary" onClick={addVoter}>
          + Add voter
        </button>
      )}

      <div className="voter-grid">
        {voters.length === 0 && <div className="empty">No voters yet.</div>}
        {voters.map((v) => {
          const done = votedCount(v.id, events, choices);
          const complete = events.length > 0 && done === events.length;
          return (
            <div
              key={v.id}
              className={`voter-chip ${complete ? "voter-done" : ""}`}
              onClick={() => openVoter(v.id)}
            >
              <div className="voter-num">#{v.id}</div>
              <div className="voter-meta">
                {events.length === 0
                  ? "no events"
                  : `${done}/${events.length} voted`}
              </div>
              {!locked && (
                <button
                  className="voter-x"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeVoter(v.id);
                  }}
                  title="Remove voter"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
