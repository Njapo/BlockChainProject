import React from "react";
import {
  connectWallet,
  switchToSepolia,
  hasWallet,
  SEPOLIA_CHAIN_ID,
} from "../lib/chain";

function shorten(addr) {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "";
}

export default function WalletBar({ wallet, setWallet }) {
  const [error, setError] = React.useState("");
  const onSepolia = wallet.chainId === SEPOLIA_CHAIN_ID;

  async function handleConnect() {
    setError("");
    try {
      const w = await connectWallet();
      setWallet(w);
    } catch (e) {
      setError(e.message || "Failed to connect");
    }
  }

  async function handleSwitch() {
    setError("");
    try {
      await switchToSepolia();
      const w = await connectWallet();
      setWallet(w);
    } catch (e) {
      setError(e.message || "Failed to switch network");
    }
  }

  return (
    <div className="walletbar">
      <div className="brand">
        <span className="logo">◆</span>
        <div>
          <div className="brand-title">Veil</div>
          <div className="brand-sub">Anonymous private voting · zkSNARK</div>
        </div>
      </div>

      <div className="wallet-actions">
        {!hasWallet() && (
          <span className="pill pill-warn">MetaMask not detected</span>
        )}

        {hasWallet() && !wallet.address && (
          <button className="btn btn-primary" onClick={handleConnect}>
            Connect wallet
          </button>
        )}

        {wallet.address && (
          <>
            <span className={`pill ${onSepolia ? "pill-ok" : "pill-warn"}`}>
              {onSepolia ? "Sepolia" : "Wrong network"}
            </span>
            {!onSepolia && (
              <button className="btn btn-ghost" onClick={handleSwitch}>
                Switch to Sepolia
              </button>
            )}
            <span className="pill pill-addr">{shorten(wallet.address)}</span>
          </>
        )}
      </div>

      {error && <div className="wallet-error">{error}</div>}
    </div>
  );
}
