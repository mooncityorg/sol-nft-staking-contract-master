# NFT_Staking
Multiple Factor Rewards Staking program for Shred NFT collections

## Install Dependencies
- Install `node` and `yarn`
- Install `ts-node` as global command
- Confirm the solana wallet preparation: `/home/fury/.config/solana/id.json` in test case

## Usage
- Main script source for all functionality is here: `/cli/scripts.ts`
- Program account types are declared here: `/cli/types.ts`
- Idl to make the JS binding easy is here: `/cli/shred_staking.json`

Able to test the script functions working in this way.
- Change commands properly in the main functions of the `scripts.ts` file to call the other functions
- Confirm the `ANCHOR_WALLET` environment variable of the `ts-node` script in `package.json`
- Run `yarn ts-node`

## Features

### As a Smart Contract Owner
For the first time use, the Smart Contract Owner should `initialize` the Smart Contract for global account allocation.
- `initProject`
 
Recall `initialize` function for update the Threshold values after change the constants properly
- `initProject` \

Maintain the Reward token($ART) vault's balance
- `REWARD_TOKEN_MINT` is the reward token mint (for test).
- `rewardVault` is the reward token account for owner. The owner should have the token's `Mint Authority` or should `Fund` regularly.

This is current test value. Should be revised properly.
- `EPOCH` = 60                                    // A day \
- `NORMAL_REWARD_AMOUNT` = 100_000 * 10           // 10 $WHEY \
- `LEGENDARY_REWARD_AMOUNT` = 100_000 * 25        // 25 $WHEY \
- `FACTOR` = 125                                  // 1.25x Reward for Bulk \

### As a NFT Holder
Stake Shred Collection NFTs with NFT `mint address` and a boolean parameter weather the NFT is Legendary NFT.
- `stakeNft`

### As a Staker
Unstake their staked NFTs with `mint address` and get rewards. ( Calculate generated reward by this NFT too )
- `withdrawNft`

Claim reward to receive generated $WHEY from their staking.
- `claimReward`
