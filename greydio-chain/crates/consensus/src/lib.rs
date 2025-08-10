use anyhow::Result;
use greydio_ledger::Ledger;
use greydio_types::Tx;
use std::sync::{Arc, Mutex};
use tokio::sync::mpsc::Receiver;
use greydio_smt::SparseMerkle;

/// Narrow trait so we don’t expose all of Ledger here.
pub trait LedgerLike {
    fn build(&mut self, txs: Vec<Tx>, ts_ms: u64) -> Result<()>;
}

// Blanket impl for our real ledger.
impl<T: SparseMerkle> LedgerLike for Ledger<T> {
    fn build(&mut self, txs: Vec<Tx>, ts_ms: u64) -> Result<()> {
        self.build_block(txs, vec![], ts_ms)?;
        Ok(())
    }
}

/// Super-simple single-node proposer for devnet.
pub struct SingleNodeConsensus<L> {
    pub ledger: Arc<Mutex<L>>,
    pub rx: Receiver<Tx>,
}

impl<L> SingleNodeConsensus<L> {
    pub fn new(ledger: Arc<Mutex<L>>, rx: Receiver<Tx>) -> Self { Self { ledger, rx } }
}

impl<L> SingleNodeConsensus<L>
where
    L: LedgerLike + Send + 'static,
{
    pub async fn run(&mut self) -> Result<()> {
        use std::time::{SystemTime, UNIX_EPOCH};
        loop {
            // Drain all currently queued txs without waiting
            let mut txs = Vec::new();
            while let Ok(tx) = self.rx.try_recv() {
                txs.push(tx);
                if txs.len() >= 10_000 { break; } // crude cap
            }
            let now = SystemTime::now().duration_since(UNIX_EPOCH)?.as_millis() as u64;
            {
                let mut lg = self.ledger.lock().unwrap();
                lg.build(txs, now)?;
            }
            tokio::time::sleep(std::time::Duration::from_millis(1000)).await;
        }
    }
}
