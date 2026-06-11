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

without revealing the secret, the commitment, or which leaf they are. The chosen
option is range-checked inside the circuit and bound to the proof, so a single
circuit supports any ballot from a simple Yes/No up to 16 named options.

A full design and threat model is in [docs/WRITEUP.md](docs/WRITEUP.md).

## Voting modes

Each proposal carries its own fixed list of named options, so the same anonymous
mechanism powers several kinds of events:

- **Yes / No** — a simple approve or reject vote.
- **Multiple choice** — pick one of several named candidates or proposals.
- **Pick a date** — choose between candidate dates.
- **Pick an amount** — choose between candidate amounts or budgets.

The option a voter picks is a small public index; their identity always stays
hidden.

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

Covers a valid ballot, double-vote rejection, vote-tampering rejection, the
impossibility of a proof for a non-registered voter, and a multi-option proposal
tallied per option.

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

## Web app

A React frontend in `frontend/` provides the full flow in the browser: create
events (choosing a type and its options), add named voters, cast each voter's
anonymous ballot, then deploy the contracts and submit all ballots to Sepolia.
Zero-knowledge proofs are generated in the browser with snarkjs, and events are
persisted in `localStorage` so they survive refreshes and restarts.

```bash
cd frontend
npm install
npm run dev
```

Open the printed URL in a browser with MetaMask connected to the Sepolia testnet.

## Project layout

```
circuits/
  vote.circom        main ballot circuit (eligibility + nullifier + bound vote)
  merkle.circom      Poseidon Merkle inclusion proof
contracts/
  PrivateVoting.sol  proposals, nullifier tracking, per-option tallying
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
frontend/
  src/               React app: events, voters, voting, on-chain submission
  public/circuit/    wasm + proving key served for in-browser proving
test/
  voting.test.js     privacy and correctness tests
docs/
  WRITEUP.md         design and threat model
```

## License

MIT
