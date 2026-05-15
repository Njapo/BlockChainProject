# Veil — Anonymous Private Voting on Ethereum

Veil is a zero-knowledge voting system. Eligible voters cast ballots that anyone
can verify as valid, while no one — not even the contract owner — can tell **who**
voted or **link a ballot back to a voter**. Double voting is cryptographically
impossible, and every tally is publicly auditable on-chain.

The cryptography (a Groth16 zkSNARK over a Poseidon Merkle tree) is built from
scratch with [Circom](https://docs.circom.io/) and
[snarkjs](https://github.com/iden3/snarkjs). The on-chain verifier and voting
logic run on the EVM.

## Privacy primitive

**Zero-Knowledge proofs (ZK).** A voter proves, in zero knowledge, that:

1. they own a secret whose commitment is a member of the registered-voter Merkle
   tree (eligibility), and
2. the nullifier they reveal is correctly derived from that secret and the
   proposal id (one-vote-per-voter),

without revealing the secret, the commitment, or which leaf they are.

## Status

Work in progress — see commit history for the incremental build.

## License

MIT
