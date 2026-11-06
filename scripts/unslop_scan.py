#!/usr/bin/env python3
"""
Unslop prose scanner for Pygmy Android.
Applies the Unslop core contract (crisp preset) to detect AI-writing patterns,
hyperbolic claims, and hollow marketing jargon in both Thai and English.
"""

import sys
import os
import re
from pathlib import Path

# Ensure UTF-8 console output on Windows
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# AI tells, hollow marketing fluff, and robotic expressions
PATTERNS = [
    # English AI tells & hyperbolic claims
    (r"\b100%\s+feature\s+parity\b", "Inflated claim", "Replace with specific supported features"),
    (r"\bgame[- ]changer\b", "AI buzzword", "Explain the actual mechanism or effect"),
    (r"\bdelve(?:s|d|ing)?\b", "AI tell", "Use examine, look into, or remove"),
    (r"\bin\s+today's(?:\s+fast[- ]paced)?\b", "Filler opener", "Remove introductory fluff"),
    (r"\bseamlessly\b", "Vague praise", "Describe how it works or remove"),
    (r"\btestament\b", "AI cliché", "State the fact directly"),
    (r"\btapestry\b", "AI cliché", "Use combination, mix, or remove"),
    (r"\bembark(?:s|ed|ing)?\b", "AI cliché", "Use start, begin, or launch"),
    (r"\bharness(?:es|ed|ing)?\b", "AI buzzword", "Use use, apply, or run"),
    (r"\brevolutioniz(?:e|es|ed|ing)\b", "Hyperbole", "State the concrete change"),
    (r"\bcutting[- ]edge\b", "Hyperbole", "Specify the exact technology"),

    # Thai AI tells & promotional hyperbole
    (r"เสมือนแอปแท้ทุกประการ", "Hype / Artificial marketing", "ใช้คำอธิบายตรงไปตรงมา เช่น 'เปิดใช้งานแบบเต็มจอ'"),
    (r"สถาบันการเงินชั้นนำ", "Hollow fluff", "ใช้ 'สลิปธนาคารและ e-Wallet ในไทย'"),
    (r"อัจฉริยะ", "Inflated buzzword (Smart/Intelligent)", "ระบุหน้าที่ตรงๆ เช่น 'จดจำอัตโนมัติ' หรือ 'คัดกรอง'"),
    (r"สมบูรณ์แบบ", "Hyperbole", "ตัดออกหรือระบุฟังก์ชันที่แท้จริง"),
    (r"อย่างไร้รอยต่อ", "AI cliché (Seamlessly)", "ตัดออกหรืออธิบายการทำงานจริง"),
    (r"ในยุคดิจิทัล", "AI opener", "ตัดคำเกริ่นฟุ่มเฟือยออก"),
    (r"ก้าวสู่อีกระดับ", "Marketing fluff", "ตัดออก"),
    (r"ตอบโจทย์(?:ทุกความต้องการ)?", "Corporate marketing fluff", "ระบุการทำงานหรือตัดออก"),
    (r"100%\s+Feature\s+Parity", "Unrealistic claim", "ระบุรายการฟังก์ชันที่รองรับตามจริง"),
]

def scan_file(filepath: Path) -> int:
    text = filepath.read_text(encoding="utf-8")
    lines = text.splitlines()
    violations = []

    for line_idx, line in enumerate(lines, 1):
        # Skip pure code block fence lines
        if line.strip().startswith("```"):
            continue

        for regex, category, suggestion in PATTERNS:
            for match in re.finditer(regex, line, re.IGNORECASE):
                violations.append({
                    "line": line_idx,
                    "matched": match.group(0),
                    "category": category,
                    "suggestion": suggestion,
                    "context": line.strip()
                })

    print(f"\n🔍 Scanning: {filepath.name}")
    if not violations:
        print("  ✅ Clean! No AI slop or inflated buzzwords detected.")
        return 0

    print(f"  ⚠️  Found {len(violations)} pattern(s):")
    for v in violations:
        print(f"    - Line {v['line']}: \"{v['matched']}\" [{v['category']}]")
        print(f"      Advice: {v['suggestion']}")
        print(f"      Context: {v['context'][:80]}...")
    return len(violations)

def main():
    target_files = sys.argv[1:]
    if not target_files:
        # Default scan target files
        repo_root = Path(__file__).resolve().parent.parent
        target_files = [
            repo_root / "README.md",
            repo_root / "src" / "components" / "InstallPrompt.jsx",
            repo_root / "src" / "views" / "SettingsView.jsx"
        ]
    else:
        target_files = [Path(f) for f in target_files]

    total_violations = 0
    for f in target_files:
        if f.exists():
            total_violations += scan_file(f)
        else:
            print(f"File not found: {f}")

    print("\n" + "="*50)
    if total_violations == 0:
        print("🎉 Unslop verification passed: All files adhere to the Crisp contract!")
        sys.exit(0)
    else:
        print(f"❌ Unslop check failed: {total_violations} issue(s) remaining.")
        sys.exit(1)

if __name__ == "__main__":
    main()
