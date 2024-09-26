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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAssociatedTokenAccountInstruction = exports.getATokenAccountsNeedCreate = void 0;
const anchor = __importStar(require("@project-serum/anchor"));
const web3_js_1 = require("@solana/web3.js");
const spl_token_1 = require("@solana/spl-token");
const GLOBAL_AUTHORITY_SEED = "global-authority";
const REWARD_TOKEN_MINT = new web3_js_1.PublicKey("8EoML7gaBJsgJtepm25wq3GuUCqLYHBoqd3HP1JxtyBx");
const USER_POOL_SIZE = 41064; // 8 + 41056
describe('Shred_Staking', () => __awaiter(void 0, void 0, void 0, function* () {
    // Configure the client to use the local cluster.
    const provider = anchor.Provider.env();
    anchor.setProvider(provider);
    // const payer = provider.wallet;
    // console.log('Payer: ', payer.publicKey.toBase58());
    const program = anchor.workspace.ShredStaking;
    console.log('ProgramId: ', program.programId.toBase58());
    const superOwner = anchor.web3.Keypair.fromSecretKey(new Uint8Array([68, 144, 227, 93, 108, 210, 244, 244, 106, 95, 251, 125, 193, 185, 188, 236, 201, 187, 183, 80, 224, 74, 8, 27, 75, 2, 108, 171, 73, 78, 205, 222, 220, 219, 10, 217, 133, 198, 76, 32, 120, 199, 53, 79, 201, 57, 8, 189, 98, 235, 234, 122, 65, 49, 224, 170, 161, 209, 80, 107, 99, 67, 72, 152]));
    const user = anchor.web3.Keypair.fromSecretKey(new Uint8Array([68, 144, 227, 93, 108, 210, 244, 244, 106, 95, 251, 125, 193, 185, 188, 236, 201, 187, 183, 80, 224, 74, 8, 27, 75, 2, 108, 171, 73, 78, 205, 222, 220, 219, 10, 217, 133, 198, 76, 32, 120, 199, 53, 79, 201, 57, 8, 189, 98, 235, 234, 122, 65, 49, 224, 170, 161, 209, 80, 107, 99, 67, 72, 152]));
    const reward = anchor.web3.Keypair.fromSecretKey(new Uint8Array([154, 43, 74, 184, 192, 57, 192, 123, 59, 172, 107, 58, 107, 47, 129, 73, 187, 15, 160, 217, 13, 135, 47, 181, 246, 63, 94, 26, 245, 108, 183, 36, 107, 138, 196, 135, 102, 88, 153, 43, 141, 165, 202, 167, 48, 225, 231, 113, 123, 61, 176, 248, 90, 204, 240, 109, 165, 204, 141, 5, 100, 184, 81, 99]));
    console.log('Reward Token: ', reward.publicKey.toBase58());
    const rewardToken = new spl_token_1.Token(provider.connection, REWARD_TOKEN_MINT, spl_token_1.TOKEN_PROGRAM_ID, superOwner);
    const [globalAuthority, bump] = yield web3_js_1.PublicKey.findProgramAddress([Buffer.from(GLOBAL_AUTHORITY_SEED)], program.programId);
    console.log('GlobalAuthority: ', globalAuthority.toBase58());
    const rewardVault = yield getAssociatedTokenAccount(globalAuthority, REWARD_TOKEN_MINT);
    console.log('RewardVault: ', rewardVault.toBase58());
    let nft_token_mint = null;
    let userTokenAccount = null;
    let userRewardAccount = null;
    it('Is initialized!', () => __awaiter(void 0, void 0, void 0, function* () {
        // Add your test here.
        yield provider.connection.confirmTransaction(yield provider.connection.requestAirdrop(superOwner.publicKey, 1000000000), "confirmed");
        yield provider.connection.confirmTransaction(yield provider.connection.requestAirdrop(user.publicKey, 1000000000), "confirmed");
        console.log("super owner =", superOwner.publicKey.toBase58());
        console.log("user =", user.publicKey.toBase58());
        const [globalAuthority, bump] = yield web3_js_1.PublicKey.findProgramAddress([Buffer.from(GLOBAL_AUTHORITY_SEED)], program.programId);
        // Allocate memory for the account
        const balanceNeeded = yield spl_token_1.Token.getMinBalanceRentForExemptMint(provider.connection);
        const transaction = new anchor.web3.Transaction();
        transaction.add(anchor.web3.SystemProgram.createAccount({
            fromPubkey: superOwner.publicKey,
            newAccountPubkey: REWARD_TOKEN_MINT,
            lamports: balanceNeeded,
            space: spl_token_1.MintLayout.span,
            programId: spl_token_1.TOKEN_PROGRAM_ID,
        }));
        transaction.add(spl_token_1.Token.createInitMintInstruction(spl_token_1.TOKEN_PROGRAM_ID, REWARD_TOKEN_MINT, 9, superOwner.publicKey, superOwner.publicKey));
        transaction.add(spl_token_1.Token.createAssociatedTokenAccountInstruction(spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID, spl_token_1.TOKEN_PROGRAM_ID, REWARD_TOKEN_MINT, rewardVault, globalAuthority, superOwner.publicKey));
        const txId = yield provider.send(transaction, [reward]);
        yield provider.connection.confirmTransaction(txId);
        yield rewardToken.mintTo(rewardVault, superOwner, [], 10000000000);
        console.log(yield provider.connection.getTokenAccountBalance(rewardVault));
        const tx = yield program.rpc.initialize(bump, {
            accounts: {
                admin: superOwner.publicKey,
                globalAuthority,
                rewardVault: rewardVault,
                systemProgram: web3_js_1.SystemProgram.programId,
                rent: web3_js_1.SYSVAR_RENT_PUBKEY,
            },
            signers: [superOwner],
        });
        console.log("Your transaction signature", tx);
        let globalPool = yield program.account.globalPool.fetch(globalAuthority);
        console.log("globalPool =", globalPool);
    }));
    it('Initialize user pool', () => __awaiter(void 0, void 0, void 0, function* () {
        let userPoolKey = yield web3_js_1.PublicKey.createWithSeed(user.publicKey, "user-pool", program.programId);
        console.log(USER_POOL_SIZE);
        let ix = web3_js_1.SystemProgram.createAccountWithSeed({
            fromPubkey: user.publicKey,
            basePubkey: user.publicKey,
            seed: "user-pool",
            newAccountPubkey: userPoolKey,
            lamports: yield provider.connection.getMinimumBalanceForRentExemption(USER_POOL_SIZE),
            space: USER_POOL_SIZE,
            programId: program.programId,
        });
        const tx = yield program.rpc.initializeUserPool({
            accounts: {
                userPool: userPoolKey,
                owner: user.publicKey
            },
            instructions: [
                ix
            ],
            signers: [user]
        });
        console.log("Your transaction signature", tx);
        let poolAccount = yield program.account.userPool.fetch(userPoolKey);
        console.log('Owner of initialized pool = ', poolAccount.owner.toBase58());
    }));
    it('Stake NFT to user pool', () => __awaiter(void 0, void 0, void 0, function* () {
        // Mint one Shred NFT for user
        nft_token_mint = yield spl_token_1.Token.createMint(provider.connection, user, superOwner.publicKey, null, 0, spl_token_1.TOKEN_PROGRAM_ID);
        userTokenAccount = yield nft_token_mint.createAccount(user.publicKey);
        yield nft_token_mint.mintTo(userTokenAccount, superOwner, [], 1);
        console.log("Shred NFT = ", nft_token_mint.publicKey.toBase58(), userTokenAccount.toBase58());
        let { instructions, destinationAccounts } = yield (0, exports.getATokenAccountsNeedCreate)(provider.connection, user.publicKey, globalAuthority, [nft_token_mint.publicKey]);
        console.log("Dest NFT Account = ", destinationAccounts[0].toBase58());
        let userPoolKey = yield web3_js_1.PublicKey.createWithSeed(user.publicKey, "user-pool", program.programId);
        const tx = yield program.rpc.stakeNftToPool(bump, 1, {
            accounts: {
                owner: user.publicKey,
                userPool: userPoolKey,
                globalAuthority,
                userTokenAccount,
                destNftTokenAccount: destinationAccounts[0],
                nftMint: nft_token_mint.publicKey,
                tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            },
            instructions: [
                ...instructions,
            ],
            signers: [user],
        });
        yield provider.connection.confirmTransaction(tx, "singleGossip");
        let poolAccount = yield program.account.userPool.fetch(userPoolKey);
        console.log('Owner of initialized pool = ', poolAccount.owner.toBase58());
        console.log(Object.assign(Object.assign({}, poolAccount), { stakedmints: poolAccount.stakedMints[0].mint.toBase58() }));
    }));
    it("Claim Reward", () => __awaiter(void 0, void 0, void 0, function* () {
        yield new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve(1);
            }, 61000);
        });
        const [globalAuthority, bump] = yield web3_js_1.PublicKey.findProgramAddress([Buffer.from(GLOBAL_AUTHORITY_SEED)], program.programId);
        console.log("globalAuthority =", globalAuthority.toBase58());
        let userPoolKey = yield web3_js_1.PublicKey.createWithSeed(user.publicKey, "user-pool", program.programId);
        userRewardAccount = yield rewardToken.createAccount(user.publicKey);
        const tx = yield program.rpc.claimReward(bump, {
            accounts: {
                owner: user.publicKey,
                userPool: userPoolKey,
                globalAuthority,
                rewardVault,
                userRewardAccount: userRewardAccount,
                tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            },
            signers: [user]
        });
        console.log("Your transaction signature", tx);
        yield provider.connection.confirmTransaction(tx, "singleGossip");
        console.log(yield provider.connection.getTokenAccountBalance(userRewardAccount));
        let poolAccount = yield program.account.userPool.fetch(userPoolKey);
        console.log('Owner of initialized pool = ', poolAccount.owner.toBase58());
        console.log(Object.assign(Object.assign({}, poolAccount), { stakedmints: poolAccount.stakedMints[0].mint.toBase58() }));
    }));
    it('Withdraw NFT from user pool', () => __awaiter(void 0, void 0, void 0, function* () {
        console.log("Shred NFT = ", nft_token_mint.publicKey.toBase58(), userTokenAccount.toBase58());
        let { instructions, destinationAccounts } = yield (0, exports.getATokenAccountsNeedCreate)(provider.connection, user.publicKey, globalAuthority, [nft_token_mint.publicKey]);
        console.log("Dest NFT Account = ", destinationAccounts[0].toBase58());
        // let ret = await getATokenAccountsNeedCreate(
        //   provider.connection,
        //   user.publicKey,
        //   user.publicKey,
        //   [REWARD_TOKEN_MINT]
        // );
        // userRewardAccount = ret.destinationAccounts[0];
        // console.log("User Reward Account = ", userRewardAccount.toBase58());
        let userPoolKey = yield web3_js_1.PublicKey.createWithSeed(user.publicKey, "user-pool", program.programId);
        const tx = yield program.rpc.withdrawNftFromPool(bump, {
            accounts: {
                owner: user.publicKey,
                userPool: userPoolKey,
                globalAuthority,
                userTokenAccount,
                destNftTokenAccount: destinationAccounts[0],
                // rewardVault,
                // userRewardAccount,
                nftMint: nft_token_mint.publicKey,
                tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
                // associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                // systemProgram: SystemProgram.programId,
                // rent: SYSVAR_RENT_PUBKEY,
            },
            instructions: [
            // ...ret.instructions,
            ],
            signers: [user],
        });
        yield provider.connection.confirmTransaction(tx, "singleGossip");
        console.log(yield provider.connection.getTokenAccountBalance(destinationAccounts[0]));
        let poolAccount = yield program.account.userPool.fetch(userPoolKey);
        console.log(Object.assign(Object.assign({}, poolAccount), { stakedMints: poolAccount.stakedMints[0].mint.toBase58() }));
    }));
}));
const getATokenAccountsNeedCreate = (connection, walletAddress, owner, nfts) => __awaiter(void 0, void 0, void 0, function* () {
    let instructions = [], destinationAccounts = [];
    for (const mint of nfts) {
        const destinationPubkey = yield getAssociatedTokenAccount(owner, mint);
        const response = yield connection.getAccountInfo(destinationPubkey);
        if (!response) {
            const createATAIx = (0, exports.createAssociatedTokenAccountInstruction)(destinationPubkey, walletAddress, owner, mint);
            instructions.push(createATAIx);
        }
        destinationAccounts.push(destinationPubkey);
    }
    return {
        instructions,
        destinationAccounts,
    };
});
exports.getATokenAccountsNeedCreate = getATokenAccountsNeedCreate;
const getAssociatedTokenAccount = (ownerPubkey, mintPk) => __awaiter(void 0, void 0, void 0, function* () {
    let associatedTokenAccountPubkey = (yield web3_js_1.PublicKey.findProgramAddress([
        ownerPubkey.toBuffer(),
        spl_token_1.TOKEN_PROGRAM_ID.toBuffer(),
        mintPk.toBuffer(), // mint address
    ], spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID))[0];
    return associatedTokenAccountPubkey;
});
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
