use anyhow::Result;
use greydio_smt::SparseMerkle;
use greydio_types::ContractId;

pub trait Contract {
    fn id(&self) -> ContractId;
    fn call(
        &self,
        state: &mut dyn SparseMerkle,   // <-- trait object, not generic
        method: &str,
        args: serde_json::Value,
    ) -> Result<serde_json::Value>;
}

pub struct OwnershipToken;
pub struct PopularityToken;

impl Contract for OwnershipToken {
    fn id(&self) -> ContractId { ContractId::OwnershipToken }
    fn call(
        &self,
        state: &mut dyn SparseMerkle,
        method: &str,
        args: serde_json::Value,
    ) -> Result<serde_json::Value> {
        let _ = state; let _ = args;
        match method {
            "mint" => Ok(serde_json::json!({"ok": true})),
            "transfer" => Ok(serde_json::json!({"ok": true})),
            _ => anyhow::bail!("unknown method"),
        }
    }
}

impl Contract for PopularityToken {
    fn id(&self) -> ContractId { ContractId::PopularityToken }
    fn call(
        &self,
        state: &mut dyn SparseMerkle,
        method: &str,
        args: serde_json::Value,
    ) -> Result<serde_json::Value> {
        let _ = state; let _ = args; let _ = method;
        Ok(serde_json::json!({"ok": true}))
    }
}
