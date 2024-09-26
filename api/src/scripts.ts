import { Program, web3 } from '@project-serum/anchor';
import * as anchor from '@project-serum/anchor';
import {
    PublicKey,
} from '@solana/web3.js';

import fs from 'fs';
import { UserPool } from './types';

const GLOBAL_AUTHORITY_SEED = "global-authority";

const PROGRAM_ID = "5Q5FXSHTABC4URi6KUxT9auirRxo86GukRAYBK7Jweo4";
console.log(process.env.ANCHOR_WALLET, 'wallet');
anchor.setProvider(anchor.Provider.local(web3.clusterApiUrl('mainnet-beta')));
let program: Program = null;

// Configure the client to use the local cluster.
const idl = JSON.parse(
    fs.readFileSync(__dirname + "/shred_staking.json", "utf8")
);

// Address of the deployed program.
const programId = new anchor.web3.PublicKey(PROGRAM_ID);

// Generate the program client from IDL.
program = new anchor.Program(idl, programId);
console.log('ProgramId: ', program.programId.toBase58());


export const getStakedNFTsFromWallet = async (address: string) => {
    const [globalAuthority, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        program.programId
    );
    console.log('GlobalAuthority: ', globalAuthority.toBase58());
    try {
        const userPool: UserPool = await getUserPoolState(new PublicKey(address));
        return {
            holder: globalAuthority.toBase58(),
            stakedCount: userPool.stakedCount.toNumber(),
            stakedMints: userPool.stakedMints.slice(0, userPool.stakedCount.toNumber()).map((info) => {
                return info.mint.toBase58();
            })
        }
    } catch (e) {
        console.log(e); 
        return undefined;
    }
};

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
