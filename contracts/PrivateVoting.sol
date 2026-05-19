// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IVerifier {
    function verifyProof(
        uint[2] calldata a,
        uint[2][2] calldata b,
        uint[2] calldata c,
        uint[4] calldata pubSignals
    ) external view returns (bool);
}

// Anonymous voting backed by a Groth16 verifier.
// A proposal fixes the Merkle root of eligible-voter commitments. Each ballot
// carries a ZK proof of eligibility and a nullifier that prevents double voting,
// without revealing which voter cast it.
contract PrivateVoting {
    IVerifier public immutable verifier;
    address public immutable owner;

    struct Proposal {
        uint256 merkleRoot;
        string description;
        uint256 yesVotes;
        uint256 noVotes;
        bool exists;
    }

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(uint256 => bool)) public nullifierUsed;

    event ProposalCreated(uint256 indexed proposalId, uint256 merkleRoot, string description);
    event VoteCast(uint256 indexed proposalId, uint256 nullifierHash, uint256 voteOption);

    error NotOwner();
    error ProposalAlreadyExists();
    error UnknownProposal();
    error AlreadyVoted();
    error InvalidVoteOption();
    error InvalidProof();

    constructor(address verifier_) {
        verifier = IVerifier(verifier_);
        owner = msg.sender;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    function createProposal(
        uint256 proposalId,
        uint256 merkleRoot,
        string calldata description
    ) external onlyOwner {
        if (proposals[proposalId].exists) revert ProposalAlreadyExists();
        proposals[proposalId] = Proposal({
            merkleRoot: merkleRoot,
            description: description,
            yesVotes: 0,
            noVotes: 0,
            exists: true
        });
        emit ProposalCreated(proposalId, merkleRoot, description);
    }

    function vote(
        uint256 proposalId,
        uint256 nullifierHash,
        uint256 voteOption,
        uint[2] calldata a,
        uint[2][2] calldata b,
        uint[2] calldata c
    ) external {
        Proposal storage p = proposals[proposalId];
        if (!p.exists) revert UnknownProposal();
        if (voteOption > 1) revert InvalidVoteOption();
        if (nullifierUsed[proposalId][nullifierHash]) revert AlreadyVoted();

        uint[4] memory pubSignals = [p.merkleRoot, nullifierHash, proposalId, voteOption];
        if (!verifier.verifyProof(a, b, c, pubSignals)) revert InvalidProof();

        nullifierUsed[proposalId][nullifierHash] = true;
        if (voteOption == 1) {
            p.yesVotes += 1;
        } else {
            p.noVotes += 1;
        }
        emit VoteCast(proposalId, nullifierHash, voteOption);
    }

    function getResults(uint256 proposalId)
        external
        view
        returns (uint256 yesVotes, uint256 noVotes)
    {
        Proposal storage p = proposals[proposalId];
        if (!p.exists) revert UnknownProposal();
        return (p.yesVotes, p.noVotes);
    }
}
