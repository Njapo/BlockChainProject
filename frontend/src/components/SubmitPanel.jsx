import React from "react";
import { txUrl, addressUrl } from "../lib/chain";
import { formatOptionLabel } from "../lib/eventTypes";

function shortHash(h) {
  return `${h.slice(0, 10)}…${h.slice(-6)}`;
}

export default function SubmitPanel({
  ready,
  progress,
  log,
  result,
  addresses,
  busy,
  onSubmit,
  reason,
  options,
  eventType,
  color,
}) {
  return (
    <section className="card card-submit">
      <header className="card-head">
        <h2>Go live on Sepolia</h2>
      </header>
      <p className="card-hint">
        When every voter in this event has voted, its contracts are deployed and
        all ballots are submitted as real transactions. Each step needs a
        MetaMask confirmation and spends a little Sepolia test ETH.
      </p>

      <div className="progress-wrap">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress.pct}%` }}
          />
        </div>
        <div className="progress-label">
          {progress.done}/{progress.total} voters decided
        </div>
      </div>

      <button
        className={`btn btn-lg ${result ? "btn-done" : "btn-primary"}`}
        disabled={!ready || busy || !!result}
        onClick={onSubmit}
      >
        {result
          ? "✓ Deployed & votes recorded on-chain"
          : busy
          ? "Submitting… confirm each step in MetaMask"
          : "Deploy & submit this event's votes"}
      </button>
      {!ready && !result && reason && (
        <div className="submit-reason">{reason}</div>
      )}

      {addresses && (
        <div className="addresses">
          <div className="addr-banner">✓ Contracts deployed on Sepolia</div>
          <div>
            <span className="addr-label">Voting contract (ballot box)</span>
            <a
              href={addressUrl(addresses.votingAddress)}
              target="_blank"
              rel="noreferrer"
            >
              {shortHash(addresses.votingAddress)}
            </a>
          </div>
          <div>
            <span className="addr-label">Verifier (proof checker)</span>
            <a
              href={addressUrl(addresses.verifierAddress)}
              target="_blank"
              rel="noreferrer"
            >
              {shortHash(addresses.verifierAddress)}
            </a>
          </div>
        </div>
      )}

      {log.length > 0 && (
        <div className="log">
          {log
            .filter((entry) => entry.hash || entry.kind === "err")
            .map((entry, i) => (
              <div key={i} className={`log-line log-${entry.kind}`}>
                <span className="log-dot" />
                <span className="log-msg">{entry.message}</span>
                {entry.hash && (
                  <a href={txUrl(entry.hash)} target="_blank" rel="noreferrer">
                    tx ↗
                  </a>
                )}
              </div>
            ))}
        </div>
      )}

      {result && (
        <div className="results">
          <h3>Final tally</h3>
          {(() => {
            const total = result.reduce((a, b) => a + b, 0) || 1;
            const max = Math.max(...result);
            return (options || []).map((label, i) => {
              const count = result[i] || 0;
              const pct = Math.round((count / total) * 100);
              const winner = count === max && max > 0;
              return (
                <div key={i} className="tally-row">
                  <div className="tally-head">
                    <span className="tally-label">
                      {formatOptionLabel(eventType, label)}
                      {winner && <span className="tally-win"> ★</span>}
                    </span>
                    <span className="tally-count">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="tally-bar">
                    <div
                      className="tally-fill"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                </div>
              );
            });
          })()}
        </div>
      )}
    </section>
  );
}
