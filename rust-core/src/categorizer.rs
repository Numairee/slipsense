use std::collections::HashMap;

pub struct Categorizer {
    rules: HashMap<String, String>,
}

impl Default for Categorizer {
    fn default() -> Self {
        Self::new()
    }
}

impl Categorizer {
    pub fn new() -> Self {
        let mut rules = HashMap::new();
        // Fast keyword rules
        let keywords_food = ["ข้าว", "อาหาร", "กาแฟ", "ชา", "cafe", "coffee", "7-eleven", "เซเว่น", "lineman", "grabfood", "foodpanda", "ส้มตำ", "ก๋วยเตี๋ยว", "ชาบู", "หมูกระทะ", "สุกี้", "kfc", "mcdonald", "amazon", "starbucks", "เต่าบิน"];
        for k in keywords_food {
            rules.insert(k.to_string(), "food".to_string());
        }

        let keywords_transport = ["bts", "mrt", "arl", "รถไฟฟ้า", "แท็กซี่", "taxi", "grab", "bolt", "ปั๊ม", "ptt", "บางจาก", "shell", "น้ำมัน", "ทางด่วน", "easy pass"];
        for k in keywords_transport {
            rules.insert(k.to_string(), "transport".to_string());
        }

        let keywords_shopping = ["shopee", "lazada", "tiktok", "watson", "boots", "uniqlo", "zara", "big c", "lotus", "โลตัส", "บิ๊กซี", "makro", "แม็คโคร", "เสื้อผ้า"];
        for k in keywords_shopping {
            rules.insert(k.to_string(), "shopping".to_string());
        }

        let keywords_bills = ["กฟน", "กฟภ", "กปน", "กปภ", "ais", "true", "dtac", "3bb", "nt", "เน็ต", "wifi", "netflix", "spotify", "ค่าไฟ", "ค่าน้ำ", "ประกัน"];
        for k in keywords_bills {
            rules.insert(k.to_string(), "bills".to_string());
        }

        let keywords_health = ["โรงพยาบาล", "รพ.", "คลินิก", "clinic", "hospital", "เภสัช", "ร้านยา", "ฟัน", "ทันตกรรม"];
        for k in keywords_health {
            rules.insert(k.to_string(), "health".to_string());
        }

        Self { rules }
    }

    pub fn categorize(&self, payee: &str, note: &str) -> &'static str {
        let combined = format!("{} {}", payee.to_lowercase(), note.to_lowercase());

        for (kw, cat) in &self.rules {
            if combined.contains(kw) {
                return match cat.as_str() {
                    "food" => "food",
                    "transport" => "transport",
                    "shopping" => "shopping",
                    "bills" => "bills",
                    "health" => "health",
                    _ => "transfer",
                };
            }
        }

        "transfer"
    }
}
