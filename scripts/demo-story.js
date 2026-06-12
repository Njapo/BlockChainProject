const { deployContracts } = require("./deploy");
const { createIdentity } = require("../lib/identity");
const { buildMerkleTree } = require("../lib/merkleTree");
const { createBallot, TREE_DEPTH } = require("../lib/ballot");
const hre = require("hardhat");

// A storytelling end-to-end demo. Prints each step in plain language:
//   event created -> voters added -> votes cast -> a double-vote attempt fails
//   -> a non-member attempt fails -> final tally -> a transactions table.
// Run locally (free):       npx hardhat run scripts/demo-story.js
// Run on Sepolia (links):   npm run story:sepolia

const PROPOSAL_ID = 7n;
const DESCRIPTION = "Choose our community mascot";
const OPTIONS = ["Lion", "Eagle"];

const EXPLORERS = { sepolia: "https://sepolia.etherscan.io" };
const explorer = () => EXPLORERS[hre.network.name] || null;

const txs = []; // collected for the table at the end
function record(step, hash) {
  txs.push({ step, hash });
}

function short(v) {
  const s = v.toString();
  return s.length > 16 ? `${s.slice(0, 10)}…${s.slice(-6)}` : s;
}

function line(char = "─", n = 64) {
  console.log(char.repeat(n));
}

function submit(voting, ballot, option) {
  return voting.vote(
    PROPOSAL_ID,
    ballot.nullifierHash,
    option,
    ballot.proof.a,
    ballot.proof.b,
    ballot.proof.c
  );
}

async function main() {
  console.log("");
  line("═");
  console.log("  VEIL — anonymous private voting — live walk-through");
  line("═");
  console.log(`  Network: ${hre.network.name}` + (explorer() ? "  (real Sepolia transactions)" : "  (local test chain)"));
  console.log("");

  // 1) Deploy the two contracts
  console.log("▶ Step 1 — Deploying the contracts…");
  const { verifier, voting } = await deployContracts();
  const verifierAddr = await verifier.getAddress();
  const votingAddr = await voting.getAddress();
  record("Verifier deployed", verifier.deploymentTransaction()?.hash);
  record("Voting contract deployed", voting.deploymentTransaction()?.hash);
  console.log(`  ✓ Verifier (proof checker) : ${verifierAddr}`);
  console.log(`  ✓ Voting contract (ballot box): ${votingAddr}`);
  console.log("");

  // 2) Register voters (off-chain) and build the Merkle tree
  console.log("▶ Step 2 — Registering eligible voters (off-chain)…");
  const names = ["Alice", "Bob", "Tom", "Charles"];
  const voters = [];
  for (const name of names) {
    voters.push({ name, ...(await createIdentity()) });
    console.log(`  + added voter: ${name}`);
  }
  const tree = await buildMerkleTree(voters.map((v) => v.commitment), TREE_DEPTH);
  console.log(`  ✓ Built member list (Merkle root): ${short(tree.root)}`);
  console.log("");

  // 3) Open the proposal / event
  console.log("▶ Step 3 — Opening the event on-chain…");
  const propTx = await voting.createProposal(PROPOSAL_ID, tree.root, DESCRIPTION, OPTIONS);
  const propRcpt = await propTx.wait();
  record("Proposal opened", propRcpt.hash);
  console.log(`  ✓ Event "${DESCRIPTION}"  options: ${OPTIONS.join(" / ")}`);
  console.log("");

  // 4) Cast anonymous ballots
  console.log("▶ Step 4 — Voters cast anonymous ballots…");
  const choices = [
    [0, 0n], // Alice -> Lion
    [1, 0n], // Bob   -> Lion
    [2, 1n], // Tom   -> Eagle
    [3, 0n], // Charles -> Lion
  ];
  for (const [index, option] of choices) {
    const voter = voters[index];
    const ballot = await createBallot(tree, index, voter.secret, PROPOSAL_ID, option);
    const rcpt = await (await submit(voting, ballot, option)).wait();
    record(`${voter.name} voted "${OPTIONS[Number(option)]}"`, rcpt.hash);
    console.log(`  ✓ ${voter.name} voted "${OPTIONS[Number(option)]}"  (nullifier ${short(ballot.nullifierHash)})`);
  }
  console.log("    observers see the choice — never which member voted");
  console.log("");

  // 5) Attempt a double vote — must fail
  console.log("▶ Step 5 — Alice tries to vote a SECOND time…");
  const replay = await createBallot(tree, 0, voters[0].secret, PROPOSAL_ID, 1n);
  try {
    await (await submit(voting, replay, 1n)).wait();
    console.log("  ✗ UNEXPECTED: double vote was accepted!");
  } catch (_) {
    console.log("  ✓ REJECTED — her nullifier is already used (no double voting)");
  }
  console.log("");

  // 6) Attempt a vote from a non-member — must fail
  console.log("▶ Step 6 — Mallory (NOT on the list) tries to vote…");
  const outsider = await createIdentity();
  try {
    // The outsider is not in the tree, so proof generation itself fails.
    await createBallot(tree, 0, outsider.secret, PROPOSAL_ID, 0n);
    console.log("  ✗ UNEXPECTED: outsider produced a valid proof!");
  } catch (_) {
    console.log("  ✓ REJECTED — she cannot build a valid proof (not in the member list)");
  }
  console.log("");

  // 7) Final tally
  const counts = await voting.getResults(PROPOSAL_ID);
  console.log("▶ Step 7 — Final tally (public & auditable):");
  OPTIONS.forEach((label, i) => {
    console.log(`     ${label.padEnd(8)} : ${counts[i]}`);
  });
  console.log("");

  // 8) Transactions table
  line("═");
  console.log("  TRANSACTIONS");
  line("═");
  const base = explorer();
  txs.forEach((t, i) => {
    const n = String(i + 1).padStart(2, " ");
    console.log(`  ${n}. ${t.step}`);
    if (t.hash) {
      console.log(`      ${base ? base + "/tx/" + t.hash : t.hash}`);
    }
  });
  line("═");
  if (!base) {
    console.log("  (local chain — run on Sepolia for clickable Etherscan links)");
  }
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
