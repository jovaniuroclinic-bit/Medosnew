#![forbid(unsafe_code)]

use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use chacha20poly1305::{
    aead::{Aead, KeyInit, Payload},
    XChaCha20Poly1305, XNonce,
};
use ed25519_dalek::{Signature, Signer, SigningKey, Verifier, VerifyingKey};
use rand_core::{OsRng, RngCore};
use serde::Serialize;
use sha2::{Digest, Sha256};
use thiserror::Error;
use zeroize::{Zeroize, Zeroizing};

const HASH_DOMAIN: &[u8] = b"MEDOS:HASH:V1\0";
const SIGNATURE_DOMAIN: &[u8] = b"MEDOS:SIGNATURE:V1\0";

#[derive(Debug, Error)]
pub enum CryptoError {
    #[error("canonical serialization failed")]
    CanonicalSerialization,
    #[error("encryption failed")]
    Encryption,
    #[error("decryption or authentication failed")]
    Decryption,
    #[error("signature verification failed")]
    SignatureVerification,
    #[error("invalid key length")]
    InvalidKeyLength,
    #[error("invalid nonce length")]
    InvalidNonceLength,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct KeyId(String);

impl KeyId {
    pub fn new(value: impl Into<String>) -> Result<Self, CryptoError> {
        let value = value.into();
        if value.is_empty() || value.len() > 128 {
            return Err(CryptoError::InvalidKeyLength);
        }
        Ok(Self(value))
    }

    #[must_use]
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ContentHash([u8; 32]);

impl ContentHash {
    #[must_use]
    pub fn bytes(&self) -> &[u8; 32] {
        &self.0
    }

    #[must_use]
    pub fn to_hex(&self) -> String {
        self.0.iter().map(|byte| format!("{byte:02x}")).collect()
    }
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct SignatureBytes([u8; 64]);

impl SignatureBytes {
    #[must_use]
    pub fn from_array(value: [u8; 64]) -> Self {
        Self(value)
    }

    #[must_use]
    pub fn bytes(&self) -> &[u8; 64] {
        &self.0
    }

    #[must_use]
    pub fn to_base64(&self) -> String {
        BASE64.encode(self.0)
    }
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Nonce([u8; 24]);

impl Nonce {
    pub fn generate() -> Self {
        let mut value = [0_u8; 24];
        OsRng.fill_bytes(&mut value);
        Self(value)
    }

    #[must_use]
    pub fn bytes(&self) -> &[u8; 24] {
        &self.0
    }
}

#[derive(Debug)]
pub struct SecretBytes(Zeroizing<Vec<u8>>);

impl SecretBytes {
    #[must_use]
    pub fn new(value: Vec<u8>) -> Self {
        Self(Zeroizing::new(value))
    }

    #[must_use]
    pub fn expose(&self) -> &[u8] {
        self.0.as_slice()
    }
}

impl Drop for SecretBytes {
    fn drop(&mut self) {
        self.0.zeroize();
    }
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct CiphertextAndTag(Vec<u8>);

impl CiphertextAndTag {
    #[must_use]
    pub fn bytes(&self) -> &[u8] {
        &self.0
    }
}

pub fn canonical_json<T: Serialize>(value: &T) -> Result<Vec<u8>, CryptoError> {
    serde_jcs::to_vec(value).map_err(|_| CryptoError::CanonicalSerialization)
}

#[must_use]
pub fn hash_bytes(data: &[u8]) -> ContentHash {
    let mut hasher = Sha256::new();
    hasher.update(HASH_DOMAIN);
    hasher.update(data);
    ContentHash(hasher.finalize().into())
}

pub struct Ed25519Signer {
    key_id: KeyId,
    signing_key: SigningKey,
}

impl Ed25519Signer {
    #[must_use]
    pub fn generate(key_id: KeyId) -> Self {
        Self {
            key_id,
            signing_key: SigningKey::generate(&mut OsRng),
        }
    }

