const crypto = require("crypto");
const { poseidonHash } = require("./poseidon");

// bn128 scalar field modulus.
const FIELD_SIZE =
  21888242871839275222246405745257275088548364400416034343698204186575808495617n;

// Uniform random element of the scalar field.
function randomFieldElement() {
  const bytes = crypto.randomBytes(31);
  return BigInt("0x" + bytes.toString("hex")) % FIELD_SIZE;
}

// Creates a voter identity. The commitment is the public Merkle-tree leaf;
// the secret must stay private.
async function createIdentity(secret) {
  const s = secret === undefined ? randomFieldElement() : BigInt(secret);
  const commitment = await poseidonHash([s]);
  return { secret: s, commitment };
}

// Nullifier is unique per (voter, proposal) and prevents double voting.
async function computeNullifierHash(secret, proposalId) {
  return poseidonHash([BigInt(secret), BigInt(proposalId)]);
}

module.exports = {
  FIELD_SIZE,
  randomFieldElement,
  createIdentity,
  computeNullifierHash,
};
