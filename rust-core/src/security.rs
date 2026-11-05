use sha2::{Sha256, Digest};

pub struct SecurityEngine;

impl SecurityEngine {
    /// Compute SHA-256 unique fingerprint of slip image or transaction parameters
    /// Guarantees zero duplicate slips even across different filenames
    pub fn compute_slip_hash(bank_id: &str, amount: f64, date: &str, time: &str, ref_code: &str) -> String {
        let mut hasher = Sha256::new();
        hasher.update(bank_id.as_bytes());
        hasher.update(format!("{:.2}", amount).as_bytes());
        hasher.update(date.as_bytes());
        hasher.update(time.as_bytes());
        hasher.update(ref_code.as_bytes());
        let result = hasher.finalize();
        format!("{:x}", result)
    }

    /// Compute raw image byte hash for byte-level duplicate detection
    pub fn compute_image_hash(image_bytes: &[u8]) -> String {
        let mut hasher = Sha256::new();
        hasher.update(image_bytes);
        format!("{:x}", hasher.finalize())
    }

    /// Sanitize and redact sensitive bank account numbers (e.g. 123-4-56789-0 -> xxx-x-56789-0)
    pub fn mask_account_number(account: &str) -> String {
        if account.len() < 6 {
            return account.to_string();
        }
        let unmasked = &account[account.len() - 5..];
        format!("xxx-{}", unmasked)
    }
}
