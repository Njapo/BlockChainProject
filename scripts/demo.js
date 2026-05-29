const { deployContracts } = require("./deploy");
const { createIdentity } = require("../lib/identity");
const { buildMerkleTree } = require("../lib/merkleTree");
const { createBallot, TREE_DEPTH } = require("../lib/ballot");
const hre = require("hardhat");

const PROPOSAL_ID = 42n;
const DESCRIPTION = "Adopt the new community treasury policy";

const EXPLORERS = {
  sepolia: "https://sepolia.etherscan.io",
};

function explorer() {
  return EXPLORERS[hre.network.name] || null;
}

function addressLink(address) {
  const base = explorer();
  return base ? `\n  view          : ${base}/address/${address}` : "";
}

function txLink(hash) {
  const base = explorer();
  return base ? `\n  view          : ${base}/tx/${hash}` : "";
}

function short(value) {
  const s = value.toString();
  return s.length > 14 ? `${s.slice(0, 8)}...${s.slice(-4)}` : s;
}

function submit(voting, ballot) {
  return voting.vote(
    PROPOSAL_ID,
    ballot.nullifierHash,
    ballot.voteOption,
    ballot.proof.a,
    ballot.proof.b,
    ballot.proof.c
  );
}

async function main() {
  console.log("== Veil: anonymous private voting ==\n");

  const { verifier, voting } = await deployContracts();
  const votingAddress = await voting.getAddress();
  console.log("Verifier      :", await verifier.getAddress());
  console.log("PrivateVoting :", votingAddress, addressLink(votingAddress), "\n");

  // Eligible voters are registered off-chain; only the Merkle root is published.
  const names = ["Alice", "Bob", "Carol", "Dave", "Erin"];
  const voters = [];
  for (const name of names) {
    voters.push({ name, ...(await createIdentity()) });
  }
  const tree = await buildMerkleTree(
    voters.map((v) => v.commitment),
    TREE_DEPTH
  );
  console.log(`Registered ${voters.length} eligible voters`);
  console.log("Published Merkle root:", short(tree.root), "\n");

  await (await voting.createProposal(PROPOSAL_ID, tree.root, DESCRIPTION)).wait();
  console.log(`Proposal #${PROPOSAL_ID}: ${DESCRIPTION}\n`);

  // Each ballot is a ZK proof of eligibility; the voter's identity stays hidden.
  const choices = [
    [0, 1n],
    [2, 1n],
    [3, 0n],
  ];
  for (const [index, option] of choices) {
    const voter = voters[index];
    const ballot = await createBallot(tree, index, voter.secret, PROPOSAL_ID, option);
    const receipt = await (await submit(voting, ballot)).wait();
    console.log(`${voter.name} casts a ballot (${option === 1n ? "YES" : "NO"})`);
    console.log(`  tx hash       : ${receipt.hash}${txLink(receipt.hash)}`);
    console.log(`  nullifier     : ${short(ballot.nullifierHash)}`);
    console.log(`  on-chain, observers learn the choice but not the voter\n`);
  }

  // A voter cannot vote twice: replaying the nullifier is rejected.
  const replay = await createBallot(tree, 0, voters[0].secret, PROPOSAL_ID, 0n);
  try {
    await submit(voting, replay);
    console.log("Double vote unexpectedly accepted\n");
  } catch (_) {
    console.log("Alice's second ballot was rejected (nullifier already used)\n");
  }

  const [yes, no] = await voting.getResults(PROPOSAL_ID);
  console.log("== Final tally ==");
  console.log(`YES: ${yes}    NO: ${no}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
