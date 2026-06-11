// Persists the events (with their voters and choices) to the browser's
// localStorage so they survive refreshes and restarts. No server or database
// needed. BigInt values (event ids, voter secrets/commitments) are tagged so
// they round-trip through JSON correctly.

const KEY = "veil.events.v1";

function replacer(_key, value) {
  return typeof value === "bigint" ? { __bigint__: value.toString() } : value;
}

function reviver(_key, value) {
  if (value && typeof value === "object" && "__bigint__" in value) {
    return BigInt(value.__bigint__);
  }
  return value;
}

export function loadEvents() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw, reviver);
    if (!Array.isArray(parsed.events)) return null;
    return parsed; // { events, nextEventId, nextVoterId, colorCounter }
  } catch {
    return null;
  }
}

export function saveEvents(events, nextEventId, nextVoterId, colorCounter) {
  try {
    const payload = { events, nextEventId, nextVoterId, colorCounter };
    localStorage.setItem(KEY, JSON.stringify(payload, replacer));
  } catch {
    // storage full or unavailable; ignore (state stays in memory)
  }
}

export function clearEvents() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
