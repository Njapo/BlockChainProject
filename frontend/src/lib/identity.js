import { poseidonHash } from "./poseidon";

// bn128 scalar field modulus (must match the backend lib).
export const FIELD_SIZE =
  21888242871839275222246405745257275088548364400416034343698204186575808495617n;

// Uniform random element of the scalar field, using the browser CSPRNG.
export function randomFieldElement() {
  const bytes = new Uint8Array(31);
  crypto.getRandomValues(bytes);
  let hex = "0x";
  for (const b of bytes) hex += b.toString(16).padStart(2, "0");
  return BigInt(hex) % FIELD_SIZE;
}

// Creates a voter identity. The commitment is the public Merkle-tree leaf;
// the secret stays in the browser and is never sent anywhere.
export function createIdentity(secret) {
  const s = secret === undefined ? randomFieldElement() : BigInt(secret);
  const commitment = poseidonHash([s]);
  return { secret: s, commitment };
}

// Nullifier is unique per (voter, proposal) and prevents double voting.
export function computeNullifierHash(secret, proposalId) {
  return poseidonHash([BigInt(secret), BigInt(proposalId)]);
}
