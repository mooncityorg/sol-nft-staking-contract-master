import { Program, web3 } from '@project-serum/anchor';
import * as anchor from '@project-serum/anchor';
import {
    Keypair,
    PublicKey,
    SystemProgram,
    SYSVAR_RENT_PUBKEY,
    Transaction,
    TransactionInstruction,
    sendAndConfirmTransaction
} from '@solana/web3.js';
import { Token, TOKEN_PROGRAM_ID, AccountLayout, MintLayout, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";

import fs from 'fs';
import { GlobalPool, UserPool } from './types';

const USER_POOL_SIZE = 4164;     // 8 + 4156
const GLOBAL_AUTHORITY_SEED = "global-authority";

const REWARD_TOKEN_MINT = new PublicKey("5fTwKZP2AK39LtFN9Ayppu6hdCVKfMGVm79F2EgHCtsi");
const PROGRAM_ID = "5Q5FXSHTABC4URi6KUxT9auirRxo86GukRAYBK7Jweo4";

anchor.setProvider(anchor.Provider.local(web3.clusterApiUrl('mainnet-beta')));
const solConnection = anchor.getProvider().connection;
const payer = anchor.getProvider().wallet;

let rewardVault: PublicKey = null;
let program: Program = null;

// Configure the client to use the local cluster.
// const walletKeypair = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(path.resolve("/home/fury/.config/solana/id.json"), 'utf-8'))), { skipValidation: true });

const idl = JSON.parse(
    fs.readFileSync(__dirname + "/shred_staking.json", "utf8")
);

// Address of the deployed program.
const programId = new anchor.web3.PublicKey(PROGRAM_ID);

// Generate the program client from IDL.
program = new anchor.Program(idl, programId);
console.log('ProgramId: ', program.programId.toBase58());
const DECIMALS = 1_000_000;
const EPOCH = 1;                               // 86400 - 1 day
const FACTOR = 125;                             // X 1.25 Reward
const NORMAL_REWARD_AMOUNT = 119;      // 10 $WHEY
const LEGENDARY_REWARD_AMOUNT = 289;   // 25 $WHEY
const main = async () => {
    const [globalAuthority, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        program.programId
    );
    console.log('GlobalAuthority: ', globalAuthority.toBase58());

    rewardVault = await getAssociatedTokenAccount(globalAuthority, REWARD_TOKEN_MINT);
    console.log('RewardVault: ', rewardVault.toBase58());
    console.log(await solConnection.getTokenAccountBalance(rewardVault));

    // await initProject();

    const globalPool: GlobalPool = await getGlobalState();
    console.log("globalPool =", globalPool.superAdmin.toBase58(), globalPool.totalStakedCount.toNumber());

    // await initUserPool(payer.publicKey);

    // await stakeNft(payer.publicKey, new PublicKey('LzRJvRA9zWcFDk8KwMPkVeZ3zbm6mw4sEdNmkChh9Sn'), true);
    // await stakeNft(payer.publicKey, new PublicKey('FvVKssmkvAxTh1P9WLtoiCQExss4rpmt3ddqiap4eK3r'), false);
    // await withdrawNft(payer.publicKey, new PublicKey('FvVKssmkvAxTh1P9WLtoiCQExss4rpmt3ddqiap4eK3r'));
    // await withdrawNft(payer.publicKey, new PublicKey('LzRJvRA9zWcFDk8KwMPkVeZ3zbm6mw4sEdNmkChh9Sn'));
    // await claimReward(payer.publicKey);

    const stakedInfo = await getStakedNFTsFromWallet(new PublicKey('7eaQfTpHQGD6EnZNgLErkZy12NB7p5z3M8KHg3NyDBC9'));
    console.log(stakedInfo);
    /*const userPool: UserPool = await getUserPoolState(new PublicKey('9rDdTaSR8F4iDteLsLGmTVuVP3uw1wx5uXRs7LdWCqXQ'));
    console.log({
        // ...userPool,
        owner: userPool.owner.toBase58(),
        stakedMints: userPool.stakedMints.slice(0, userPool.stakedCount.toNumber()).map((info) => {
            return {
                // ...info,
                mint: info.mint.toBase58(),
                stakedTime: info.stakedTime.toNumber(),
                isLegendary: info.isLegendary,
            }
        }),
        stakedCount: userPool.stakedCount.toNumber(),
        remainingRewards: userPool.remainingRewards.toNumber(),
        lastRewardTime: (new Date(1000 * userPool.lastRewardTime.toNumber())).toLocaleString(),
    });*/
};

export const getStakedNFTsFromWallet = async (address: PublicKey) => {
    const [globalAuthority, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        program.programId
    );
    console.log('GlobalAuthority: ', globalAuthority.toBase58());

    const userPool: UserPool = await getUserPoolState(address);
    return {
        holder: globalAuthority.toBase58(),
        stakedCount: userPool.stakedCount.toNumber(),
        stakedMints: userPool.stakedMints.slice(0, userPool.stakedCount.toNumber()).map((info) => {
            return info.mint.toBase58();
        })
    }
};

export const initProject = async (
) => {
    const [globalAuthority, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        program.programId
    );
    const tx = await program.rpc.initialize(
        bump, {
        accounts: {
            admin: payer.publicKey,
            globalAuthority,
            rewardVault: rewardVault,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
        },
        signers: [],
    });
    await solConnection.confirmTransaction(tx, "confirmed");

    console.log("txHash =", tx);
    return false;
}

export const initUserPool = async (
    userAddress: PublicKey,
) => {
    let userPoolKey = await PublicKey.createWithSeed(
        userAddress,
        "user-pool",
        program.programId,
    );

    console.log(USER_POOL_SIZE);
    let ix = SystemProgram.createAccountWithSeed({
        fromPubkey: userAddress,
        basePubkey: userAddress,
        seed: "user-pool",
        newAccountPubkey: userPoolKey,
        lamports: await solConnection.getMinimumBalanceForRentExemption(USER_POOL_SIZE),
        space: USER_POOL_SIZE,
        programId: program.programId,
    });

    const tx = await program.rpc.initializeUserPool(
        {
            accounts: {
                userPool: userPoolKey,
                owner: userAddress
            },
            instructions: [
                ix
            ],
            signers: []
        }
    );
    await solConnection.confirmTransaction(tx, "confirmed");

    console.log("Your transaction signature", tx);
    let poolAccount = await program.account.userPool.fetch(userPoolKey);
    console.log('Owner of initialized pool = ', poolAccount.owner.toBase58());
}

export const stakeNft = async (userAddress: PublicKey, mint: PublicKey, isLegendary: boolean) => {
    let userTokenAccount = await getAssociatedTokenAccount(userAddress, mint);
    console.log("Shred NFT = ", mint.toBase58(), userTokenAccount.toBase58());

    const [globalAuthority, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        program.programId
    );

    let { instructions, destinationAccounts } = await getATokenAccountsNeedCreate(
        solConnection,
        userAddress,
        globalAuthority,
        [mint]
    );

    console.log("Dest NFT Account = ", destinationAccounts[0].toBase58())
    let userPoolKey = await PublicKey.createWithSeed(
        userAddress,
        "user-pool",
        program.programId,
    );

    let poolAccount = await solConnection.getAccountInfo(userPoolKey);
    if (poolAccount === null || poolAccount.data === null) {
        await initUserPool(userAddress);
    }

    const tx = await program.rpc.stakeNftToPool(
        bump, isLegendary, {
        accounts: {
            owner: userAddress,
            userPool: userPoolKey,
            globalAuthority,
            userTokenAccount,
            destNftTokenAccount: destinationAccounts[0],
            nftMint: mint,
            tokenProgram: TOKEN_PROGRAM_ID,
        },
        instructions: [
            ...instructions,
        ],
        signers: [],
    }
    );
    await solConnection.confirmTransaction(tx, "singleGossip");

}

export const withdrawNft = async (userAddress: PublicKey, mint: PublicKey) => {
    let userTokenAccount = await getAssociatedTokenAccount(userAddress, mint);
    console.log("Shred NFT = ", mint.toBase58(), userTokenAccount.toBase58());

    const [globalAuthority, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        program.programId
    );

    let { instructions, destinationAccounts } = await getATokenAccountsNeedCreate(
        solConnection,
        userAddress,
        globalAuthority,
        [mint]
    );

    console.log("Dest NFT Account = ", destinationAccounts[0].toBase58());

    let userPoolKey = await PublicKey.createWithSeed(
        userAddress,
        "user-pool",
        program.programId,
    );

    const tx = await program.rpc.withdrawNftFromPool(
        bump, {
        accounts: {
            owner: userAddress,
            userPool: userPoolKey,
            globalAuthority,
            userTokenAccount,
            destNftTokenAccount: destinationAccounts[0],
            nftMint: mint,
            tokenProgram: TOKEN_PROGRAM_ID,
        },
        instructions: [
        ],
        signers: [],
    }
    );
    await solConnection.confirmTransaction(tx, "singleGossip");
}

export const claimReward = async (userAddress: PublicKey) => {
    const [globalAuthority, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        program.programId
    );

    console.log("globalAuthority =", globalAuthority.toBase58());

    let userPoolKey = await PublicKey.createWithSeed(
        userAddress,
        "user-pool",
        program.programId,
    );

    let { instructions, destinationAccounts } = await getATokenAccountsNeedCreate(
        solConnection,
        userAddress,
        userAddress,
        [REWARD_TOKEN_MINT]
    );

    console.log("Dest NFT Account = ", destinationAccounts[0].toBase58());
    console.log(await solConnection.getTokenAccountBalance(destinationAccounts[0]));

    const tx = await program.rpc.claimReward(
        bump, {
        accounts: {
            owner: userAddress,
            userPool: userPoolKey,
            globalAuthority,
            rewardVault,
            userRewardAccount: destinationAccounts[0],
            tokenProgram: TOKEN_PROGRAM_ID,
        },
        instructions: [
            ...instructions,
        ],
        signers: []
    }
    );

    console.log("Your transaction signature", tx);
    await solConnection.confirmTransaction(tx, "singleGossip");

    console.log(await solConnection.getTokenAccountBalance(destinationAccounts[0]));
}

export const calculateAvailableReward = async (userAddress: PublicKey) => {
    const userPool: UserPool = await getUserPoolState(userAddress);
    const userPoolInfo = {
        // ...userPool,
        owner: userPool.owner.toBase58(),
        stakedMints: userPool.stakedMints.slice(0, userPool.stakedCount.toNumber()).map((info) => {
            return {
                // ...info,
                mint: info.mint.toBase58(),
                stakedTime: info.stakedTime.toNumber(),
                isLegendary: (new anchor.BN(info.isLegendary)).toNumber(),
            }
        }),
        stakedCount: userPool.stakedCount.toNumber(),
        remainingRewards: userPool.remainingRewards.toNumber(),
        lastRewardTime: (new Date(1000 * userPool.lastRewardTime.toNumber())).toLocaleString(),
    };
    console.log(userPoolInfo);

    let now = Math.floor(Date.now() / 1000);
    let totalReward = 0;
    console.log(`Now: ${now} Last_Reward_Time: ${userPool.lastRewardTime.toNumber()}`);
    for (let i = 0; i < userPoolInfo.stakedCount; i++) {
        let lastRewardTime = userPool.lastRewardTime.toNumber();
        if (lastRewardTime < userPoolInfo.stakedMints[i].stakedTime) {
            lastRewardTime = userPoolInfo.stakedMints[i].stakedTime;
        }

        let factor = 100;
        let rewardAmount = NORMAL_REWARD_AMOUNT;
        if (userPoolInfo.stakedMints[i].isLegendary == 1) {
            rewardAmount = LEGENDARY_REWARD_AMOUNT;
        }
        if (userPoolInfo.stakedCount > 2) {
            factor = FACTOR;
        }

        let reward = 0;
        reward = (Math.floor((now - lastRewardTime) / EPOCH)) * rewardAmount * factor / 100;

        totalReward += reward;
    }
    totalReward += userPoolInfo.remainingRewards;
    return totalReward / DECIMALS;
};

export const getGlobalState = async (
): Promise<GlobalPool | null> => {
    const [globalAuthority, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        program.programId
    );
    try {
        let globalState = await program.account.globalPool.fetch(globalAuthority);
        return globalState as GlobalPool;
    } catch {
        return null;
    }
}

export const getUserPoolState = async (
    userAddress: PublicKey
): Promise<UserPool | null> => {
    if (!userAddress) return null;

    let userPoolKey = await PublicKey.createWithSeed(
        userAddress,
        "user-pool",
        program.programId,
    );
    console.log('User Pool: ', userPoolKey.toBase58());
    try {
        let poolState = await program.account.userPool.fetch(userPoolKey);
        return poolState as UserPool;
    } catch {
        return null;
    }
}

const getAssociatedTokenAccount = async (ownerPubkey: PublicKey, mintPk: PublicKey): Promise<PublicKey> => {
    let associatedTokenAccountPubkey = (await PublicKey.findProgramAddress(
        [
            ownerPubkey.toBuffer(),
            TOKEN_PROGRAM_ID.toBuffer(),
            mintPk.toBuffer(), // mint address
        ],
        ASSOCIATED_TOKEN_PROGRAM_ID
    ))[0];
    return associatedTokenAccountPubkey;
}

export const getATokenAccountsNeedCreate = async (
    connection: anchor.web3.Connection,
    walletAddress: anchor.web3.PublicKey,
    owner: anchor.web3.PublicKey,
    nfts: anchor.web3.PublicKey[],
) => {
    let instructions = [], destinationAccounts = [];
    for (const mint of nfts) {
        const destinationPubkey = await getAssociatedTokenAccount(owner, mint);
        let response = await connection.getAccountInfo(destinationPubkey);
        if (!response) {
            const createATAIx = createAssociatedTokenAccountInstruction(
                destinationPubkey,
                walletAddress,
                owner,
                mint,
            );
            instructions.push(createATAIx);
        }
        destinationAccounts.push(destinationPubkey);
        if (walletAddress != owner) {
            const userAccount = await getAssociatedTokenAccount(walletAddress, mint);
            response = await connection.getAccountInfo(userAccount);
            if (!response) {
                const createATAIx = createAssociatedTokenAccountInstruction(
                    userAccount,
                    walletAddress,
                    walletAddress,
                    mint,
                );
                instructions.push(createATAIx);
            }
        }
    }
    return {
        instructions,
        destinationAccounts,
    };
}

export const createAssociatedTokenAccountInstruction = (
    associatedTokenAddress: anchor.web3.PublicKey,
    payer: anchor.web3.PublicKey,
    walletAddress: anchor.web3.PublicKey,
    splTokenMintAddress: anchor.web3.PublicKey
) => {
    const keys = [
        { pubkey: payer, isSigner: true, isWritable: true },
        { pubkey: associatedTokenAddress, isSigner: false, isWritable: true },
        { pubkey: walletAddress, isSigner: false, isWritable: false },
        { pubkey: splTokenMintAddress, isSigner: false, isWritable: false },
        {
            pubkey: anchor.web3.SystemProgram.programId,
            isSigner: false,
            isWritable: false,
        },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        {
            pubkey: anchor.web3.SYSVAR_RENT_PUBKEY,
            isSigner: false,
            isWritable: false,
        },
    ];
    return new anchor.web3.TransactionInstruction({
        keys,
        programId: ASSOCIATED_TOKEN_PROGRAM_ID,
        data: Buffer.from([]),
    });
}

main();