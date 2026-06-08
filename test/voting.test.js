const { expect } = require("chai");
const { ethers } = require("hardhat");
const { createIdentity } = require("../lib/identity");
const { buildMerkleTree } = require("../lib/merkleTree");
const { createBallot, TREE_DEPTH } = require("../lib/ballot");

function submit(voting, proposalId, ballot) {
  return voting.vote(
    proposalId,
    ballot.nullifierHash,
    ballot.voteOption,
    ballot.proof.a,
    ballot.proof.b,
    ballot.proof.c
  );
}

describe("PrivateVoting", function () {
  this.timeout(120000);

  let voting;
  let voters;
  let tree;
  const proposalId = 1n;

  before(async function () {
    const Verifier = await ethers.getContractFactory("Groth16Verifier");
    const verifier = await Verifier.deploy();

    const Voting = await ethers.getContractFactory("PrivateVoting");
    voting = await Voting.deploy(await verifier.getAddress());

    voters = [];
    for (let i = 0; i < 4; i++) voters.push(await createIdentity());
    tree = await buildMerkleTree(
      voters.map((v) => v.commitment),
      TREE_DEPTH
    );

    await voting.createProposal(proposalId, tree.root, "Increase community fund", [
      "No",
      "Yes",
    ]);
  });

  it("accepts a valid anonymous ballot and updates the tally", async function () {
    const ballot = await createBallot(tree, 0, voters[0].secret, proposalId, 1n);
    await submit(voting, proposalId, ballot);

    const counts = await voting.getResults(proposalId);
    expect(counts[1]).to.equal(1n); // option 1 (Yes)
    expect(counts[0]).to.equal(0n); // option 0 (No)
  });

  it("prevents a voter from voting twice via nullifier reuse", async function () {
    const ballot = await createBallot(tree, 1, voters[1].secret, proposalId, 0n);
    await submit(voting, proposalId, ballot);

    await expect(submit(voting, proposalId, ballot)).to.be.revertedWithCustomError(
      voting,
      "AlreadyVoted"
    );
  });

  it("rejects a ballot whose vote option was tampered with", async function () {
    const ballot = await createBallot(tree, 2, voters[2].secret, proposalId, 1n);
    const tampered = ballot.voteOption === 1n ? 0n : 1n;

    await expect(
      voting.vote(
        proposalId,
        ballot.nullifierHash,
        tampered,
        ballot.proof.a,
        ballot.proof.b,
        ballot.proof.c
      )
    ).to.be.revertedWithCustomError(voting, "InvalidProof");
  });

  it("cannot produce a valid proof for a non-registered voter", async function () {
    const outsider = await createIdentity();

    let failed = false;
    try {
      await createBallot(tree, 0, outsider.secret, proposalId, 1n);
    } catch (_) {
      failed = true;
    }
    expect(failed).to.equal(true);
  });

  it("supports multiple options and tallies each separately", async function () {
    const Verifier = await ethers.getContractFactory("Groth16Verifier");
    const verifier = await Verifier.deploy();
    const Voting = await ethers.getContractFactory("PrivateVoting");
    const multi = await Voting.deploy(await verifier.getAddress());

    const ev = [];
    for (let i = 0; i < 3; i++) ev.push(await createIdentity());
    const mtree = await buildMerkleTree(
      ev.map((v) => v.commitment),
      TREE_DEPTH
    );
    const pid = 7n;
    await multi.createProposal(pid, mtree.root, "Pick a color", [
      "Red",
      "Green",
      "Blue",
    ]);

    // votes: option 2, option 2, option 0
    for (const [idx, opt] of [
      [0, 2n],
      [1, 2n],
      [2, 0n],
    ]) {
      const b = await createBallot(mtree, idx, ev[idx].secret, pid, opt);
      await submit(multi, pid, b);
    }

    const counts = await multi.getResults(pid);
    expect(counts[0]).to.equal(1n);
    expect(counts[1]).to.equal(0n);
    expect(counts[2]).to.equal(2n);
  });
});
