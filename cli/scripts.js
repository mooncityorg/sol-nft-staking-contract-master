"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAssociatedTokenAccountInstruction = exports.getATokenAccountsNeedCreate = exports.getUserPoolState = exports.getGlobalState = exports.calculateAvailableReward = exports.claimReward = exports.withdrawNft = exports.stakeNft = exports.initUserPool = exports.initProject = exports.getStakedNFTsFromWallet = void 0;
const anchor_1 = require("@project-serum/anchor");
const anchor = __importStar(require("@project-serum/anchor"));
const web3_js_1 = require("@solana/web3.js");
const spl_token_1 = require("@solana/spl-token");
const fs_1 = __importDefault(require("fs"));
const USER_POOL_SIZE = 4164; // 8 + 4156
const GLOBAL_AUTHORITY_SEED = "global-authority";
const REWARD_TOKEN_MINT = new web3_js_1.PublicKey("5fTwKZP2AK39LtFN9Ayppu6hdCVKfMGVm79F2EgHCtsi");
const PROGRAM_ID = "5Q5FXSHTABC4URi6KUxT9auirRxo86GukRAYBK7Jweo4";
anchor.setProvider(anchor.Provider.local(anchor_1.web3.clusterApiUrl('mainnet-beta')));
const solConnection = anchor.getProvider().connection;
const payer = anchor.getProvider().wallet;
let rewardVault = null;
let program = null;
// Configure the client to use the local cluster.
// const walletKeypair = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(path.resolve("/home/fury/.config/solana/id.json"), 'utf-8'))), { skipValidation: true });
const idl = JSON.parse(fs_1.default.readFileSync(__dirname + "/shred_staking.json", "utf8"));
// Address of the deployed program.
const programId = new anchor.web3.PublicKey(PROGRAM_ID);
// Generate the program client from IDL.
program = new anchor.Program(idl, programId);
console.log('ProgramId: ', program.programId.toBase58());
const DECIMALS = 1000000;
const EPOCH = 1; // 86400 - 1 day
const FACTOR = 125; // X 1.25 Reward
const NORMAL_REWARD_AMOUNT = 119; // 10 $WHEY
const LEGENDARY_REWARD_AMOUNT = 289; // 25 $WHEY
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    const [globalAuthority, bump] = yield web3_js_1.PublicKey.findProgramAddress([Buffer.from(GLOBAL_AUTHORITY_SEED)], program.programId);
    console.log('GlobalAuthority: ', globalAuthority.toBase58());
    rewardVault = yield getAssociatedTokenAccount(globalAuthority, REWARD_TOKEN_MINT);
    console.log('RewardVault: ', rewardVault.toBase58());
    console.log(yield solConnection.getTokenAccountBalance(rewardVault));
    // await initProject();
    const globalPool = yield (0, exports.getGlobalState)();
    console.log("globalPool =", globalPool.superAdmin.toBase58(), globalPool.totalStakedCount.toNumber());
    // await initUserPool(payer.publicKey);
    // await stakeNft(payer.publicKey, new PublicKey('LzRJvRA9zWcFDk8KwMPkVeZ3zbm6mw4sEdNmkChh9Sn'), true);
    // await stakeNft(payer.publicKey, new PublicKey('FvVKssmkvAxTh1P9WLtoiCQExss4rpmt3ddqiap4eK3r'), false);
    // await withdrawNft(payer.publicKey, new PublicKey('FvVKssmkvAxTh1P9WLtoiCQExss4rpmt3ddqiap4eK3r'));
    // await withdrawNft(payer.publicKey, new PublicKey('LzRJvRA9zWcFDk8KwMPkVeZ3zbm6mw4sEdNmkChh9Sn'));
    // await claimReward(payer.publicKey);
    const stakedInfo = yield (0, exports.getStakedNFTsFromWallet)(new web3_js_1.PublicKey('9rDdTaSR8F4iDteLsLGmTVuVP3uw1wx5uXRs7LdWCqXQ'));
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
});
const getStakedNFTsFromWallet = (address) => __awaiter(void 0, void 0, void 0, function* () {
    const [globalAuthority, bump] = yield web3_js_1.PublicKey.findProgramAddress([Buffer.from(GLOBAL_AUTHORITY_SEED)], program.programId);
    console.log('GlobalAuthority: ', globalAuthority.toBase58());
    const userPool = yield (0, exports.getUserPoolState)(address);
    return {
        holder: globalAuthority.toBase58(),
        stakedCount: userPool.stakedCount.toNumber(),
        stakedMints: userPool.stakedMints.slice(0, userPool.stakedCount.toNumber()).map((info) => {
            return info.mint.toBase58();
        })
    };
});
exports.getStakedNFTsFromWallet = getStakedNFTsFromWallet;
const initProject = () => __awaiter(void 0, void 0, void 0, function* () {
    const [globalAuthority, bump] = yield web3_js_1.PublicKey.findProgramAddress([Buffer.from(GLOBAL_AUTHORITY_SEED)], program.programId);
    const tx = yield program.rpc.initialize(bump, {
        accounts: {
            admin: payer.publicKey,
            globalAuthority,
            rewardVault: rewardVault,
            systemProgram: web3_js_1.SystemProgram.programId,
            rent: web3_js_1.SYSVAR_RENT_PUBKEY,
        },
        signers: [],
    });
    yield solConnection.confirmTransaction(tx, "confirmed");
    console.log("txHash =", tx);
    return false;
});
exports.initProject = initProject;
const initUserPool = (userAddress) => __awaiter(void 0, void 0, void 0, function* () {
    let userPoolKey = yield web3_js_1.PublicKey.createWithSeed(userAddress, "user-pool", program.programId);
    console.log(USER_POOL_SIZE);
    let ix = web3_js_1.SystemProgram.createAccountWithSeed({
        fromPubkey: userAddress,
        basePubkey: userAddress,
        seed: "user-pool",
        newAccountPubkey: userPoolKey,
        lamports: yield solConnection.getMinimumBalanceForRentExemption(USER_POOL_SIZE),
        space: USER_POOL_SIZE,
        programId: program.programId,
    });
    const tx = yield program.rpc.initializeUserPool({
        accounts: {
            userPool: userPoolKey,
            owner: userAddress
        },
        instructions: [
            ix
        ],
        signers: []
    });
    yield solConnection.confirmTransaction(tx, "confirmed");
    console.log("Your transaction signature", tx);
    let poolAccount = yield program.account.userPool.fetch(userPoolKey);
    console.log('Owner of initialized pool = ', poolAccount.owner.toBase58());
});
exports.initUserPool = initUserPool;
const stakeNft = (userAddress, mint, isLegendary) => __awaiter(void 0, void 0, void 0, function* () {
    let userTokenAccount = yield getAssociatedTokenAccount(userAddress, mint);
    console.log("Shred NFT = ", mint.toBase58(), userTokenAccount.toBase58());
    const [globalAuthority, bump] = yield web3_js_1.PublicKey.findProgramAddress([Buffer.from(GLOBAL_AUTHORITY_SEED)], program.programId);
    let { instructions, destinationAccounts } = yield (0, exports.getATokenAccountsNeedCreate)(solConnection, userAddress, globalAuthority, [mint]);
    console.log("Dest NFT Account = ", destinationAccounts[0].toBase58());
    let userPoolKey = yield web3_js_1.PublicKey.createWithSeed(userAddress, "user-pool", program.programId);
    let poolAccount = yield solConnection.getAccountInfo(userPoolKey);
    if (poolAccount === null || poolAccount.data === null) {
        yield (0, exports.initUserPool)(userAddress);
    }
    const tx = yield program.rpc.stakeNftToPool(bump, isLegendary, {
        accounts: {
            owner: userAddress,
            userPool: userPoolKey,
            globalAuthority,
            userTokenAccount,
            destNftTokenAccount: destinationAccounts[0],
            nftMint: mint,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
        },
        instructions: [
            ...instructions,
        ],
        signers: [],
    });
    yield solConnection.confirmTransaction(tx, "singleGossip");
});
exports.stakeNft = stakeNft;
const withdrawNft = (userAddress, mint) => __awaiter(void 0, void 0, void 0, function* () {
    let userTokenAccount = yield getAssociatedTokenAccount(userAddress, mint);
    console.log("Shred NFT = ", mint.toBase58(), userTokenAccount.toBase58());
    const [globalAuthority, bump] = yield web3_js_1.PublicKey.findProgramAddress([Buffer.from(GLOBAL_AUTHORITY_SEED)], program.programId);
    let { instructions, destinationAccounts } = yield (0, exports.getATokenAccountsNeedCreate)(solConnection, userAddress, globalAuthority, [mint]);
    console.log("Dest NFT Account = ", destinationAccounts[0].toBase58());
    let userPoolKey = yield web3_js_1.PublicKey.createWithSeed(userAddress, "user-pool", program.programId);
    const tx = yield program.rpc.withdrawNftFromPool(bump, {
        accounts: {
            owner: userAddress,
            userPool: userPoolKey,
            globalAuthority,
            userTokenAccount,
            destNftTokenAccount: destinationAccounts[0],
            nftMint: mint,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
        },
        instructions: [],
        signers: [],
    });
    yield solConnection.confirmTransaction(tx, "singleGossip");
});
exports.withdrawNft = withdrawNft;
const claimReward = (userAddress) => __awaiter(void 0, void 0, void 0, function* () {
    const [globalAuthority, bump] = yield web3_js_1.PublicKey.findProgramAddress([Buffer.from(GLOBAL_AUTHORITY_SEED)], program.programId);
    console.log("globalAuthority =", globalAuthority.toBase58());
    let userPoolKey = yield web3_js_1.PublicKey.createWithSeed(userAddress, "user-pool", program.programId);
    let { instructions, destinationAccounts } = yield (0, exports.getATokenAccountsNeedCreate)(solConnection, userAddress, userAddress, [REWARD_TOKEN_MINT]);
    console.log("Dest NFT Account = ", destinationAccounts[0].toBase58());
    console.log(yield solConnection.getTokenAccountBalance(destinationAccounts[0]));
    const tx = yield program.rpc.claimReward(bump, {
        accounts: {
            owner: userAddress,
            userPool: userPoolKey,
            globalAuthority,
            rewardVault,
            userRewardAccount: destinationAccounts[0],
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
        },
        instructions: [
            ...instructions,
        ],
        signers: []
    });
    console.log("Your transaction signature", tx);
    yield solConnection.confirmTransaction(tx, "singleGossip");
    console.log(yield solConnection.getTokenAccountBalance(destinationAccounts[0]));
});
exports.claimReward = claimReward;
const calculateAvailableReward = (userAddress) => __awaiter(void 0, void 0, void 0, function* () {
    const userPool = yield (0, exports.getUserPoolState)(userAddress);
    const userPoolInfo = {
        // ...userPool,
        owner: userPool.owner.toBase58(),
        stakedMints: userPool.stakedMints.slice(0, userPool.stakedCount.toNumber()).map((info) => {
            return {
                // ...info,
                mint: info.mint.toBase58(),
                stakedTime: info.stakedTime.toNumber(),
                isLegendary: (new anchor.BN(info.isLegendary)).toNumber(),
            };
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
});
exports.calculateAvailableReward = calculateAvailableReward;
const getGlobalState = () => __awaiter(void 0, void 0, void 0, function* () {
    const [globalAuthority, bump] = yield web3_js_1.PublicKey.findProgramAddress([Buffer.from(GLOBAL_AUTHORITY_SEED)], program.programId);
    try {
        let globalState = yield program.account.globalPool.fetch(globalAuthority);
        return globalState;
    }
    catch (_a) {
        return null;
    }
});
exports.getGlobalState = getGlobalState;
const getUserPoolState = (userAddress) => __awaiter(void 0, void 0, void 0, function* () {
    if (!userAddress)
        return null;
    let userPoolKey = yield web3_js_1.PublicKey.createWithSeed(userAddress, "user-pool", program.programId);
    console.log('User Pool: ', userPoolKey.toBase58());
    try {
        let poolState = yield program.account.userPool.fetch(userPoolKey);
        return poolState;
    }
    catch (_b) {
        return null;
    }
});
exports.getUserPoolState = getUserPoolState;
const getAssociatedTokenAccount = (ownerPubkey, mintPk) => __awaiter(void 0, void 0, void 0, function* () {
    let associatedTokenAccountPubkey = (yield web3_js_1.PublicKey.findProgramAddress([
        ownerPubkey.toBuffer(),
        spl_token_1.TOKEN_PROGRAM_ID.toBuffer(),
        mintPk.toBuffer(), // mint address
    ], spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID))[0];
    return associatedTokenAccountPubkey;
});
const getATokenAccountsNeedCreate = (connection, walletAddress, owner, nfts) => __awaiter(void 0, void 0, void 0, function* () {
    let instructions = [], destinationAccounts = [];
    for (const mint of nfts) {
        const destinationPubkey = yield getAssociatedTokenAccount(owner, mint);
        let response = yield connection.getAccountInfo(destinationPubkey);
        if (!response) {
            const createATAIx = (0, exports.createAssociatedTokenAccountInstruction)(destinationPubkey, walletAddress, owner, mint);
            instructions.push(createATAIx);
        }
        destinationAccounts.push(destinationPubkey);
        if (walletAddress != owner) {
            const userAccount = yield getAssociatedTokenAccount(walletAddress, mint);
            response = yield connection.getAccountInfo(userAccount);
            if (!response) {
                const createATAIx = (0, exports.createAssociatedTokenAccountInstruction)(userAccount, walletAddress, walletAddress, mint);
                instructions.push(createATAIx);
            }
        }
    }
    return {
        instructions,
        destinationAccounts,
    };
});
exports.getATokenAccountsNeedCreate = getATokenAccountsNeedCreate;
const createAssociatedTokenAccountInstruction = (associatedTokenAddress, payer, walletAddress, splTokenMintAddress) => {
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
        { pubkey: spl_token_1.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        {
            pubkey: anchor.web3.SYSVAR_RENT_PUBKEY,
            isSigner: false,
            isWritable: false,
        },
    ];
    return new anchor.web3.TransactionInstruction({
        keys,
        programId: spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID,
        data: Buffer.from([]),
    });
};
exports.createAssociatedTokenAccountInstruction = createAssociatedTokenAccountInstruction;
main();
