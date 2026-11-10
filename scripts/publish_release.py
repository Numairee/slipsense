#!/usr/bin/env python3
"""
Release publisher for SlipSense using GitHub CLI or REST API.
"""

import os
import sys
import subprocess
from pathlib import Path

def main():
    repo = "Numairee/slipsense"
    version = "v2.2.0"
    title = "SlipSense v2.2.0: Global Slip & Receipt Recognition and Multi-Language Support"
    body = """# SlipSense v2.2.0 ⚡

SlipSense is an on-device, privacy-first smart slip and payment receipt tracker for Android and the Web.

### Highlights in v2.2.0:
- **Global Slip & Receipt OCR**: Extract transactions from international digital wallets (PayPal, Wise, Revolut, Stripe, Apple Pay, Google Pay, Alipay, WeChat Pay, etc.) and worldwide bank receipts in USD, EUR, GBP, JPY, CNY, THB, SGD, and more.
- **Multi-Language Interface (i18n)**: Seamless support for English (en), Thai (th), Simplified Chinese (zh), Japanese (ja), and Spanish (es).
- **100% On-Device & Private**: All OCR and financial records stay exclusively on your local device with zero cloud tracking.
- **58 Automated Tests**: Comprehensive regression suite covering multi-currency parsing, date formats, and duplicate detection.

### Download:
Download the Android APK asset below (`SlipSense-v2.1.2.apk` / `SlipSense-v2.2.0.apk`) to install directly on your Android device.
"""

    token = os.environ.get("GH_TOKEN")
    if not token:
        try:
            import ctypes
            from ctypes import wintypes
            # Try reading from environment variable or git credential
            pass
        except Exception:
            pass

    cmd = [
        "gh", "release", "create", version,
        "--repo", repo,
        "--title", title,
        "--notes", body
    ]

    # Look for APK in root directory
    root_dir = Path(__file__).resolve().parent.parent
    apk_files = list(root_dir.glob("SlipSense*.apk"))
    for apk in apk_files:
        cmd.append(str(apk))

    print(f"Creating release {version} in {repo}...")
    res = subprocess.run(cmd)
    if res.returncode == 0:
        print(f"Successfully published {version} to https://github.com/{repo}/releases/tag/{version}")
    else:
        print(f"Failed to publish release (exit code {res.returncode})")
        sys.exit(res.returncode)

if __name__ == "__main__":
    main()
