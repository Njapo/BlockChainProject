pragma circom 2.1.6;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/bitify.circom";
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
//   voteOption    - the chosen option index; range-checked to [0, 2^OPTION_BITS)
//                   and bound to the proof so it cannot be altered. The exact
//                   number of valid options per proposal is enforced on-chain.
template Vote(levels, optionBits) {
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

    // Ballot option must fit in optionBits bits (0 .. 2^optionBits - 1). This
    // range-checks voteOption and binds it into the proof. The contract further
    // restricts it to the proposal's actual option count.
    component optionBitsCheck = Num2Bits(optionBits);
    optionBitsCheck.in <== voteOption;
}

// 4 option bits => up to 16 options per proposal.
component main {public [root, nullifierHash, proposalId, voteOption]} = Vote(20, 4);
