import React, { useState } from 'react';
import PygmyGoat from '../components/PygmyGoat';
import { Flame, Heart, Sparkles, Utensils, Award, Smile, Coffee, Carrot } from 'lucide-react';
import { sound } from '../utils/sound';
import confetti from 'canvas-confetti';

const SNACKS = [
  { id: 'slip', name: 'สลิปโอนเงิน', icon: '🧾', energy: 25, sound: 'crunch' },
  { id: 'grass', name: 'หญ้าหวานสด', icon: '🌿', energy: 15, sound: 'crunch' },
  { id: 'carrot', name: 'เบบี้แครอท', icon: '🥕', energy: 20, sound: 'crunch' },
  { id: 'coffee', name: 'กาแฟเย็น', icon: '🧋', energy: 10, sound: 'crunch' },
];

export default function GoatView({ goatState, onFeedGoat, onOpenScanModal }) {
  const [activeMood, setActiveMood] = useState('happy');
  const [speech, setSpeech] = useState(
    'สวัสดีฮับ! ผมคือน้องปิ๊กมี่ แพะแคระกินสลิป ยินดีที่ได้ช่วยคุมรายจ่ายให้น้า แบะๆ 🐐'
  );

  const handleFeedSnack = (snack) => {
    sound.playCrunch();
    setActiveMood('eating');

    confetti({
      particleCount: 30,
      spread: 70,
      origin: { y: 0.4 }
    });

    setTimeout(() => {
      sound.playGoatBaa();
      setActiveMood('super');
      setSpeech(`งั่มๆๆ! กิน ${snack.name} อร่อยมากกกก! พลังงาน +${snack.energy}% เลย แบะๆ ✨`);
    }, 500);

    setTimeout(() => {
      setActiveMood('happy');
    }, 1800);

    if (onFeedGoat) {
      onFeedGoat(1);
    }
  };

  const handlePet = () => {
    sound.playGoatBaa();
    setActiveMood('super');
    setSpeech('คิกๆ จั๊กจี้จังเลย ขอบคุณที่ลูบหัวปิ๊กมี่น้าา ❤️');
    setTimeout(() => setActiveMood('happy'), 1500);
  };

  const streak = goatState?.streakDays || 1;
  const eaten = goatState?.totalSlipsEaten || 15;
  const hunger = goatState?.hungerLevel || 85;

  return (
    <div className="space-y-4 pb-20 animate-fade-in">
      {/* Main Goat Stage */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-amber-400/20 via-amber-100/30 to-white p-6 border border-amber-500/20 shadow-sm text-center flex flex-col items-center">
        {/* Streak & Status Badges */}
        <div className="w-full flex items-center justify-between mb-2">
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500 text-white font-extrabold text-xs shadow-xs">
            <Flame className="w-3.5 h-3.5 fill-current" />
            สถิติต่อเนื่อง {streak} วัน
          </span>

          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
            <Smile className="w-3.5 h-3.5" />
            อารมณ์ดีมาก
          </span>
        </div>

        {/* Speech Bubble */}
        <div className="relative max-w-xs my-3 bg-white border border-amber-500/20 rounded-2xl px-4 py-2.5 shadow-xs text-xs font-semibold text-neutral-800 leading-relaxed">
          {speech}
          {/* Arrow */}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r border-b border-amber-500/20 rotate-45" />
        </div>

        {/* Big Goat Character */}
        <div className="my-2">
          <PygmyGoat
            mood={activeMood}
            size={160}
            onClick={handlePet}
          />
        </div>

        <p className="text-[11px] text-neutral-400 font-medium mb-3">
          แตะที่ตัวปิ๊กมี่เพื่อลูบหัว หรือเลือกขนมด้านล่างให้กินได้เลย!
        </p>

        {/* Hunger Bar */}
        <div className="w-full max-w-xs bg-white/80 backdrop-blur-xs p-3 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-neutral-700 mb-1.5">
            <span>ความอิ่มท้อง (Fullness)</span>
            <span className="text-amber-600 font-mono">{hunger}%</span>
          </div>
          <div className="w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden border border-neutral-200">
            <div
              className="h-full bg-gradient-to-r from-amber-400 via-amber-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(10, hunger))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Snack Bar Section */}
      <div className="bg-white rounded-3xl p-4 border border-neutral-200/80 shadow-xs">
        <h4 className="font-extrabold text-xs text-neutral-900 mb-2.5 flex items-center gap-1.5">
          <Utensils className="w-4 h-4 text-amber-500" />
          เมนูอาหารว่างให้น้องปิ๊กมี่
        </h4>

        <div className="grid grid-cols-2 gap-2">
          {SNACKS.map((snack) => (
            <button
              key={snack.id}
              onClick={() => handleFeedSnack(snack)}
              className="flex items-center justify-between p-3 rounded-2xl border border-neutral-200/80 hover:border-amber-400 hover:bg-amber-50/50 active:scale-95 transition-all text-left group"
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl group-hover:scale-110 transition-transform">
                  {snack.icon}
                </span>
                <div>
                  <div className="text-xs font-bold text-neutral-800">
                    {snack.name}
                  </div>
                  <div className="text-[10px] text-amber-600 font-semibold">
                    +{snack.energy}% พลังงาน
                  </div>
                </div>
              </div>
              <span className="text-xs font-bold text-neutral-400 group-hover:text-amber-500">
                ป้อน 😋
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Slips Eaten Milestone Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-3.5 border border-neutral-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-xl">
            🧾
          </div>
          <div>
            <div className="text-lg font-black font-mono text-neutral-900">
              {eaten} <span className="text-xs font-normal text-neutral-500">ใบ</span>
            </div>
            <div className="text-[10px] text-neutral-400">สลิปที่เคี้ยวไปแล้ว</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-neutral-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center text-xl">
            🏆
          </div>
          <div>
            <div className="text-lg font-black font-mono text-neutral-900">
              Level 4
            </div>
            <div className="text-[10px] text-neutral-400">นักเซฟเงินมือโปร</div>
          </div>
        </div>
      </div>
    </div>
  );
}
