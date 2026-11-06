import os
import qrcode
from PIL import Image, ImageDraw, ImageFont

OUTPUT_DIR = "test_slips_output"
os.makedirs(OUTPUT_DIR, exist_ok=True)

FONT_PATH = "C:/Windows/Fonts/tahoma.ttf"

def get_font(size):
    try:
        return ImageFont.truetype(FONT_PATH, size)
    except:
        return ImageFont.load_default()

def create_bank_slip(filename, bank_name, header_bg, date_str, sender, payee, amount_str, ref_id, qr_payload):
    w, h = 720, 1100
    img = Image.new("RGB", (w, h), (248, 249, 250))
    draw = ImageDraw.Draw(img)

    # 1. Header Band
    draw.rectangle([0, 0, w, 180], fill=header_bg)
    font_header = get_font(38)
    font_sub = get_font(26)
    font_bold = get_font(32)
    font_normal = get_font(24)
    font_small = get_font(20)

    # Bank App Name
    draw.text((40, 45), bank_name, fill=(255, 255, 255), font=font_header)
    draw.text((40, 105), "โอนเงินสำเร็จ", fill=(255, 255, 255), font=font_sub)

    # 2. Card Container
    card_margin = 30
    draw.rounded_rectangle([card_margin, 210, w - card_margin, h - 40], radius=24, fill=(255, 255, 255), outline=(225, 229, 235), width=2)

    # Date Time
    draw.text((60, 240), date_str, fill=(130, 140, 150), font=font_small)

    # Sender Info
    y = 290
    draw.text((60, y), "จาก", fill=(130, 140, 150), font=font_small)
    draw.text((60, y + 25), sender, fill=(30, 35, 42), font=font_bold)

    # Arrow Down
    y += 85
    draw.text((60, y), "↓", fill=(100, 110, 120), font=font_bold)

    # Payee Info
    y += 45
    draw.text((60, y), "ไปยัง", fill=(130, 140, 150), font=font_small)
    draw.text((60, y + 25), payee, fill=(30, 35, 42), font=font_bold)

    # Divider line
    y += 85
    draw.line([60, y, w - 60, y], fill=(230, 235, 240), width=2)

    # Amount
    y += 25
    draw.text((60, y), "จำนวนเงิน", fill=(130, 140, 150), font=font_normal)
    draw.text((60, y + 35), f"{amount_str} บาท", fill=(15, 23, 42), font=ImageFont.truetype(FONT_PATH, 44))

    # Fee & Ref
    y += 105
    draw.text((60, y), "ค่าธรรมเนียม: 0.00 บาท", fill=(130, 140, 150), font=font_small)
    draw.text((60, y + 30), f"เลขที่รายการ: {ref_id}", fill=(130, 140, 150), font=font_small)

    # 3. QR Code (BOT / ITMX SlipVerify)
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=5,
        border=2,
    )
    qr.add_data(qr_payload)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="black", back_color="white")

    # Center QR at bottom
    qr_size = 230
    qr_img_resized = qr_img.resize((qr_size, qr_size))
    qr_x = (w - qr_size) // 2
    qr_y = y + 75
    img.paste(qr_img_resized, (qr_x, qr_y))

    # Text under QR
    draw.text((qr_x + 35, qr_y + qr_size + 10), "สแกนเพื่อตรวจสอบสลิป", fill=(150, 160, 170), font=font_small)

    out_path = os.path.join(OUTPUT_DIR, filename)
    img.save(out_path, quality=95)
    print(f"Generated slip: {out_path}")
    return out_path

