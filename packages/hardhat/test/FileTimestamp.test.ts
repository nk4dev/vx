import assert from 'node:assert/strict';
import { ethers } from 'hardhat';

describe('FileTimestamp', function () {
  async function deployFileTimestamp() {
    const FileTimestamp = await ethers.getContractFactory('FileTimestamp');
    const contract = await FileTimestamp.deploy();
    await contract.waitForDeployment();
    return contract;
  }

  it('sets and retrieves a timestamp for a file hash', async function () {
    const contract = await deployFileTimestamp();
    const hash = ethers.toBigInt(ethers.keccak256(ethers.toUtf8Bytes('hello-vx')));
    const timestamp = 1700000000n;

    await contract.setTimestamp(hash, timestamp);

    assert.equal(await contract.getTimestamp(hash), timestamp);
    assert.equal(await contract.hashToTimestamp(hash), timestamp);
  });

  it('reverts when setting a timestamp for an already registered hash', async function () {
    const contract = await deployFileTimestamp();
    const hash = 12345n;

    await contract.setTimestamp(hash, 1700000000n);

    await assert.rejects(
      async () => {
        await contract.setTimestamp(hash, 1700000001n);
      },
      /Timestamp already set/
    );
  });

  it('reverts when getting a timestamp for an unregistered hash', async function () {
    const contract = await deployFileTimestamp();

    await assert.rejects(
      async () => {
        await contract.getTimestamp(99999n);
      },
      /Timestamp not set/
    );
  });

  it('stores independent timestamps for distinct hashes', async function () {
    const contract = await deployFileTimestamp();
    const hashA = 1n;
    const hashB = 2n;

    await contract.setTimestamp(hashA, 100n);
    await contract.setTimestamp(hashB, 200n);

    assert.equal(await contract.getTimestamp(hashA), 100n);
    assert.equal(await contract.getTimestamp(hashB), 200n);
  });
});
