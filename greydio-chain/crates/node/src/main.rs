use greydio_consensus::SingleNodeConsensus;
use greydio_ledger::Ledger;
use greydio_rpc::{serve, Rpc};
use greydio_smt::NaiveSparseMerkle;
use std::sync::atomic::AtomicU64;
use std::sync::atomic::AtomicUsize;
use std::sync::{Arc, Mutex};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt().with_env_filter("info").init();

    // State + ledger
    let state = NaiveSparseMerkle::default();
    let ledger = Ledger::new(state);

    // Create mempool channel
    let (tx_sender, tx_receiver) = tokio::sync::mpsc::channel(1000);

    // Metrics we’ll expose via RPC
    let qlen = Arc::new(AtomicUsize::new(0));
    let last_block_ts = Arc::new(AtomicU64::new(0)); // +++
    let block_count = Arc::new(AtomicU64::new(0)); // +++

    // RPC
    let rpc = Rpc::new(
        ledger,
        tx_sender,
        qlen.clone(),
        last_block_ts.clone(),
        block_count.clone(),
    ); // +++
    let ledger_arc = rpc.ledger.clone();
    let addr = "127.0.0.1:8080".parse().unwrap();
    tokio::spawn(async move { serve(rpc, addr).await });

    // Consensus loop (single node, fixed 1s interval)
    let mut consensus = SingleNodeConsensus::new(
        ledger_arc as Arc<Mutex<_>>,
        tx_receiver,
        qlen,
        last_block_ts, // +++
        block_count,   // +++
    );
    let _ = consensus.run().await;
    Ok(())
}
