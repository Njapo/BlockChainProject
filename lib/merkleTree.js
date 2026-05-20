const { poseidonHash } = require("./poseidon");

// Value used for empty leaves and empty subtrees.
const ZERO_LEAF = 0n;

// Precomputes the hash of an all-empty subtree at each level.
async function computeZeros(depth) {
  const zeros = [ZERO_LEAF];
  for (let i = 0; i < depth; i++) {
    zeros.push(await poseidonHash([zeros[i], zeros[i]]));
  }
  return zeros;
}

// Builds a fixed-depth Poseidon Merkle tree over the given leaves.
// Only the populated nodes are materialized; empty positions use the zero
// hashes, so a depth-20 tree over a handful of voters stays cheap.
async function buildMerkleTree(leaves, depth) {
  const zeros = await computeZeros(depth);
  const layers = [leaves.map((l) => BigInt(l))];
  for (let level = 0; level < depth; level++) {
    const current = layers[level];
    const next = [];
    for (let i = 0; i < current.length; i += 2) {
      const left = current[i];
      const right = i + 1 < current.length ? current[i + 1] : zeros[level];
      next.push(await poseidonHash([left, right]));
    }
    if (next.length === 0) next.push(zeros[level + 1]);
    layers.push(next);
  }
  return { depth, zeros, layers, root: layers[depth][0] };
}

// Returns the authentication path for a leaf, matching the circuit's
// pathIndices convention (0 = leaf is the left child at that level).
function getMerkleProof(tree, index) {
  const pathElements = [];
  const pathIndices = [];
  let idx = index;
  for (let level = 0; level < tree.depth; level++) {
    const current = tree.layers[level];
    const isRight = idx % 2;
    const siblingIndex = isRight ? idx - 1 : idx + 1;
    const sibling =
      siblingIndex < current.length ? current[siblingIndex] : tree.zeros[level];
    pathElements.push(sibling);
    pathIndices.push(isRight);
    idx = Math.floor(idx / 2);
  }
  return { root: tree.root, pathElements, pathIndices };
}

module.exports = { ZERO_LEAF, buildMerkleTree, getMerkleProof };
