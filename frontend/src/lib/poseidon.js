import { poseidon1, poseidon2 } from "poseidon-lite";

// Poseidon hashes that match the circomlib Poseidon used inside the circuit.
// poseidon1/poseidon2 correspond to Poseidon(1)/Poseidon(2) in vote.circom.
export function poseidonHash(inputs) {
  const args = inputs.map((x) => BigInt(x));
  if (args.length === 1) return poseidon1(args);
  if (args.length === 2) return poseidon2(args);
  throw new Error(`Unsupported Poseidon arity: ${args.length}`);
}
