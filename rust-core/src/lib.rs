pub mod slip_parser;
pub mod categorizer;
pub mod security;
pub mod jni_bridge;

pub use slip_parser::{SlipParser, ParsedSlip};
pub use categorizer::Categorizer;
pub use security::SecurityEngine;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_emvco_payload_parsing() {
        let parser = SlipParser::new();
        // Sample payload containing tag 01 (Sending Bank: 0103004 = KBANK)
        let payload = "00460006000001010300402251104KBANK1234567890123456";
        let res = parser.parse_emvco_payload(payload);
        assert!(res.is_some());
        let (bank, r) = res.unwrap();
        assert_eq!(bank, "KBANK");
        assert!(!r.is_empty());
    }

    #[test]
    fn test_ocr_parsing() {
        let parser = SlipParser::new();
        let sample = "ธนาคารกสิกรไทย K PLUS\nโอนเงินสำเร็จ\nไปยัง ร้านค้า 7-Eleven\nจำนวนเงิน 145.00 บาท\nวันที่ 5 พ.ย. 2569 เวลา 12:45 น.\nรหัสอ้างอิง: 0143101245009871";
        let res = parser.parse_ocr_text(sample);
        assert_eq!(res.bank_id, "KBANK");
        assert_eq!(res.amount, 145.00);
        assert_eq!(res.date, "2026-11-05");
        assert_eq!(res.time, "12:45");
        assert!(res.payee.contains("7-Eleven"));
    }

    #[test]
    fn test_security_hash() {
        let hash1 = SecurityEngine::compute_slip_hash("KBANK", 145.00, "2026-11-05", "12:45", "REF123");
        let hash2 = SecurityEngine::compute_slip_hash("KBANK", 145.00, "2026-11-05", "12:45", "REF123");
        assert_eq!(hash1, hash2);
        assert_eq!(hash1.len(), 64);
    }
}