def create_supermarket_receipt(filename):
    w, h = 600, 900
    img = Image.new("RGB", (w, h), (250, 250, 250))
    draw = ImageDraw.Draw(img)

    f_bold = get_font(28)
    f_norm = get_font(22)
    f_small = get_font(18)

    draw.text((180, 40), "7-ELEVEN THAILAND", fill=(20, 20, 20), font=f_bold)
    draw.text((210, 80), "TAX INVOICE / RECEIPT", fill=(100, 100, 100), font=f_small)
    draw.text((190, 110), "DATE: 07/03/2026 15:30", fill=(100, 100, 100), font=f_small)

    draw.line([40, 140, w - 40, 140], fill=(200, 200, 200), width=2)

    items = [
        ("MEIJI MILK 830ML", "45.00"),
        ("SANDWICH HAM CHEESE", "35.00"),
        ("MINERAL WATER 1.5L", "15.00"),
        ("SUNSCREEN SPF50+", "240.00"),
        ("CRISPY CHIPS 3X", "115.00")
    ]

    y = 170
    for name, price in items:
        draw.text((50, y), name, fill=(30, 30, 30), font=f_norm)
        draw.text((480, y), price, fill=(30, 30, 30), font=f_norm)
        y += 40

    draw.line([40, y + 20, w - 40, y + 20], fill=(200, 200, 200), width=2)
    y += 50
    draw.text((50, y), "TOTAL AMOUNT:", fill=(10, 10, 10), font=f_bold)
    draw.text((450, y), "450.00", fill=(10, 10, 10), font=f_bold)

    y += 50
    draw.text((50, y), "CASH TENDERED: 500.00", fill=(80, 80, 80), font=f_norm)
    y += 30
    draw.text((50, y), "CHANGE: 50.00", fill=(80, 80, 80), font=f_norm)

    out_path = os.path.join(OUTPUT_DIR, filename)
    img.save(out_path, quality=90)
    print(f"Generated receipt: {out_path}")
    return out_path

def create_sale_meme(filename):
    w, h = 600, 600
    img = Image.new("RGB", (w, h), (255, 230, 0))
    draw = ImageDraw.Draw(img)

    f_big = get_font(52)
    f_sub = get_font(36)

    draw.rectangle([20, 20, w-20, h-20], fill=(255, 60, 60))
    draw.text((80, 100), "SPECIAL SALE!", fill=(255, 255, 0), font=f_big)
    draw.text((60, 220), "ONLY 99.00 BAHT", fill=(255, 255, 255), font=f_big)
    draw.text((120, 340), "LIMITED TIME OFFER", fill=(255, 255, 255), font=f_sub)
    draw.text((150, 440), "FREE SHIPPING", fill=(255, 255, 0), font=f_sub)

    out_path = os.path.join(OUTPUT_DIR, filename)
    img.save(out_path, quality=90)
    print(f"Generated sale meme: {out_path}")
    return out_path

if __name__ == "__main__":
    # Real ITMX SlipVerify QR codes:
    # KBank (004): 00460006000001010300402250140221345520338785102TH9104A1B2
    create_bank_slip(
        filename="slip_kbank_150.jpg",
        bank_name="K PLUS",
        header_bg=(0, 169, 80),
        date_str="07 มี.ค. 69 10:24 น.",
        sender="นาย กิตติพงษ์ (xxx-x-x1234-x)",
        payee="ร้าน ป้าพร อาหารตามสั่ง (xxx-x-x5678-x)",
        amount_str="150.00",
        ref_id="014022134552033878",
        qr_payload="00460006000001010300402250140221345520338785102TH9104A1B2"
    )

    # SCB (014): 00460006000001010301402202026030711159988775102TH91045E8F
    create_bank_slip(
        filename="slip_scb_65.jpg",
        bank_name="SCB EASY",
        header_bg=(78, 42, 132),
        date_str="07 มี.ค. 69 11:15 น.",
        sender="นาย สมชาย (xxx-xxx123-4)",
        payee="ร้าน Cafe Amazon (xxx-xxx789-0)",
        amount_str="65.00",
        ref_id="202603071115998877",
        qr_payload="00460006000001010301402202026030711159988775102TH91045E8F"
    )

    # KTB (006): 004600060000010103006022020260307991122335102TH91047D1C
    create_bank_slip(
        filename="slip_ktb_320.jpg",
        bank_name="Krungthai NEXT",
        header_bg=(0, 165, 229),
        date_str="07 มี.ค. 69 12:40 น.",
        sender="นาย มีชัย (xxx-x-x9988-x)",
        payee="พร้อมเพย์ 081-xxx-5555",
        amount_str="320.00",
        ref_id="KTB2026030799112233",
        qr_payload="004600060000010103006022020260307991122335102TH91047D1C"
    )

    # Non-Slips
    create_supermarket_receipt("receipt_7eleven_450.jpg")
    create_sale_meme("meme_price_99.jpg")
    print("Done creating test images!")
