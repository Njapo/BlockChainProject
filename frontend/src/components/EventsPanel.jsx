import React from "react";

export default function EventsPanel({
  events,
  addEvent,
  removeEvent,
  openEvent,
  locked,
}) {
  const [description, setDescription] = React.useState("");
  const [error, setError] = React.useState("");

  function submit(e) {
    e.preventDefault();
    const text = description.trim();
    if (!text) return;
    const err = addEvent(text);
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setDescription("");
  }

  return (
    <section className="card">
      <header className="card-head">
        <h2>Events</h2>
        <span className="count">{events.length}</span>
      </header>
      <p className="card-hint">
        Each event becomes an on-chain proposal. Click an event to add its
        voters and cast their anonymous ballots.
      </p>

      {!locked && (
        <form className="row" onSubmit={submit}>
          <input
            className="input"
            placeholder="e.g. Adopt the new treasury policy"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <button className="btn btn-primary" type="submit">
            Add event
          </button>
        </form>
      )}
      {error && <div className="form-error">{error}</div>}

      <ul className="list">
        {events.length === 0 && <li className="empty">No events yet.</li>}
        {events.map((ev) => {
          const decided = ev.voters.filter(
            (v) => ev.choices[v.id] !== undefined
          ).length;
          const complete =
            ev.voters.length > 0 && decided === ev.voters.length;
          return (
            <li
              key={ev.id.toString()}
              className={`list-item event-item ${
                complete ? "event-complete" : ""
              }`}
              onClick={() => openEvent(ev.id)}
            >
              <span className="badge">#{ev.id.toString()}</span>
              <span className="list-text">{ev.description}</span>
              <span className="event-meta">
                {ev.voters.length === 0
                  ? "no voters"
                  : `${decided}/${ev.voters.length} voted`}
              </span>
              {!locked && (
                <button
                  className="btn btn-tiny btn-ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeEvent(ev.id);
                  }}
                  title="Remove"
                >
                  ✕
                </button>
              )}
              <span className="event-arrow">›</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
