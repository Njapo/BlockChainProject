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
// A proposal fixes the Merkle root of eligible-voter commitments and a fixed
// set of named options. Each ballot carries a ZK proof of eligibility and a
// nullifier that prevents double voting, without revealing which voter cast it.
contract PrivateVoting {
    IVerifier public immutable verifier;
    address public immutable owner;

    // Upper bound enforced by the circuit (voteOption fits in 4 bits => 0..15).
    uint256 public constant MAX_OPTIONS = 16;

    struct Proposal {
        uint256 merkleRoot;
        string description;
        string[] options;
        bool exists;
    }

    mapping(uint256 => Proposal) public proposals;
    // proposalId => optionIndex => vote count
    mapping(uint256 => mapping(uint256 => uint256)) public optionVotes;
    mapping(uint256 => mapping(uint256 => bool)) public nullifierUsed;

    event ProposalCreated(uint256 indexed proposalId, uint256 merkleRoot, string description, string[] options);
    event VoteCast(uint256 indexed proposalId, uint256 nullifierHash, uint256 voteOption);

    error NotOwner();
    error ProposalAlreadyExists();
    error UnknownProposal();
    error AlreadyVoted();
    error InvalidVoteOption();
    error InvalidProof();
    error BadOptionCount();

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
        string calldata description,
        string[] calldata options
    ) external onlyOwner {
        if (proposals[proposalId].exists) revert ProposalAlreadyExists();
        if (options.length < 2 || options.length > MAX_OPTIONS) revert BadOptionCount();

        Proposal storage p = proposals[proposalId];
        p.merkleRoot = merkleRoot;
        p.description = description;
        p.exists = true;
        for (uint256 i = 0; i < options.length; i++) {
            p.options.push(options[i]);
        }
        emit ProposalCreated(proposalId, merkleRoot, description, options);
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
        if (voteOption >= p.options.length) revert InvalidVoteOption();
        if (nullifierUsed[proposalId][nullifierHash]) revert AlreadyVoted();

        uint[4] memory pubSignals = [p.merkleRoot, nullifierHash, proposalId, voteOption];
        if (!verifier.verifyProof(a, b, c, pubSignals)) revert InvalidProof();

        nullifierUsed[proposalId][nullifierHash] = true;
        optionVotes[proposalId][voteOption] += 1;
        emit VoteCast(proposalId, nullifierHash, voteOption);
    }

    function getOptions(uint256 proposalId) external view returns (string[] memory) {
        Proposal storage p = proposals[proposalId];
        if (!p.exists) revert UnknownProposal();
        return p.options;
    }

    function getResults(uint256 proposalId)
        external
        view
        returns (uint256[] memory counts)
    {
        Proposal storage p = proposals[proposalId];
        if (!p.exists) revert UnknownProposal();
        counts = new uint256[](p.options.length);
        for (uint256 i = 0; i < p.options.length; i++) {
            counts[i] = optionVotes[proposalId][i];
        }
    }
}
