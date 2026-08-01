#![forbid(unsafe_code)]

use base64::Engine as _;
use medos_crypto_core::{
    canonical_json, hash_bytes, verify_signature, CryptoError, Ed25519Signer, SignatureBytes,
};
use serde::{Deserialize, Serialize};
use thiserror::Error;
use uuid::Uuid;

const MAX_PAYLOAD_BYTES: usize = 65_536;

#[derive(Debug, Error)]
pub enum AuditError {
    #[error("cryptographic operation failed")]
    Crypto(#[from] CryptoError),
    #[error("payload exceeds maximum size")]
    PayloadTooLarge,
    #[error("invalid sequence")]
    InvalidSequence,
    #[error("previous hash mismatch")]
    PreviousHashMismatch,
    #[error("current hash mismatch")]
    CurrentHashMismatch,
    #[error("signature mismatch")]
    SignatureMismatch,
    #[error("chain fork or rollback detected")]
    ForkOrRollback,
    #[error("durable store operation failed")]
    Store,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct AuditBody {
    pub schema_version: String,
    pub event_id: Uuid,
    pub chain_id: Uuid,
    pub sequence_number: u64,
    pub event_type: String,
    pub tenant_id: Uuid,
    pub correlation_id: Uuid,
    pub payload: serde_json::Value,
    pub previous_hash: Option<String>,
    pub signing_key_id: String,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct SignedAuditEntry {
    pub body: AuditBody,
    pub current_hash: String,
    pub signature_base64: String,
}

pub trait AuditStore {
    fn append_transactional(
        &mut self,
        expected_previous_hash: Option<&str>,
        entry: &SignedAuditEntry,
    ) -> Result<(), AuditError>;

    fn entries(&self, chain_id: Uuid) -> Result<Vec<SignedAuditEntry>, AuditError>;
}

pub fn append_entry(
    previous: Option<&SignedAuditEntry>,
    chain_id: Uuid,
    tenant_id: Uuid,
    event_type: impl Into<String>,
    payload: serde_json::Value,
    signer: &Ed25519Signer,
) -> Result<SignedAuditEntry, AuditError> {
    let payload_size = canonical_json(&payload)?.len();

    if payload_size > MAX_PAYLOAD_BYTES {
        return Err(AuditError::PayloadTooLarge);
    }

    let sequence_number = previous
        .map(|entry| entry.body.sequence_number.saturating_add(1))
        .unwrap_or(1);

    let previous_hash = previous.map(|entry| entry.current_hash.clone());

    if let Some(entry) = previous {
        if entry.body.chain_id != chain_id {
            return Err(AuditError::ForkOrRollback);
        }
    }

    let body = AuditBody {
        schema_version: "2.0.0".to_owned(),
        event_id: Uuid::now_v7(),
        chain_id,
        sequence_number,
        event_type: event_type.into(),
        tenant_id,
        correlation_id: Uuid::new_v4(),
        payload,
        previous_hash,
        signing_key_id: signer.key_id().as_str().to_owned(),
    };

    let canonical = canonical_json(&body)?;
    let current_hash = hash_bytes(&canonical);
    let signature = signer.sign(current_hash.bytes());

    Ok(SignedAuditEntry {
        body,
        current_hash: current_hash.to_hex(),
        signature_base64: signature.to_base64(),
    })
}

pub fn verify_chain(
    entries: &[SignedAuditEntry],
    verifying_key: &ed25519_dalek::VerifyingKey,
) -> Result<(), AuditError> {
    let mut expected_sequence = 1_u64;
    let mut expected_previous: Option<String> = None;
    let mut chain_id: Option<Uuid> = None;

    for entry in entries {
        if entry.body.sequence_number != expected_sequence {
            return Err(AuditError::InvalidSequence);
        }

        if entry.body.previous_hash != expected_previous {
            return Err(AuditError::PreviousHashMismatch);
        }

        if let Some(expected_chain) = chain_id {
            if entry.body.chain_id != expected_chain {
                return Err(AuditError::ForkOrRollback);
            }
        } else {
            chain_id = Some(entry.body.chain_id);
        }

        let canonical = canonical_json(&entry.body)?;
        let actual_hash = hash_bytes(&canonical);

        if actual_hash.to_hex() != entry.current_hash {
            return Err(AuditError::CurrentHashMismatch);
        }

        let raw_signature = base64::engine::general_purpose::STANDARD
            .decode(entry.signature_base64.as_bytes())
            .map_err(|_| AuditError::SignatureMismatch)?;

        let signature_array: [u8; 64] = raw_signature
            .try_into()
            .map_err(|_| AuditError::SignatureMismatch)?;

        let signature = SignatureBytes::from_array(signature_array);

        verify_signature(verifying_key, actual_hash.bytes(), &signature)
            .map_err(|_| AuditError::SignatureMismatch)?;

        expected_previous = Some(entry.current_hash.clone());
        expected_sequence = expected_sequence.saturating_add(1);
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use medos_crypto_core::KeyId;
    use serde_json::json;

    #[test]
    fn chain_verification_detects_modified_payload() -> Result<(), AuditError> {
        let signer = Ed25519Signer::generate(KeyId::new("audit-test").map_err(AuditError::Crypto)?);
        let chain = Uuid::new_v4();
        let tenant = Uuid::new_v4();

        let first = append_entry(
            None,
            chain,
            tenant,
            "CONSENT_GRANTED",
            json!({"kind":"CONSENT_GRANTED"}),
            &signer,
        )?;

        let second = append_entry(
            Some(&first),
            chain,
            tenant,
            "AUDIT_CHECKPOINT_CREATED",
            json!({"kind":"AUDIT_CHECKPOINT_CREATED"}),
            &signer,
        )?;

        let valid = vec![first.clone(), second.clone()];
        verify_chain(&valid, &signer.verifying_key())?;

        let mut modified = valid;
        modified[0].body.payload = json!({"kind":"TAMPERED"});

        assert!(verify_chain(&modified, &signer.verifying_key()).is_err());

        Ok(())
    }

    #[test]
    fn sequence_cannot_repeat() -> Result<(), AuditError> {
        let signer =
            Ed25519Signer::generate(KeyId::new("sequence-test").map_err(AuditError::Crypto)?);
        let chain = Uuid::new_v4();
        let tenant = Uuid::new_v4();

        let first = append_entry(None, chain, tenant, "CONSENT_GRANTED", json!({}), &signer)?;

        let mut second = append_entry(
            Some(&first),
            chain,
            tenant,
            "CONSENT_REVOKED",
            json!({}),
            &signer,
        )?;

        second.body.sequence_number = 1;

        assert!(verify_chain(&[first, second], &signer.verifying_key()).is_err());

        Ok(())
    }
}
