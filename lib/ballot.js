const { computeNullifierHash } = require("./identity");
const { getMerkleProof } = require("./merkleTree");
const { generateVoteProof, toSolidityCalldata } = require("./proof");

// Merkle tree depth; must match the value compiled into the circuit.
const TREE_DEPTH = 20;

// Assembles a full ballot: builds the witness, generates the ZK proof, and
// returns the values needed to call PrivateVoting.vote.
async function createBallot(tree, leafIndex, secret, proposalId, voteOption) {
  const merkle = getMerkleProof(tree, leafIndex);
  const nullifierHash = await computeNullifierHash(secret, proposalId);

  const input = {
    root: merkle.root,
    nullifierHash,
    proposalId: BigInt(proposalId),
    voteOption: BigInt(voteOption),
    secret: BigInt(secret),
    pathElements: merkle.pathElements,
    pathIndices: merkle.pathIndices,
  };

  const { proof, publicSignals } = await generateVoteProof(input);

  return {
    nullifierHash,
    voteOption: BigInt(voteOption),
    proof: toSolidityCalldata(proof),
    publicSignals,
  };
}

module.exports = { TREE_DEPTH, createBallot };
