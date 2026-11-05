import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import PygmyGoat from './PygmyGoat';
import { sound } from '../utils/sound';
import { Flame, Utensils } from 'lucide-react';

const GOAT_QUOTES = [
  'งั่มๆๆ สลิปใบนี้กรอบอร่อยจัง! ขอบคุณน้าา 🐐✨',
  'แบะๆๆ วันนี้ใช้เงินคุ้มค่าดีมากเลย!',
  'บันทึกรายจ่ายครบทุกวัน กระเป๋าตังค์ไม่รั่วไหลแน่นอน!',
  'สลิปอร่อยจัง... ยังมีอีกมั้ยน้า ปิ๊กมี่ยังไม่อิ่มเลย แบะๆ',
  'สแกนสลิปทุกครั้ง ปิ๊กมี่ช่วยจำให้ ไม่ต้องปวดหัวจดเอง!',
  'เก่งมากเลย! รักษาสถิติต่อเนื่องแบบนี้ กระเป๋าตังค์ตุงแน่นอน 💰',
  'No-Track ของแท้ ข้อมูลอยู่แค่ในเครื่องนี้ ปลอดภัย 100%!'
];

export default function GoatWidget({ goatState, onFeedGoat, onOpenGoatRoom }) {
  const [speech, setSpeech] = useState(
    goatState?.mood === 'hungry'
      ? 'หิวสลิปจังเลย... วันนี้ยังไม่ได้กินเลย แบะๆ 🥺'
      : 'วันนี้ปิ๊กมี่อิ่มสบายท้อง! กวาดสลิปเพิ่มได้ตลอดเลยน้า 🐐'
  );
  const [isChewing, setIsChewing] = useState(false);

  const handlePetOrFeed = () => {
    sound.playCrunch();
    setTimeout(() => sound.playGoatBaa(), 250);

    confetti({
      particleCount: 22,
      spread: 55,
      origin: { y: 0.3, x: 0.5 },
      colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899']
    });

    setIsChewing(true);
    setTimeout(() => setIsChewing(false), 1100);

    const randomQuote = GOAT_QUOTES[Math.floor(Math.random() * GOAT_QUOTES.length)];
    setSpeech(randomQuote);

    if (onFeedGoat) {
      onFeedGoat(1);
    }
  };

  const hunger = goatState?.hungerLevel ?? 85;
  const streak = goatState?.streakDays ?? 1;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white border border-amber-500/25 p-3 shadow-2xs flex items-center gap-3">
      {/* Goat Avatar */}
      <div className="relative shrink-0" onClick={onOpenGoatRoom}>
        <PygmyGoat
          mood={isChewing ? 'eating' : (goatState?.mood || 'happy')}
          size={64}
          onClick={handlePetOrFeed}
        />
        {streak > 0 && (
          <span className="absolute -bottom-0.5 -right-0.5 bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-2xs">
            <Flame className="w-2.5 h-2.5 fill-current" />
            {streak}d
          </span>
        )}
      </div>

      {/* Speech & Hunger Bar */}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-neutral-800 leading-snug line-clamp-2 mb-1.5">
          “{speech}”
        </p>

        <div className="flex items-center gap-2.5">
          <div className="flex-1">
            <div className="flex items-center justify-between text-[9px] text-neutral-500 font-semibold mb-0.5">
              <span>ความอิ่มน้องปิ๊กมี่</span>
              <span className="font-bold text-amber-600">{hunger}%</span>
            </div>
            <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden border border-neutral-200/60">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(10, hunger))}%` }}
              />
            </div>
          </div>

          <button
            onClick={handlePetOrFeed}
            className="shrink-0 flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white shadow-2xs transition-all"
          >
            <Utensils className="w-3 h-3" />
            ให้อาหาร
          </button>
        </div>
      </div>
    </div>
  );
}
