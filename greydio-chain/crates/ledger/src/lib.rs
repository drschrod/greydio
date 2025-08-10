use anyhow::Result;
use greydio_contracts::{Contract, OwnershipToken, PopularityToken};
use greydio_smt::{NaiveSparseMerkle, SparseMerkle};
use greydio_types::{blake3_hash, Block, BlockHeader, ContractId, Hash, Tx, TxPayload};

pub struct Ledger<S: SparseMerkle> {
    state: S,
    tip: Hash,
    height: u64,
}

impl Default for Ledger<NaiveSparseMerkle> {
    fn default() -> Self {
        Self::new(NaiveSparseMerkle::default())
    }
}

impl<S: SparseMerkle> Ledger<S> {
    pub fn new(state: S) -> Self {
       Self { state, tip: Hash::zero(), height: 0 }
    }

    fn call_contract(
        &mut self,
        id: &ContractId,
        method: &str,
        args: serde_json::Value,
    ) -> anyhow::Result<serde_json::Value> {
        match id {
            ContractId::OwnershipToken => OwnershipToken.call(&mut self.state, method, args),
            ContractId::PopularityToken => PopularityToken.call(&mut self.state, method, args),
        }
    }

    pub fn apply_tx(&mut self, tx: &Tx) -> Result<()> {
        // TODO: verify signature, check nonce, balances, etc.
        match &tx.payload {
            TxPayload::Transfer { .. } => Ok(()),
            TxPayload::Call { contract, method, args } => {
                // No borrow of self; we only touch state mutably.
                self.call_contract(contract, method, args.clone())?;
                Ok(())
            }
        }
    }

    pub fn build_block(&mut self, txs: Vec<Tx>, proposer: Vec<u8>, timestamp_ms: u64) -> Result<Block> {
        for tx in &txs {
            self.apply_tx(tx)?;
        }
        let tx_root = blake3_hash(&bincode::serialize(&txs)?);
        let header = BlockHeader {
            height: self.height + 1,
            prev_hash: self.tip,
            state_root: self.state.get_root(),
            tx_root,
            timestamp_ms,
            proposer,
        };
        let block = Block { header: header.clone(), txs };
        self.tip = blake3_hash(&bincode::serialize(&header)?);
        self.height += 1;
        Ok(block)
    }

    pub fn tip(&self) -> Hash { self.tip }
    pub fn height(&self) -> u64 { self.height }
}
