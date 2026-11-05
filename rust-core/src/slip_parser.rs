use serde::{Deserialize, Serialize};
use regex::Regex;
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ParsedSlip {
    pub bank_id: String,
    pub amount: f64,
    pub date: String,
    pub time: String,
    pub payee: String,
    pub sender: String,
    pub ref_code: String,
    pub category_id: String,
    pub confidence: f32,
}

pub struct SlipParser {
    amount_re: Regex,
    time_explicit_re: Regex,
    time_general_re: Regex,
    date_thai_re: Regex,
    ref_re: Regex,
    bank_tag_re: Regex,
    bank_codes: HashMap<&'static str, &'static str>,
}

impl Default for SlipParser {
    fn default() -> Self {
        Self::new()
    }
}

impl SlipParser {
    pub fn new() -> Self {
        let mut bank_codes = HashMap::new();
        bank_codes.insert("004", "KBANK");
        bank_codes.insert("014", "SCB");
        bank_codes.insert("006", "KTB");
        bank_codes.insert("025", "BAY");
        bank_codes.insert("002", "BBL");
        bank_codes.insert("011", "TTB");
        bank_codes.insert("069", "DIME");
        bank_codes.insert("104", "TRUEMONEY");
        bank_codes.insert("030", "GSB");

        Self {
            amount_re: Regex::new(r"(?:จำนวนเงิน|ยอดเงิน|Amount)?\s*[:\s]*([0-9]{1,3}(?:,[0-9]{3})*\.[0-9]{2})").unwrap(),
            time_explicit_re: Regex::new(r"เวลา\s*(\d{1,2}[:.]\d{2})").unwrap(),
            time_general_re: Regex::new(r"(\d{1,2}:\d{2})").unwrap(),
            date_thai_re: Regex::new(r"(\d{1,2})\s*(ม\.ค\.|ก\.พ\.|มี\.ค\.|เม\.ย\.|พ\.ค\.|มิ\.ย\.|ก\.ค\.|ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\.ย\.|ธ\.ค\.)\s*(\d{2,4})").unwrap(),
            ref_re: Regex::new(r"(?:รหัสอ้างอิง|เลขที่รายการ|Ref|Transaction Ref)[:\s]*([A-Za-z0-9]{10,35})").unwrap(),
            bank_tag_re: Regex::new(r"0103(\d{3})").unwrap(),
            bank_codes,
        }
    }

    /// Parse EMVCo Thai QR / Mini-QR Slip Payload
    pub fn parse_emvco_payload(&self, payload: &str) -> Option<(String, String)> {
        if payload.len() < 16 {
            return None;
        }

        // Try extracting sub-tag 01 (Sending Bank: 0103 + 3-digit code)
        let mut bank_id = "KBANK".to_string();
        if let Some(cap) = self.bank_tag_re.captures(payload) {
            let code = &cap[1];
            if let Some(&id) = self.bank_codes.get(code) {
                bank_id = id.to_string();
            }
        } else {
            // Check direct bank name keywords
            let upper = payload.to_uppercase();
            for &id in self.bank_codes.values() {
                if upper.contains(id) {
                    bank_id = id.to_string();
                    break;
                }
            }
        }

        // Extract transaction reference token (alphanumeric sequence 12-32 chars)
        let ref_re = Regex::new(r"[A-Z0-9]{12,32}").ok()?;
        let ref_code = ref_re.find(payload).map(|m| m.as_str().to_string()).unwrap_or_default();

        Some((bank_id, ref_code))
    }

    /// Parse raw OCR text extracted from bank slip
    pub fn parse_ocr_text(&self, text: &str) -> ParsedSlip {
        let bank_id = self.detect_bank(text);
        let amount = self.extract_amount(text).unwrap_or(0.0);
        let time = self.extract_time(text).unwrap_or_else(|| "12:00".to_string());
        let date = self.extract_date(text).unwrap_or_else(|| "2026-11-05".to_string());
        let ref_code = self.extract_ref(text).unwrap_or_else(|| format!("{}-REF", bank_id));
        let payee = self.extract_payee(text, &bank_id);
        let sender = self.extract_sender(text);

        ParsedSlip {
            bank_id,
            amount,
            date,
            time,
            payee,
            sender,
            ref_code,
            category_id: "food".to_string(),
            confidence: 0.95,
        }
    }

