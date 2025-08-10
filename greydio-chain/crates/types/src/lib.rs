use serde::{Deserialize, Serialize};

pub type Slot = u64;
pub type Height = u64;

#[derive(Clone, Copy, Debug, Default, Eq, PartialEq, Hash, Serialize, Deserialize)]
pub struct Hash(pub [u8; 32]);

impl Hash {
    pub fn zero() -> Self { Self([0u8; 32]) }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Tx {
    pub from: Vec<u8>,   // pubkey bytes
    pub nonce: u64,
    pub payload: TxPayload,
    pub signature: Vec<u8>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum TxPayload {
    Transfer { to: Vec<u8>, amount: u128 },
    Call { contract: ContractId, method: String, args: serde_json::Value },
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq, Eq)]
pub enum ContractId {
    OwnershipToken,
    PopularityToken,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct BlockHeader {
    pub height: Height,
    pub prev_hash: Hash,
    pub state_root: Hash,
    pub tx_root: Hash,
    pub timestamp_ms: u64,
    pub proposer: Vec<u8>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Block {
    pub header: BlockHeader,
    pub txs: Vec<Tx>,
}

pub fn blake3_hash(bytes: &[u8]) -> Hash {
    let mut hasher = blake3::Hasher::new();
    hasher.update(bytes);
    let out = hasher.finalize();
    let mut h = [0u8; 32];
    h.copy_from_slice(out.as_bytes());
    Hash(h)
}
