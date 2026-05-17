pragma circom 2.1.6;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "./merkle.circom";

// Anonymous ballot proof.
//
// Private:
//   secret        - the voter's secret; its commitment is a leaf in the tree
//   pathElements  - Merkle authentication path
//   pathIndices   - Merkle path direction bits
//
// Public:
//   root          - registered-voter Merkle root
//   nullifierHash - Poseidon(secret, proposalId); prevents double voting
//   proposalId    - the proposal this ballot belongs to
//   voteOption    - 0 (no) or 1 (yes); bound to the proof so it cannot be altered
template Vote(levels) {
    signal input root;
    signal input nullifierHash;
    signal input proposalId;
    signal input voteOption;

    signal input secret;
    signal input pathElements[levels];
    signal input pathIndices[levels];

    // Leaf commitment derived from the secret.
    component commitmentHasher = Poseidon(1);
    commitmentHasher.inputs[0] <== secret;

    // Eligibility: the commitment is a member of the tree.
    component tree = MerkleProof(levels);
    tree.leaf <== commitmentHasher.out;
    for (var i = 0; i < levels; i++) {
        tree.pathElements[i] <== pathElements[i];
        tree.pathIndices[i] <== pathIndices[i];
    }
    root === tree.root;

    // One vote per voter per proposal.
    component nullifierHasher = Poseidon(2);
    nullifierHasher.inputs[0] <== secret;
    nullifierHasher.inputs[1] <== proposalId;
    nullifierHash === nullifierHasher.out;

    // Ballot value must be boolean; this also binds voteOption into the proof.
    voteOption * (voteOption - 1) === 0;
}

component main {public [root, nullifierHash, proposalId, voteOption]} = Vote(20);
