use anyhow::Result;
use greydio_ledger::Ledger;
use greydio_smt::SparseMerkle;
use greydio_types::Tx;
use std::sync::atomic::{AtomicU64, AtomicUsize, Ordering};
use std::sync::{Arc, Mutex};
use tokio::sync::mpsc::Receiver;

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
    pub queue_len: Arc<AtomicUsize>,
    pub last_block_ts: Arc<AtomicU64>,
    pub block_count: Arc<AtomicU64>,
}

impl<L> SingleNodeConsensus<L> {
    pub fn new(
        ledger: Arc<Mutex<L>>,
        rx: Receiver<Tx>,
        queue_len: Arc<AtomicUsize>,
        last_block_ts: Arc<AtomicU64>,
        block_count: Arc<AtomicU64>,
    ) -> Self {
        Self {
            ledger,
            rx,
            queue_len,
            last_block_ts,
            block_count,
        }
    }
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
                if txs.len() >= 10_000 {
                    break;
                } // crude cap
            }
            if !txs.is_empty() {
                self.queue_len.fetch_sub(txs.len(), Ordering::Relaxed);
            }
            let now = SystemTime::now().duration_since(UNIX_EPOCH)?.as_millis() as u64;
            {
                let mut lg = self.ledger.lock().unwrap();
                lg.build(txs, now)?;
            }
            self.last_block_ts.store(now, Ordering::Relaxed);
            self.block_count.fetch_add(1, Ordering::Relaxed);
            tokio::time::sleep(std::time::Duration::from_millis(1000)).await;
        }
    }
}
