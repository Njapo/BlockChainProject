import { poseidonHash } from "./poseidon";

// Value used for empty leaves and empty subtrees.
export const ZERO_LEAF = 0n;

// Precomputes the hash of an all-empty subtree at each level.
function computeZeros(depth) {
  const zeros = [ZERO_LEAF];
  for (let i = 0; i < depth; i++) {
    zeros.push(poseidonHash([zeros[i], zeros[i]]));
  }
  return zeros;
}

// Builds a fixed-depth Poseidon Merkle tree over the given leaves.
export function buildMerkleTree(leaves, depth) {
  const zeros = computeZeros(depth);
  const layers = [leaves.map((l) => BigInt(l))];
  for (let level = 0; level < depth; level++) {
    const current = layers[level];
    const next = [];
    for (let i = 0; i < current.length; i += 2) {
      const left = current[i];
      const right = i + 1 < current.length ? current[i + 1] : zeros[level];
      next.push(poseidonHash([left, right]));
    }
    if (next.length === 0) next.push(zeros[level + 1]);
    layers.push(next);
  }
  return { depth, zeros, layers, root: layers[depth][0] };
}

// Returns the authentication path for a leaf, matching the circuit's
// pathIndices convention (0 = leaf is the left child at that level).
export function getMerkleProof(tree, index) {
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
