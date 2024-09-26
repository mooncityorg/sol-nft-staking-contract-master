use anchor_lang::{
    prelude::*,
    accounts::cpi_account::CpiAccount,
    solana_program::program_pack::Pack,
};
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Token, TokenAccount, Transfer }
};

pub mod account;
pub mod error;
pub mod constants;

use account::*;
use error::*;
use constants::*;

declare_id!("5Q5FXSHTABC4URi6KUxT9auirRxo86GukRAYBK7Jweo4");

#[program]
pub mod shred_staking {
    use super::*;
    pub fn initialize(
        ctx: Context<Initialize>,
        global_bump: u8,
    ) -> ProgramResult {
        let global_authority = &mut ctx.accounts.global_authority;
        global_authority.super_admin = ctx.accounts.admin.key();
        // Err(ProgramError::from(StakingError::InvalidSuperOwner))
        Ok(())
    }

    pub fn initialize_user_pool(
        ctx: Context<InitializeUserPool>
    ) -> ProgramResult {
        let mut user_pool = ctx.accounts.user_pool.load_init()?;
        user_pool.owner = ctx.accounts.owner.key();
        msg!("Owner: {:?}", user_pool.owner.to_string());
        // Err(ProgramError::from(StakingError::InvalidSuperOwner))
        Ok(())
    }

    #[access_control(user(&ctx.accounts.user_pool, &ctx.accounts.owner))]
    pub fn stake_nft_to_pool(
        ctx: Context<StakeNftToPool>,
        global_bump: u8,
        is_legendary: u8,
    ) -> ProgramResult {
        let mut user_pool = ctx.accounts.user_pool.load_mut()?;
        msg!("Stake Mint: {:?}", ctx.accounts.nft_mint.key());
        msg!("Is legendary: {}", is_legendary);

        let timestamp = Clock::get()?.unix_timestamp;
        user_pool.add_nft(ctx.accounts.nft_mint.key(), is_legendary, timestamp);

        msg!("Count: {}", user_pool.staked_count);
        msg!("Staked Time: {}", timestamp);
        ctx.accounts.global_authority.total_staked_count += 1;

        let token_account_info = &mut &ctx.accounts.user_token_account;
        let dest_token_account_info = &mut &ctx.accounts.dest_nft_token_account;
        let token_program = &mut &ctx.accounts.token_program;

        let cpi_accounts = Transfer {
            from: token_account_info.to_account_info().clone(),
            to: dest_token_account_info.to_account_info().clone(),
            authority: ctx.accounts.owner.to_account_info().clone()
        };
        token::transfer(
            CpiContext::new(token_program.clone().to_account_info(), cpi_accounts),
            1
        )?;
        // Err(ProgramError::from(StakingError::InvalidSuperOwner))
        Ok(())
    }
    
    #[access_control(user(&ctx.accounts.user_pool, &ctx.accounts.owner))]
    pub fn withdraw_nft_from_pool(
        ctx: Context<WithdrawNftFromPool>,
        global_bump: u8,
    ) -> ProgramResult {
        let mut user_pool = ctx.accounts.user_pool.load_mut()?;
        msg!("Staked Mint: {:?}", ctx.accounts.nft_mint.key());

        let timestamp = Clock::get()?.unix_timestamp;
        let reward: u64 = user_pool.remove_nft(ctx.accounts.nft_mint.key(), timestamp)?;
        msg!("Count: {}", user_pool.staked_count);
        msg!("Unstaked Time: {}", timestamp);
        msg!("Reward: {:?} Remain: {}", reward, user_pool.remaining_rewards);
        ctx.accounts.global_authority.total_staked_count -= 1;

        let token_account_info = &mut &ctx.accounts.user_token_account;
        let dest_token_account_info = &mut &ctx.accounts.dest_nft_token_account;
        let token_program = &mut &ctx.accounts.token_program;
        let seeds = &[GLOBAL_AUTHORITY_SEED.as_bytes(), &[global_bump]];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: dest_token_account_info.to_account_info().clone(),
            to: token_account_info.to_account_info().clone(),
            authority: ctx.accounts.global_authority.to_account_info()
        };
        token::transfer(
            CpiContext::new_with_signer(token_program.clone().to_account_info(), cpi_accounts, signer),
            1
        )?;
        // Err(ProgramError::from(StakingError::InvalidSuperOwner))
        Ok(())
    }
    
    #[access_control(user(&ctx.accounts.user_pool, &ctx.accounts.owner))]
    pub fn claim_reward(
        ctx: Context<ClaimReward>,
        global_bump: u8,
    ) -> ProgramResult {
        let timestamp = Clock::get()?.unix_timestamp;
    
        let mut user_pool = ctx.accounts.user_pool.load_mut()?;
        let reward: u64 = user_pool.claim_reward(
            timestamp
        )?;
        msg!("Reward: {:?} Updated Last Reward Time: {}", reward, user_pool.last_reward_time);
        msg!("Remaining: {}", user_pool.remaining_rewards);
        require!(reward > 0, StakingError::InvalidWithdrawTime);
        require!(ctx.accounts.reward_vault.amount >= reward, StakingError::InsufficientRewardVault);

        let seeds = &[GLOBAL_AUTHORITY_SEED.as_bytes(), &[global_bump]];
        let signer = &[&seeds[..]];
        let token_program = ctx.accounts.token_program.to_account_info();
        let cpi_accounts = Transfer {
            from: ctx.accounts.reward_vault.to_account_info(),
            to: ctx.accounts.user_reward_account.to_account_info(),
            authority: ctx.accounts.global_authority.to_account_info()
        };
        token::transfer(
            CpiContext::new_with_signer(token_program.clone(), cpi_accounts, signer),
            reward
        )?;

        // Err(ProgramError::InvalidAccountData)
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(global_bump: u8)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        init_if_needed,
        seeds = [GLOBAL_AUTHORITY_SEED.as_ref()],
        bump = global_bump,
        payer = admin
    )]
    pub global_authority: Account<'info, GlobalPool>,

    #[account(
        mut,
        constraint = reward_vault.mint == REWARD_TOKEN_MINT_PUBKEY.parse::<Pubkey>().unwrap(),
        constraint = reward_vault.owner == global_authority.key(),
        constraint = reward_vault.amount >= MIN_REWARD_DEPOSIT_AMOUNT,
    )]
    pub reward_vault: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>
}

