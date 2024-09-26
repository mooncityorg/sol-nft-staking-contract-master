use anchor_lang::prelude::*;

#[error]
pub enum StakingError {
    #[msg("Uninitialized account")]
    Uninitialized,
    #[msg("Invalid Super Owner")]
    InvalidSuperOwner,
    #[msg("Invalid User Pool Owner")]
    InvalidUserPool,
    #[msg("Invalid NFT Address")]
    InvalidNFTAddress,
    #[msg("Invalid Withdraw Time")]
    InvalidWithdrawTime,
    #[msg("Insufficient Reward Token Balance")]
    InsufficientRewardVault,
}