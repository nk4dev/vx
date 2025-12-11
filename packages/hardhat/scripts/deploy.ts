import { ethers } from 'hardhat';

const main = async () => {
  const fileTimestampContract = await ethers.deployContract('FileTimestamp');
  await fileTimestampContract.waitForDeployment();
  console.log('FileTimestamp deployed to:', fileTimestampContract.target);
};

const runMain = async () => {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

runMain();
