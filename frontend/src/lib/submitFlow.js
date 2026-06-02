import { buildMerkleTree } from "./merkleTree";
import { createBallot, TREE_DEPTH } from "./ballot";
import { deployContracts, getVotingContract } from "./chain";

// Runs the on-chain flow for a SINGLE event. Each event is independent and
// deploys its own contracts:
//   1. deploy the verifier + voting contracts
//   2. build the event's voter Merkle tree (its electorate)
//   3. open a proposal with that root
//   4. generate a ZK proof and submit a ballot for every voter
//   5. read back the tally
//
// `onStep` receives { type, ... } progress events so the UI can render a log.
export async function submitEventToBlockchain({ event, onStep }) {
  const step = (payload) => onStep && onStep(payload);

  step({ type: "info", message: "Deploying verifier + voting contracts…" });
  const deployed = await deployContracts();
  step({
    type: "deployed",
    verifierAddress: deployed.verifierAddress,
    votingAddress: deployed.votingAddress,
    verifierTx: deployed.verifierTx,
    votingTx: deployed.votingTx,
  });

  const voting = await getVotingContract(deployed.votingAddress);

  // The event's voters form its Merkle tree (electorate).
  step({ type: "info", message: "Building Merkle tree of voters…" });
  const tree = buildMerkleTree(
    event.voters.map((v) => v.commitment),
    TREE_DEPTH
  );

  step({ type: "info", message: `Opening proposal "${event.description}"…` });
  const tx = await voting.createProposal(event.id, tree.root, event.description);
  const receipt = await tx.wait();
  step({ type: "proposal", eventId: event.id, hash: receipt.hash });

  // One ballot per voter in this event.
  for (let i = 0; i < event.voters.length; i++) {
    const voter = event.voters[i];
    const option = event.choices[voter.id];
    if (option === undefined) continue;

    step({
      type: "info",
      message: `${voter.name} proving ballot…`,
    });
    const ballot = await createBallot(tree, i, voter.secret, event.id, option);

    const voteTx = await voting.vote(
      event.id,
      ballot.nullifierHash,
      ballot.voteOption,
      ballot.proof.a,
      ballot.proof.b,
      ballot.proof.c
    );
    const voteReceipt = await voteTx.wait();
    step({
      type: "ballot",
      voterName: voter.name,
      option,
      hash: voteReceipt.hash,
    });
  }

  const [yes, no] = await voting.getResults(event.id);
  const result = { yes: Number(yes), no: Number(no) };
  step({ type: "done", result, votingAddress: deployed.votingAddress });

  return {
    result,
    verifierAddress: deployed.verifierAddress,
    votingAddress: deployed.votingAddress,
  };
}