    fn detect_bank(&self, text: &str) -> String {
        let lower = text.to_lowercase();
        if lower.contains("กสิกร") || lower.contains("kbank") || lower.contains("k plus") {
            "KBANK".to_string()
        } else if lower.contains("ไทยพาณิชย์") || lower.contains("scb") {
            "SCB".to_string()
        } else if lower.contains("กรุงไทย") || lower.contains("ktb") || lower.contains("next") {
            "KTB".to_string()
        } else if lower.contains("กรุงศรี") || lower.contains("bay") || lower.contains("kma") {
            "BAY".to_string()
        } else if lower.contains("กรุงเทพ") || lower.contains("bbl") || lower.contains("bualuang") {
            "BBL".to_string()
        } else if lower.contains("ทีเอ็มบี") || lower.contains("ttb") || lower.contains("ธนชาต") {
            "TTB".to_string()
        } else if lower.contains("make") || lower.contains("cloud pocket") {
            "MAKE".to_string()
        } else if lower.contains("dime") || lower.contains("เกียรตินาคิน") {
            "DIME".to_string()
        } else if lower.contains("truemoney") || lower.contains("ทรูมันนี่") {
            "TRUEMONEY".to_string()
        } else {
            "KBANK".to_string()
        }
    }

    fn extract_amount(&self, text: &str) -> Option<f64> {
        let mut best_amount: Option<f64> = None;
        for cap in self.amount_re.captures_iter(text) {
            let s = cap[1].replace(',', "");
            if let Ok(val) = s.parse::<f64>() {
                if val >= 1.0 && val < 500000.0 {
                    best_amount = Some(val);
                }
            }
        }
        best_amount
    }

    fn extract_time(&self, text: &str) -> Option<String> {
        if let Some(cap) = self.time_explicit_re.captures(text) {
            return Some(cap[1].replace('.', ":"));
        }
        if let Some(cap) = self.time_general_re.captures(text) {
            return Some(cap[1].replace('.', ":"));
        }
        None
    }

    fn extract_date(&self, text: &str) -> Option<String> {
        if let Some(cap) = self.date_thai_re.captures(text) {
            let day = cap[1].parse::<u32>().unwrap_or(1);
            let month_name = &cap[2];
            let year_str = &cap[3];
            let mut year = year_str.parse::<i32>().unwrap_or(2026);
            if year > 2500 {
                year -= 543; // Convert Buddhist Era to CE
            } else if year < 100 {
                year += 2000;
            }

            let month = match month_name {
                "ม.ค." => 1, "ก.พ." => 2, "มี.ค." => 3, "เม.ย." => 4,
                "พ.ค." => 5, "มิ.ย." => 6, "ก.ค." => 7, "ส.ค." => 8,
                "ก.ย." => 9, "ต.ค." => 10, "พ.ย." => 11, "ธ.ค." => 12,
                _ => 11,
            };

            Some(format!("{:04}-{:02}-{:02}", year, month, day))
        } else {
            None
        }
    }

    fn extract_ref(&self, text: &str) -> Option<String> {
        self.ref_re.captures(text).map(|cap| cap[1].to_string())
    }

    fn extract_payee(&self, text: &str, bank_id: &str) -> String {
        let payee_re = Regex::new(r"(?:ไปยัง|ผู้รับเงิน|To|ร้านค้า)[:\s]*([^\n\r]+)").unwrap();
        if let Some(cap) = payee_re.captures(text) {
            let p = cap[1].trim();
            if !p.is_empty() {
                return p.to_string();
            }
        }

        match bank_id {
            "KBANK" => "ร้านค้าพร้อมเพย์ (K PLUS)".to_string(),
            "SCB" => "ร้านค้า QR (SCB EASY)".to_string(),
            "KTB" => "ร้านค้าถุงเงิน (เป๋าตัง)".to_string(),
            "MAKE" => "Cloud Pocket (MAKE)".to_string(),
            _ => "สแกนชำระเงิน QR".to_string(),
        }
    }

    fn extract_sender(&self, text: &str) -> String {
        let sender_re = Regex::new(r"(?:จาก|ผู้โอน|From)[:\s]*([^\n\r]+)").unwrap();
        if let Some(cap) = sender_re.captures(text) {
            let s = cap[1].trim();
            if !s.is_empty() {
                return s.to_string();
            }
        }
        "บัญชีของฉัน".to_string()
    }
}
