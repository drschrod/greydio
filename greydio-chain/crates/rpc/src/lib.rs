use axum::{routing::post, Json, Router};
use greydio_ledger::Ledger;
use greydio_types::{Tx, Hash};
use greydio_smt::SparseMerkle;
use serde::Deserialize;
use std::net::SocketAddr;
use tokio::net::TcpListener;

pub struct Rpc<L> {
    pub ledger: std::sync::Arc<std::sync::Mutex<L>>,
    pub tx_sender: tokio::sync::mpsc::Sender<Tx>,
}

impl<L> Rpc<L> {
    pub fn new(ledger: L, tx_sender: tokio::sync::mpsc::Sender<Tx>) -> Self {
        Self { ledger: std::sync::Arc::new(std::sync::Mutex::new(ledger)), tx_sender }
    }
}

impl<L> Clone for Rpc<L> {
    fn clone(&self) -> Self {
        Self { ledger: self.ledger.clone(), tx_sender: self.tx_sender.clone() }
    }
}

// Minimal trait so RPC can query the tip without knowing the concrete ledger.
pub trait HasTip {
    fn tip(&self) -> Hash;
}

// Provide HasTip for any Ledger<T> where T: SparseMerkle.
impl<T: SparseMerkle> HasTip for Ledger<T> {
    fn tip(&self) -> Hash { self.tip() }
}

#[derive(Deserialize)]
struct SubmitReq { tx: Tx }

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
                    let _ = r.tx_sender.send(req.tx).await;
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
                    Json(serde_json::json!({ "tip": tip.0 }))
                }
            }
        }));

    let listener = TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
