use anyhow::Result;
use greydio_types::Hash;

pub trait SparseMerkle {
    fn get_root(&self) -> Hash;
    fn get(&self, key: &[u8]) -> Result<Option<Vec<u8>>>;
    fn put(&mut self, key: &[u8], value: &[u8]) -> Result<()>;
}

use std::collections::BTreeMap;

pub struct NaiveSparseMerkle {
    map: BTreeMap<Vec<u8>, Vec<u8>>,
    root: Hash,
}

impl Default for NaiveSparseMerkle {
    fn default() -> Self { Self { map: BTreeMap::new(), root: Hash::zero() } }
}

impl NaiveSparseMerkle {
    fn recompute_root(&mut self) {
        let mut bytes = vec![];
        for (k, v) in self.map.iter() {
            bytes.extend_from_slice(k);
            bytes.extend_from_slice(v);
        }
        self.root = greydio_types::blake3_hash(&bytes);
    }
}

impl SparseMerkle for NaiveSparseMerkle {
    fn get_root(&self) -> Hash { self.root }
    fn get(&self, key: &[u8]) -> Result<Option<Vec<u8>>> {
        Ok(self.map.get(key).cloned())
    }
    fn put(&mut self, key: &[u8], value: &[u8]) -> Result<()> {
        self.map.insert(key.to_vec(), value.to_vec());
        self.recompute_root();
        Ok(())
    }
}
