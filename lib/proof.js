const path = require("path");
const snarkjs = require("snarkjs");

const WASM_PATH = path.join(
  __dirname,
  "..",
  "build",
  "circuit",
  "vote_js",
  "vote.wasm"
);
const ZKEY_PATH = path.join(
  __dirname,
  "..",
  "build",
  "circuit",
  "vote_final.zkey"
);

// Generates a Groth16 proof for a ballot witness.
async function generateVoteProof(input) {
  return snarkjs.groth16.fullProve(input, WASM_PATH, ZKEY_PATH);
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

module.exports = { generateVoteProof, toSolidityCalldata };
