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

A full design and threat model is in [docs/WRITEUP.md](docs/WRITEUP.md).

## How it works

```
secret  --Poseidon-->  commitment  --(registrar)-->  Merkle root  --> on-chain proposal

vote:  ZK proof { I know a secret whose commitment is in the tree,
                  and nullifier = Poseidon(secret, proposalId) }
       + public (root, nullifierHash, proposalId, voteOption)
       -> Groth16Verifier -> tally += 1
```

What observers see on-chain: the proposal, the nullifier, and the chosen option —
but never which member voted.

## Requirements

- Node.js 18+
- [`circom`](https://docs.circom.io/getting-started/installation/) 2.x on `PATH`
  (only needed to rebuild the circuit)

## Setup

```bash
npm install
```

The compiled circuit, proving key, and generated verifier are committed under
`build/circuit/` and `contracts/Verifier.sol`, so you can run the demo without
rebuilding. To regenerate them from scratch (recompile + trusted setup):

```bash
npm run build:circuit
```

## Run the tests

```bash
npm test
```

Covers a valid ballot, double-vote rejection, vote-tampering rejection, and the
impossibility of a proof for a non-registered voter.

## Run the demo (live transactions)

In one terminal, start a local chain:

```bash
npx hardhat node
```

In a second terminal, run the demo:

```bash
npm run demo
```

It deploys the verifier and voting contract, registers five voters, opens a
proposal, casts three anonymous ballots (real transactions), shows that a repeat
vote is rejected, and prints the final tally.

You can also run it without a separate node on the in-process network:

```bash
npx hardhat run scripts/demo.js
```

## Project layout

```
circuits/
  vote.circom        main ballot circuit (eligibility + nullifier + bound vote)
  merkle.circom      Poseidon Merkle inclusion proof
contracts/
  PrivateVoting.sol  proposals, nullifier tracking, tallying
  Verifier.sol       generated Groth16 verifier
lib/
  poseidon.js        Poseidon hashing
  identity.js        secret / commitment / nullifier
  merkleTree.js      off-chain tree + authentication paths
  proof.js           snarkjs proving + Solidity calldata
  ballot.js          assembles a full ballot
scripts/
  build-circuit.sh   compile + trusted setup + export verifier
  deploy.js          deploy verifier + voting
  demo.js            end-to-end anonymous voting demo
test/
  voting.test.js     privacy and correctness tests
docs/
  WRITEUP.md         design and threat model
```

## License

MIT
