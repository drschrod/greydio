use axum::{routing::post, Json, Router};
use greydio_ledger::Ledger;
use greydio_smt::SparseMerkle;
use greydio_types::{Hash, Tx};
use serde::Deserialize;
use std::net::SocketAddr;
use std::sync::atomic::{AtomicU64, AtomicUsize, Ordering}; // +++
use std::sync::Arc;
use tokio::net::TcpListener;

pub struct Rpc<L> {
    pub ledger: Arc<std::sync::Mutex<L>>,
    pub tx_sender: tokio::sync::mpsc::Sender<Tx>,
    pub queue_len: Arc<AtomicUsize>,
    pub last_block_ts: Arc<AtomicU64>, // +++
    pub block_count: Arc<AtomicU64>,   // +++
}

impl<L> Rpc<L> {
    pub fn new(
        ledger: L,
        tx_sender: tokio::sync::mpsc::Sender<Tx>,
        queue_len: Arc<AtomicUsize>,
        last_block_ts: Arc<AtomicU64>, // +++
        block_count: Arc<AtomicU64>,   // +++
    ) -> Self {
        Self {
            ledger: Arc::new(std::sync::Mutex::new(ledger)),
            tx_sender,
            queue_len,
            last_block_ts,
            block_count,
        }
    }
}

impl<L> Clone for Rpc<L> {
    fn clone(&self) -> Self {
        Self {
            ledger: self.ledger.clone(),
            tx_sender: self.tx_sender.clone(),
            queue_len: self.queue_len.clone(),
            last_block_ts: self.last_block_ts.clone(), // +++
            block_count: self.block_count.clone(),     // +++
        }
    }
}

// Minimal trait so RPC can query ledger info.
pub trait HasTip {
    fn tip(&self) -> Hash;
    fn height(&self) -> u64;
}

impl<T: SparseMerkle> HasTip for Ledger<T> {
    fn tip(&self) -> Hash {
        self.tip()
    }
    fn height(&self) -> u64 {
        self.height()
    }
}

#[derive(Deserialize)]
struct SubmitReq {
    tx: Tx,
}

pub async fn serve<L>(rpc: Rpc<L>, addr: SocketAddr)
where
    L: HasTip + Send + 'static,
{
    let app = Router::new()
        .route("/submit", post({
            let r = rpc.clone();
            move |Json(req): Json<SubmitReq>| {
                let r = r.clone();
                async move {
                    if r.tx_sender.send(req.tx).await.is_ok() {
                        r.queue_len.fetch_add(1, Ordering::Relaxed);
                    }
                    axum::http::StatusCode::OK
                }
            }
        }))
        .route("/tip", post({
            let r = rpc.clone();
            move || {
                let r = r.clone();
                async move {
                    let lg = r.ledger.lock().unwrap();
                    let tip: Hash = lg.tip();
                    let hexs = format!("0x{}", hex::encode(tip.0));
                    Json(serde_json::json!({ "tip": hexs }))
                }
            }
        }))
        .route("/height", post({
            let r = rpc.clone();
            move || {
                let r = r.clone();
                async move {
                    let lg = r.ledger.lock().unwrap();
                    Json(serde_json::json!({ "height": lg.height() }))
                }
            }
        }))
        .route("/mempool_size", post({
            let r = rpc.clone();
            move || {
                let r = r.clone();
                async move {
                    Json(serde_json::json!({ "queued": r.queue_len.load(Ordering::Relaxed) as u64 }))
                }
            }
        }))
        .route("/healthz", post({
            let r = rpc.clone();
            move || {
                let r = r.clone();
                async move {
                    let now_ms = std::time::SystemTime::now()
                        .duration_since(std::time::UNIX_EPOCH).unwrap().as_millis() as u64;
                    let last = r.last_block_ts.load(Ordering::Relaxed);
                    let age = if last > 0 { now_ms.saturating_sub(last) } else { 0 };
                    let last_age_val = if last > 0 {
                        serde_json::json!(age)
                    } else {
                        serde_json::Value::Null
                    };
                    let lg = r.ledger.lock().unwrap();
                    Json(serde_json::json!({
                        "ok": last > 0 && age < 10_000,
                        "height": lg.height(),
                        "queued": r.queue_len.load(Ordering::Relaxed),
                        "last_block_ms_ago": last_age_val,
                    }))
                }
            }
        }))
        .route("/metrics", post({
            let r = rpc.clone();
            move || {
                let r = r.clone();
                async move {
                    let lg = r.ledger.lock().unwrap();
                    let tip: Hash = lg.tip();
                    Json(serde_json::json!({
                        "tip": format!("0x{}", hex::encode(tip.0)),
                        "height": lg.height(),
                        "queued": r.queue_len.load(Ordering::Relaxed),
                        "last_block_timestamp_ms": r.last_block_ts.load(Ordering::Relaxed),
                        "block_count": r.block_count.load(Ordering::Relaxed),
                    }))
                }
            }
        }));

    let listener = TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
