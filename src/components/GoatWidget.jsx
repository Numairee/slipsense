import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import PygmyGoat from './PygmyGoat';
import { sound } from '../utils/sound';
import { Flame, Heart, Sparkles, Utensils } from 'lucide-react';

const GOAT_QUOTES = [
  'งั่มๆๆ สลิปใบนี้กรอบอร่อยจัง! ขอบคุณน้าา 🐐✨',
  'แบะๆๆ วันนี้ใช้เงินคุ้มค่าดีมากเลย!',
  'บันทึกรายจ่ายครบทุกวัน กระเป๋าตังค์ไม่รั่วไหลแน่นอน!',
  'สลิปอร่อยจัง... ยังมีอีกมั้ยน้า ปิ๊กมี่ยังไม่อิ่มเลย แบะๆ',
  'สแกนสลิปทุกครั้ง ปิ๊กมี่ช่วยจำให้ ไม่ต้องปวดหัวจดเอง!',
  'เก่งมากเลย! รักษาสถิติต่อเนื่องแบบนี้ กระเป๋าตังค์ตุงแน่นอน 💰',
  'ปิ๊กมี่แอบดูอยู่... วันนี้กินชานมไข่มุกไปกี่แก้วแล้วนะ! 🧋',
  'No-Track ของแท้ ข้อมูลอยู่แค่ในเครื่องนี้ ปลอดภัย 100% สบายใจได้เล้ย!'
];

export default function GoatWidget({ goatState, onFeedGoat, onOpenGoatRoom }) {
  const [speech, setSpeech] = useState(
    goatState?.mood === 'hungry'
      ? 'หิวสลิปจังเลย... วันนี้ยังไม่ได้กินเลย แบะๆ 🥺'
      : 'วันนี้ปิ๊กมี่อิ่มสบายท้อง! สแกนสลิปเพิ่มได้ตลอดเลยน้า 🐐'
  );
  const [isChewing, setIsChewing] = useState(false);

  const handlePetOrFeed = () => {
    sound.playCrunch();
    setTimeout(() => sound.playGoatBaa(), 250);

    // Trigger sweet confetti burst from goat
    confetti({
      particleCount: 25,
      spread: 60,
      origin: { y: 0.35, x: 0.5 },
      colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899']
    });

    setIsChewing(true);
    setTimeout(() => setIsChewing(false), 1200);

    const randomQuote = GOAT_QUOTES[Math.floor(Math.random() * GOAT_QUOTES.length)];
    setSpeech(randomQuote);

    if (onFeedGoat) {
      onFeedGoat(1);
    }
  };

  const hunger = goatState?.hungerLevel ?? 80;
  const streak = goatState?.streakDays ?? 1;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-amber-500/10 via-white to-white border border-amber-500/20 p-4 shadow-sm mb-4">
      <div className="flex items-center gap-3">
        {/* Goat Avatar */}
        <div className="relative shrink-0">
          <PygmyGoat
            mood={isChewing ? 'eating' : (goatState?.mood || 'happy')}
            size={88}
            onClick={handlePetOrFeed}
          />
          {streak > 0 && (
            <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-xs">
              <Flame className="w-2.5 h-2.5 fill-current" />
              {streak}d
            </span>
          )}
        </div>

        {/* Speech Bubble & Interaction */}
        <div className="flex-1 min-w-0">
          <div className="relative bg-white border border-amber-500/20 rounded-2xl p-2.5 shadow-xs mb-2 text-neutral-800 text-xs leading-relaxed font-medium">
            {speech}
            {/* Small speech arrow pointing left to goat */}
            <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 bg-white border-l border-b border-amber-500/20 rotate-45" />
          </div>

          <div className="flex items-center justify-between gap-2">
            {/* Hunger / Energy Bar */}
            <div className="flex-1">
              <div className="flex items-center justify-between text-[10px] text-neutral-500 font-medium mb-1">
                <span>ความอิ่มของปิ๊กมี่</span>
                <span className="font-bold text-amber-600">{hunger}%</span>
              </div>
              <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden border border-neutral-200/60">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(10, hunger))}%` }}
                />
              </div>
            </div>

            {/* Quick Feed button */}
            <button
              onClick={handlePetOrFeed}
              className="shrink-0 flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white shadow-xs transition-all"
            >
              <Utensils className="w-3 h-3" />
              ให้อาหาร
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
