pragma circom 2.1.6;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/switcher.circom";

// Proves that `leaf` is included in a Poseidon Merkle tree and outputs the root.
// pathIndices[i] = 0 means the running hash is the left child at level i.
template MerkleProof(levels) {
    signal input leaf;
    signal input pathElements[levels];
    signal input pathIndices[levels];
    signal output root;

    component switchers[levels];
    component hashers[levels];

    signal levelHash[levels + 1];
    levelHash[0] <== leaf;

    for (var i = 0; i < levels; i++) {
        pathIndices[i] * (1 - pathIndices[i]) === 0;

        switchers[i] = Switcher();
        switchers[i].sel <== pathIndices[i];
        switchers[i].L <== levelHash[i];
        switchers[i].R <== pathElements[i];

        hashers[i] = Poseidon(2);
        hashers[i].inputs[0] <== switchers[i].outL;
        hashers[i].inputs[1] <== switchers[i].outR;

        levelHash[i + 1] <== hashers[i].out;
    }

    root <== levelHash[levels];
}
