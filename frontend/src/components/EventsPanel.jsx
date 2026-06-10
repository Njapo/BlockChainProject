import React from "react";
import NewEventModal from "./NewEventModal.jsx";
import { EVENT_TYPES } from "../lib/eventTypes";

export default function EventsPanel({
  events,
  addEvent,
  removeEvent,
  openEvent,
}) {
  const [showModal, setShowModal] = React.useState(false);

  function handleCreate(payload) {
    const err = addEvent(payload);
    if (err) return err;
    setShowModal(false);
    return null;
  }

  return (
    <section className="card">
      <header className="card-head">
        <h2>Events</h2>
        <span className="count">{events.length}</span>
      </header>
      <p className="card-hint">
        Each event becomes an on-chain proposal. Pick a type, add its options,
        then open it to add voters and cast anonymous ballots.
      </p>

      <button className="btn btn-primary" onClick={() => setShowModal(true)}>
        + Add event
      </button>

      <ul className="list events-list">
        {events.length === 0 && <li className="empty">No events yet.</li>}
        {events.map((ev) => {
          const decided = ev.voters.filter(
            (v) => ev.choices[v.id] !== undefined
          ).length;
          const complete =
            ev.voters.length > 0 && decided === ev.voters.length;
          const type = EVENT_TYPES[ev.type] || EVENT_TYPES.choice;
          return (
            <li
              key={ev.id.toString()}
              className={`list-item event-item ${
                complete ? "event-complete" : ""
              }`}
              onClick={() => openEvent(ev.id)}
              style={{ borderLeft: `4px solid ${ev.color}` }}
            >
              <span
                className="event-dot"
                style={{ background: ev.color }}
                title={type.name}
              >
                {type.icon}
              </span>
              <span className="list-text">{ev.description}</span>
              <span className="event-type-tag">{type.name}</span>
              <span className="event-meta">
                {ev.result
                  ? "on-chain ✓"
                  : ev.voters.length === 0
                  ? "no voters"
                  : `${decided}/${ev.voters.length} voted`}
              </span>
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
              <span className="event-arrow">›</span>
            </li>
          );
        })}
      </ul>

      {showModal && (
        <NewEventModal
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
          existingNames={events.map((e) => e.description)}
        />
      )}
    </section>
  );
}
