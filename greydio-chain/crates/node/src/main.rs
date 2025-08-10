use greydio_consensus::SingleNodeConsensus;
use greydio_ledger::Ledger;
use greydio_rpc::{serve, Rpc};
use greydio_smt::NaiveSparseMerkle;
use std::sync::{Arc, Mutex};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt().with_env_filter("info").init();

    // State + ledger
    let state = NaiveSparseMerkle::default();
    let ledger = Ledger::new(state);

    // Create mempool channel
    let (tx_sender, tx_receiver) = tokio::sync::mpsc::channel(1000);

    // RPC
    let rpc = Rpc::new(ledger, tx_sender);
    let ledger_arc = rpc.ledger.clone();
    let addr = "127.0.0.1:8080".parse().unwrap();
    tokio::spawn(async move { serve(rpc, addr).await });

    // Consensus loop (single node, fixed 1s interval)
    let mut consensus = SingleNodeConsensus::new(ledger_arc as Arc<Mutex<_>>, tx_receiver);
    let _ = consensus.run().await;

    Ok(())
}
