const { buildPoseidon } = require("circomlibjs");

let instance = null;

// Lazily builds and caches a single Poseidon instance.
async function getPoseidon() {
  if (!instance) {
    instance = await buildPoseidon();
  }
  return instance;
}

// Poseidon hash of field-element inputs, returned as a BigInt.
async function poseidonHash(inputs) {
  const poseidon = await getPoseidon();
  const out = poseidon(inputs.map((x) => BigInt(x)));
  return poseidon.F.toObject(out);
}

module.exports = { getPoseidon, poseidonHash };
