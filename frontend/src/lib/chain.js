import { BrowserProvider, Contract, ContractFactory } from "ethers";
import Verifier from "../contracts/Groth16Verifier.json";
import Voting from "../contracts/PrivateVoting.json";

export const SEPOLIA_CHAIN_ID = 11155111n;
export const SEPOLIA_HEX = "0xaa36a7";
export const EXPLORER = "https://sepolia.etherscan.io";

export function hasWallet() {
  return typeof window !== "undefined" && !!window.ethereum;
}

export function getProvider() {
  if (!hasWallet()) throw new Error("MetaMask not found");
  return new BrowserProvider(window.ethereum);
}

// Prompts the wallet to connect and returns the selected account address.
export async function connectWallet() {
  const provider = getProvider();
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  const network = await provider.getNetwork();
  return { address: await signer.getAddress(), chainId: network.chainId };
}

// Asks MetaMask to switch to the Sepolia testnet.
export async function switchToSepolia() {
  await window.ethereum.request({
    method: "wallet_switchEthereumChain",
    params: [{ chainId: SEPOLIA_HEX }],
  });
}

// Deploys the Groth16 verifier and the PrivateVoting contract bound to it.
export async function deployContracts() {
  const signer = await getProvider().getSigner();

  const verifierFactory = new ContractFactory(
    Verifier.abi,
    Verifier.bytecode,
    signer
  );
  const verifier = await verifierFactory.deploy();
  await verifier.waitForDeployment();
  const verifierAddress = await verifier.getAddress();

  const votingFactory = new ContractFactory(Voting.abi, Voting.bytecode, signer);
  const voting = await votingFactory.deploy(verifierAddress);
  await voting.waitForDeployment();
  const votingAddress = await voting.getAddress();

  return {
    verifierAddress,
    votingAddress,
    verifierTx: verifier.deploymentTransaction().hash,
    votingTx: voting.deploymentTransaction().hash,
  };
}

// Returns a PrivateVoting contract instance bound to the signer.
export async function getVotingContract(address) {
  const signer = await getProvider().getSigner();
  return new Contract(address, Voting.abi, signer);
}

export function txUrl(hash) {
  return `${EXPLORER}/tx/${hash}`;
}

export function addressUrl(address) {
  return `${EXPLORER}/address/${address}`;
}
