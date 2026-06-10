import React from "react";
import SubmitPanel from "./SubmitPanel.jsx";
import VoteModal from "./VoteModal.jsx";
import { submitEventToBlockchain } from "../lib/submitFlow";
import { SEPOLIA_CHAIN_ID } from "../lib/chain";
import { EVENT_TYPES, formatOptionLabel } from "../lib/eventTypes";

// Full-page view for a single event: add named voters, have each pick one
// option, and deploy + submit this event's votes to Sepolia.
export default function EventPage({
  event,
  wallet,
  onBack,
  addVoter,
  removeVoter,
  setChoice,
  onComplete,
}) {
  const [name, setName] = React.useState("");
  const [nameError, setNameError] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [log, setLog] = React.useState(event.log || []);
  const [voteFor, setVoteFor] = React.useState(null); // voter id whose modal is open

  // Editing is locked once a run is in progress or this event is finished.
  const locked = busy || !!event.result;

  function submit(e) {
    e.preventDefault();
    const text = name.trim();
    if (!text) return;
    const err = addVoter(event.id, text);
    if (err) {
      setNameError(err);
      return;
    }
    setNameError("");
    setName("");
  }

  const decided = event.voters.filter(
    (v) => event.choices[v.id] !== undefined
  ).length;

  // ---- readiness for this event ----
  const onSepolia = wallet.chainId === SEPOLIA_CHAIN_ID;
  const allVoted = event.voters.length > 0 && decided === event.voters.length;
  const ready = allVoted && !!wallet.address && onSepolia && !locked;

  let reason = "";
  if (!wallet.address) reason = "Connect your wallet to continue.";
  else if (!onSepolia) reason = "Switch to the Sepolia network.";
  else if (event.voters.length === 0) reason = "Add at least one voter.";
  else if (!allVoted) reason = "Every voter must cast a ballot first.";

  const progress = {
    done: decided,
    total: event.voters.length,
    pct: event.voters.length
      ? Math.round((decided / event.voters.length) * 100)
      : 0,
  };

  async function onSubmit() {
    setBusy(true);
    setLog([]);
    const entries = [];
    const push = (entry) => {
      entries.push(entry);
      setLog([...entries]);
    };
    let addresses = null;
    try {
      const out = await submitEventToBlockchain({
        event,
        onStep: (s) => {
          if (s.type === "info") {
            push({ kind: "info", message: s.message });
          } else if (s.type === "deployed") {
            addresses = {
              verifierAddress: s.verifierAddress,
              votingAddress: s.votingAddress,
            };
            push({ kind: "ok", message: "Verifier deployed", hash: s.verifierTx });
            push({
              kind: "ok",
              message: "Voting contract deployed",
              hash: s.votingTx,
            });
          } else if (s.type === "proposal") {
            push({ kind: "ok", message: "Proposal opened", hash: s.hash });
          } else if (s.type === "ballot") {
            push({
              kind: "ok",
              message: `${s.voterName} voted "${s.optionLabel}"`,
              hash: s.hash,
            });
          } else if (s.type === "done") {
            push({ kind: "ok", message: "All ballots recorded on-chain ✓" });
            onComplete(event.id, {
              result: s.result,
              addresses,
              log: [...entries],
            });
          }
        },
      });
      // Safety net in case the done step did not fire.
      if (out && out.result) {
        onComplete(event.id, {
          result: out.result,
          addresses: {
            verifierAddress: out.verifierAddress,
            votingAddress: out.votingAddress,
          },
          log: [...entries],
        });
      }
    } catch (e) {
      push({ kind: "err", message: e.message || "Submission failed" });
    }
    setBusy(false);
  }

  return (
    <div className="event-page">
      <button className="btn btn-ghost btn-back" onClick={onBack}>
        ← Back to events
      </button>

      <section className="card">
        <header className="card-head">
          <div>
            <div className="event-kicker">
              <span className="badge">#{event.id.toString()}</span>
              {(EVENT_TYPES[event.type] || EVENT_TYPES.choice).name}
            </div>
            <h2 className="event-title">{event.description}</h2>
          </div>
          <span className="count">
            {decided}/{event.voters.length} voted
          </span>
        </header>
        <p className="card-hint">
          Add the people allowed to vote on this event. Each voter gets a secret
          identity generated in your browser, then picks one option below.
        </p>

        {!locked && (
          <form className="row" onSubmit={submit}>
            <input
              className="input"
              placeholder="Voter name, e.g. Alice"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button className="btn btn-primary" type="submit">
              Add voter
            </button>
          </form>
        )}
        {nameError && <div className="form-error">{nameError}</div>}

        <ul className="ballot-list">
          {event.voters.length === 0 && (
            <li className="empty">No voters yet. Add one above.</li>
          )}
          {event.voters.map((v) => {
            const choice = event.choices[v.id];
            const hasVoted = choice !== undefined;
            return (
              <li key={v.id} className="ballot-row">
                <div className="ballot-text">
                  <span className="voter-avatar">
                    {v.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="voter-name">{v.name}</span>
                </div>
                <div className="choice-group">
                  {hasVoted ? (
                    <>
                      <span
                        className="voted-tag"
                        style={{ color: event.color }}
                      >
                        ✓ Voted
                      </span>
                      {!locked && (
                        <button
                          className="btn btn-tiny btn-ghost"
                          onClick={() => setVoteFor(v.id)}
                        >
                          Change vote
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      className="btn btn-primary btn-tiny"
                      onClick={() => setVoteFor(v.id)}
                      disabled={locked}
                    >
                      Vote
                    </button>
                  )}
                  {!locked && (
                    <button
                      className="btn btn-tiny btn-ghost"
                      onClick={() => removeVoter(event.id, v.id)}
                      title="Remove voter"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <SubmitPanel
        ready={ready}
        reason={reason}
        progress={progress}
        log={log}
        result={event.result || null}
        addresses={event.addresses || null}
        busy={busy}
        onSubmit={onSubmit}
        options={event.options}
        eventType={event.type}
        color={event.color}
      />

      {voteFor !== null && (
        <VoteModal
          voter={event.voters.find((v) => v.id === voteFor)}
          event={event}
          onConfirm={(optionIdx) => {
            setChoice(event.id, voteFor, optionIdx);
            setVoteFor(null);
          }}
          onClose={() => setVoteFor(null)}
        />
      )}
    </div>
  );
}
