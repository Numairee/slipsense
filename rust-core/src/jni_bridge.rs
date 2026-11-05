use jni::JNIEnv;
use jni::objects::{JClass, JString};
use jni::sys::jstring;
use crate::slip_parser::SlipParser;
use crate::categorizer::Categorizer;
use crate::security::SecurityEngine;

/// JNI: Parse raw text from slip image and return JSON string
#[no_mangle]
pub extern "system" fn Java_com_pygmy_notrack_RustCore_parseSlipText(
    mut env: JNIEnv,
    _class: JClass,
    input: JString,
) -> jstring {
    let input_str: String = match env.get_string(&input) {
        Ok(s) => s.into(),
        Err(_) => return env.new_string("").unwrap().into_raw(),
    };

    let parser = SlipParser::new();
    let categorizer = Categorizer::new();

    let mut slip = parser.parse_ocr_text(&input_str);
    slip.category_id = categorizer.categorize(&slip.payee, "").to_string();

    let json = serde_json::to_string(&slip).unwrap_or_else(|_| "{}".to_string());
    env.new_string(json).unwrap().into_raw()
}

/// JNI: Compute SHA-256 fingerprint for slip deduplication
#[no_mangle]
pub extern "system" fn Java_com_pygmy_notrack_RustCore_computeSlipHash(
    mut env: JNIEnv,
    _class: JClass,
    bank_id: JString,
    amount: f64,
    date: JString,
    time: JString,
    ref_code: JString,
) -> jstring {
    let b: String = env.get_string(&bank_id).map(|s| s.into()).unwrap_or_default();
    let d: String = env.get_string(&date).map(|s| s.into()).unwrap_or_default();
    let t: String = env.get_string(&time).map(|s| s.into()).unwrap_or_default();
    let r: String = env.get_string(&ref_code).map(|s| s.into()).unwrap_or_default();

    let hash = SecurityEngine::compute_slip_hash(&b, amount, &d, &t, &r);
    env.new_string(hash).unwrap().into_raw()
}
