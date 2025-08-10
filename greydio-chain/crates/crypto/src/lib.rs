use ed25519_dalek::{Signer, Verifier};

pub struct Keypair(ed25519_dalek::SigningKey);

impl Keypair {
    pub fn generate() -> Self {
        use rand::rngs::OsRng;
        let kp = ed25519_dalek::SigningKey::generate(&mut OsRng);
        Self(kp)
    }
    pub fn public(&self) -> Vec<u8> {
        self.0.verifying_key().as_bytes().to_vec()
    }
    pub fn sign(&self, msg: &[u8]) -> Vec<u8> {
        self.0.sign(msg).to_bytes().to_vec()
    }
}

pub fn verify(public: &[u8], msg: &[u8], sig: &[u8]) -> anyhow::Result<()> {
    use core::convert::TryInto;
    let vk = ed25519_dalek::VerifyingKey::from_bytes(public.try_into()?)?;
    let sig = ed25519_dalek::Signature::from_bytes(sig.try_into()?);
    vk.verify(msg, &sig)?;
    Ok(())
}
