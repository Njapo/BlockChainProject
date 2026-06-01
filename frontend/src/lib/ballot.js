import { computeNullifierHash } from "./identity";
import { getMerkleProof } from "./merkleTree";

// Merkle tree depth; must match the value compiled into the circuit.
export const TREE_DEPTH = 20;

const WASM_URL = "/circuit/vote.wasm";
const ZKEY_URL = "/circuit/vote_final.zkey";

// Waits until the snarkjs UMD bundle (loaded in index.html) is ready.
function getSnarkjs() {
  if (typeof window !== "undefined" && window.snarkjs) return window.snarkjs;
  throw new Error("snarkjs is not loaded yet");
}

// Reshapes a snarkjs proof into the argument layout expected by the
// generated Solidity verifier (note the swapped G2 coordinate pairs).
function toSolidityCalldata(proof) {
  return {
    a: [proof.pi_a[0], proof.pi_a[1]],
    b: [
      [proof.pi_b[0][1], proof.pi_b[0][0]],
      [proof.pi_b[1][1], proof.pi_b[1][0]],
    ],
    c: [proof.pi_c[0], proof.pi_c[1]],
  };
}

// Assembles a full ballot: builds the witness, generates the ZK proof, and
// returns the values needed to call PrivateVoting.vote.
export async function createBallot(tree, leafIndex, secret, proposalId, voteOption) {
  const snarkjs = getSnarkjs();
  const merkle = getMerkleProof(tree, leafIndex);
  const nullifierHash = computeNullifierHash(secret, proposalId);

  const input = {
    root: merkle.root.toString(),
    nullifierHash: nullifierHash.toString(),
    proposalId: BigInt(proposalId).toString(),
    voteOption: BigInt(voteOption).toString(),
    secret: BigInt(secret).toString(),
    pathElements: merkle.pathElements.map((x) => x.toString()),
    pathIndices: merkle.pathIndices.map((x) => x.toString()),
  };

  const { proof } = await snarkjs.groth16.fullProve(input, WASM_URL, ZKEY_URL);

  return {
    nullifierHash,
    voteOption: BigInt(voteOption),
    proof: toSolidityCalldata(proof),
  };
}