#[derive(Accounts)]
pub struct InitializeUserPool<'info> {
    #[account(zero)]
    pub user_pool: AccountLoader<'info, UserPool>,

    #[account(mut)]
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(
    global_bump: u8,
)]
pub struct StakeNftToPool<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(mut)]
    pub user_pool: AccountLoader<'info, UserPool>,

    #[account(
        mut,
        seeds = [GLOBAL_AUTHORITY_SEED.as_ref()],
        bump = global_bump,
    )]
    pub global_authority: Box<Account<'info, GlobalPool>>,
    
    #[account(
        mut,
        constraint = user_token_account.mint == *nft_mint.to_account_info().key,
        constraint = user_token_account.owner == *owner.key,
        constraint = user_token_account.amount == 1,
    )]
    pub user_token_account: CpiAccount<'info, TokenAccount>,

    #[account(
        mut,
        constraint = dest_nft_token_account.mint == *nft_mint.to_account_info().key,
        constraint = dest_nft_token_account.owner == *global_authority.to_account_info().key,
    )]
    pub dest_nft_token_account: CpiAccount<'info, TokenAccount>,

    pub nft_mint: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(
    global_bump: u8,
)]
pub struct WithdrawNftFromPool<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(mut)]
    pub user_pool: AccountLoader<'info, UserPool>,

    #[account(
        mut,
        seeds = [GLOBAL_AUTHORITY_SEED.as_ref()],
        bump = global_bump,
    )]
    pub global_authority: Box<Account<'info, GlobalPool>>,
    
    #[account(
        mut,
        constraint = user_token_account.mint == *nft_mint.to_account_info().key,
        constraint = user_token_account.owner == *owner.key,
    )]
    pub user_token_account: CpiAccount<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = dest_nft_token_account.mint == *nft_mint.to_account_info().key,
        constraint = dest_nft_token_account.owner == *global_authority.to_account_info().key,
        constraint = dest_nft_token_account.amount == 1,
    )]
    pub dest_nft_token_account: CpiAccount<'info, TokenAccount>,

    pub nft_mint: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(global_bump: u8)]
pub struct ClaimReward<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(mut)]
    pub user_pool: AccountLoader<'info, UserPool>,

    #[account(
        mut,
        seeds = [GLOBAL_AUTHORITY_SEED.as_ref()],
        bump = global_bump,
    )]
    pub global_authority: Account<'info, GlobalPool>,

    #[account(
        mut,
        constraint = reward_vault.mint == REWARD_TOKEN_MINT_PUBKEY.parse::<Pubkey>().unwrap(),
        constraint = reward_vault.owner == global_authority.key(),
    )]
    pub reward_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        constraint = user_reward_account.mint == REWARD_TOKEN_MINT_PUBKEY.parse::<Pubkey>().unwrap(),
        constraint = user_reward_account.owner == owner.key(),
    )]
    pub user_reward_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

// Access control modifiers
fn user(pool_loader: &AccountLoader<UserPool>, user: &AccountInfo) -> Result<()> {
    let user_pool = pool_loader.load()?;
    require!(user_pool.owner == *user.key, StakingError::InvalidUserPool);
    Ok(())
}