import { ethers } from "hardhat";

async function main() {
  const Sample = await ethers.getContractFactory("Sample");
  const sample = await Sample.deploy();
  await sample.deployed();
  console.log(`Sample deployed to: ${sample.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
