import React from "react";
import WalletBar from "./components/WalletBar.jsx";
import EventsPanel from "./components/EventsPanel.jsx";
import EventPage from "./components/EventPage.jsx";
import { createIdentity } from "./lib/identity";
import { loadEvents, saveEvents, clearEvents } from "./lib/storage";

export default function App() {
  const [wallet, setWallet] = React.useState({ address: "", chainId: null });

  // Load any previously saved events from localStorage on first render.
  const saved = React.useMemo(() => loadEvents(), []);

  // events: { id, description, voters: [{id,name,secret,commitment}],
  //           choices: { [voterId]: 0|1 }, result?, addresses? }
  const [events, setEvents] = React.useState(saved ? saved.events : []);
  const [openEventId, setOpenEventId] = React.useState(null);

  const nextEventId = React.useRef(saved ? saved.nextEventId : 1);
  const nextVoterId = React.useRef(saved ? saved.nextVoterId : 1);

  // Persist events whenever they change so nothing is lost on refresh/shutdown.
  React.useEffect(() => {
    saveEvents(events, nextEventId.current, nextVoterId.current);
  }, [events]);

  function resetAll() {
    if (!window.confirm("Delete all saved events and voters?")) return;
    clearEvents();
    setEvents([]);
    nextEventId.current = 1;
    nextVoterId.current = 1;
    setOpenEventId(null);
  }

  // ---- events ----
  // Returns an error message if rejected, or null on success.
  function addEvent(description) {
    const name = description.trim();
    const exists = events.some(
      (e) => e.description.trim().toLowerCase() === name.toLowerCase()
    );
    if (exists) return "An event with this name already exists.";
    const id = BigInt(nextEventId.current++);
    setEvents((prev) => [...prev, { id, description, voters: [], choices: {} }]);
    return null;
  }
  function removeEvent(id) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }
  function openEvent(id) {
    setOpenEventId(id);
  }

  // ---- voters (per event) ----
  // Returns an error message if rejected, or null on success.
  function addVoter(eventId, name) {
    const trimmed = name.trim();
    const event = events.find((e) => e.id === eventId);
    if (
      event &&
      event.voters.some(
        (v) => v.name.trim().toLowerCase() === trimmed.toLowerCase()
      )
    ) {
      return "A voter with this name already exists in this event.";
    }
    const id = nextVoterId.current++;
    const identity = createIdentity();
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? { ...e, voters: [...e.voters, { id, name, ...identity }] }
          : e
      )
    );
    return null;
  }
  function removeVoter(eventId, voterId) {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id !== eventId) return e;
        const choices = { ...e.choices };
        delete choices[voterId];
        return {
          ...e,
          voters: e.voters.filter((v) => v.id !== voterId),
          choices,
        };
      })
    );
  }

  // ---- choices (per event/voter) ----
  function setChoice(eventId, voterId, option) {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? { ...e, choices: { ...e.choices, [voterId]: option } }
          : e
      )
    );
  }

  // ---- on-chain completion (persist result + addresses on the event) ----
  function onComplete(eventId, { result, addresses }) {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId ? { ...e, result, addresses } : e
      )
    );
  }

  const openEventObj = events.find((e) => e.id === openEventId) || null;

  // ---- event detail page ----
  if (openEventObj) {
    return (
      <div className="app">
        <WalletBar wallet={wallet} setWallet={setWallet} />
        <EventPage
          event={openEventObj}
          wallet={wallet}
          onBack={() => setOpenEventId(null)}
          addVoter={addVoter}
          removeVoter={removeVoter}
          setChoice={setChoice}
          onComplete={onComplete}
        />
        <footer className="foot">
          Veil · Groth16 zkSNARK over a Poseidon Merkle tree · ballots are
          anonymous and unlinkable
        </footer>
      </div>
    );
  }

  // ---- home page ----
  return (
    <div className="app">
      <WalletBar wallet={wallet} setWallet={setWallet} />

      <main className="layout-single">
        <EventsPanel
          events={events}
          addEvent={addEvent}
          removeEvent={removeEvent}
          openEvent={openEvent}
          locked={false}
        />
        {events.length > 0 && (
          <button className="btn btn-ghost btn-reset" onClick={resetAll}>
            Reset all data
          </button>
        )}
      </main>

      <footer className="foot">
        Veil · Groth16 zkSNARK over a Poseidon Merkle tree · ballots are
        anonymous and unlinkable
      </footer>
    </div>
  );
}
