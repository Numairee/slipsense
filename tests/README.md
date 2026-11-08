Run `npm test` for OCR text parsing, QR structure, duplicates and storage regression tests. Synthetic OCR text in `amount-cases.tsv` is used by both JavaScript and Android amount parsers. No real banking data is included.

PR CI compiles the Java helpers and runs `tests/SlipAmountParserTest.java`, including all shared amount fixtures. A production web build is checked separately.

Before release, check original Thai/English bank slips, screenshots and camera photos on an Android device. Compare amounts, fees, dates, recipient and bank against the image. Try duplicate selections, separate transfers at the same minute, and OCR timeouts. QR metadata does not verify that a payment was completed.

Native ML Kit still uses its existing Latin recognizer, so Thai-only names may need correction. Web Tesseract needs language resources on first use. Text regression tests do not measure image OCR accuracy. Browser visual testing and a full APK/device test remain required.