    #[must_use]
    pub fn key_id(&self) -> &KeyId {
        &self.key_id
    }

    #[must_use]
    pub fn verifying_key(&self) -> VerifyingKey {
        self.signing_key.verifying_key()
    }

    #[must_use]
    pub fn sign(&self, message: &[u8]) -> SignatureBytes {
        let mut domain_message = Vec::with_capacity(SIGNATURE_DOMAIN.len() + message.len());
        domain_message.extend_from_slice(SIGNATURE_DOMAIN);
        domain_message.extend_from_slice(message);

        SignatureBytes(self.signing_key.sign(&domain_message).to_bytes())
    }
}

pub fn verify_signature(
    verifying_key: &VerifyingKey,
    message: &[u8],
    signature: &SignatureBytes,
) -> Result<(), CryptoError> {
    let mut domain_message = Vec::with_capacity(SIGNATURE_DOMAIN.len() + message.len());
    domain_message.extend_from_slice(SIGNATURE_DOMAIN);
    domain_message.extend_from_slice(message);

    let parsed = Signature::from_bytes(signature.bytes());

    verifying_key
        .verify(&domain_message, &parsed)
        .map_err(|_| CryptoError::SignatureVerification)
}

pub fn generate_data_key() -> SecretBytes {
    let mut key = vec![0_u8; 32];
    OsRng.fill_bytes(&mut key);
    SecretBytes::new(key)
}

pub fn encrypt(
    key: &SecretBytes,
    nonce: &Nonce,
    plaintext: &[u8],
    aad: &[u8],
) -> Result<CiphertextAndTag, CryptoError> {
    if key.expose().len() != 32 {
        return Err(CryptoError::InvalidKeyLength);
    }

    let cipher = XChaCha20Poly1305::new_from_slice(key.expose())
        .map_err(|_| CryptoError::InvalidKeyLength)?;

    let encrypted = cipher
        .encrypt(
            XNonce::from_slice(nonce.bytes()),
            Payload {
                msg: plaintext,
                aad,
            },
        )
        .map_err(|_| CryptoError::Encryption)?;

    Ok(CiphertextAndTag(encrypted))
}

pub fn decrypt(
    key: &SecretBytes,
    nonce: &Nonce,
    ciphertext: &CiphertextAndTag,
    aad: &[u8],
) -> Result<SecretBytes, CryptoError> {
    if key.expose().len() != 32 {
        return Err(CryptoError::InvalidKeyLength);
    }

    let cipher = XChaCha20Poly1305::new_from_slice(key.expose())
        .map_err(|_| CryptoError::InvalidKeyLength)?;

    let plaintext = cipher
        .decrypt(
            XNonce::from_slice(nonce.bytes()),
            Payload {
                msg: ciphertext.bytes(),
                aad,
            },
        )
        .map_err(|_| CryptoError::Decryption)?;

    Ok(SecretBytes::new(plaintext))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn signature_detects_tampering() -> Result<(), CryptoError> {
        let signer = Ed25519Signer::generate(KeyId::new("test-key")?);
        let signature = signer.sign(b"original");

        verify_signature(&signer.verifying_key(), b"original", &signature)?;
        assert!(verify_signature(&signer.verifying_key(), b"modified", &signature).is_err());

        Ok(())
    }

    #[test]
    fn authenticated_encryption_round_trip() -> Result<(), CryptoError> {
        let key = generate_data_key();
        let nonce = Nonce::generate();
        let aad = b"tenant=synthetic-test";
        let encrypted = encrypt(&key, &nonce, b"synthetic audio only", aad)?;
        let decrypted = decrypt(&key, &nonce, &encrypted, aad)?;

        assert_eq!(decrypted.expose(), b"synthetic audio only");
        assert!(decrypt(&key, &nonce, &encrypted, b"wrong aad").is_err());

        Ok(())
    }

    #[test]
    fn independent_nonces_are_not_equal() {
        assert_ne!(Nonce::generate(), Nonce::generate());
    }
}
