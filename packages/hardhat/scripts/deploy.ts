import { ethers } from "hardhat";

async function main() {
  const Sample = await ethers.getContractFactory("Sample");
  const sample = await Sample.deploy("hello");
  await sample.waitForDeployment();
  console.log("Sample deployed to:", await sample.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
