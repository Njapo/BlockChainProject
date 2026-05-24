const { ethers } = require("hardhat");

// Deploys the Groth16 verifier and the PrivateVoting contract bound to it.
async function deployContracts() {
  const Verifier = await ethers.getContractFactory("Groth16Verifier");
  const verifier = await Verifier.deploy();
  await verifier.waitForDeployment();

  const Voting = await ethers.getContractFactory("PrivateVoting");
  const voting = await Voting.deploy(await verifier.getAddress());
  await voting.waitForDeployment();

  return { verifier, voting };
}

async function main() {
  const { verifier, voting } = await deployContracts();
  console.log("Groth16Verifier:", await verifier.getAddress());
  console.log("PrivateVoting:  ", await voting.getAddress());
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { deployContracts };
