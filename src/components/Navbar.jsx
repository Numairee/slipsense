import React from 'react';
import { Home, PieChart, Receipt, Settings } from 'lucide-react';
import { sound } from '../utils/sound';

export default function Navbar({ activeTab, onChangeTab, goatState }) {
  const tabs = [
    { id: 'home', label: 'หน้าแรก', icon: Home },
    { id: 'stats', label: 'สถิติ', icon: PieChart },
    { id: 'goat', label: 'ปิ๊กมี่', customIcon: '🐐' },
    { id: 'history', label: 'รายการ', icon: Receipt },
    { id: 'settings', label: 'ตั้งค่า', icon: Settings },
  ];

  const handleTabClick = (id) => {
    sound.playPop();
    onChangeTab(id);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200/70 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2 px-3 shadow-lg transition-all">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 rounded-2xl transition-all relative select-none ${
                isActive ? 'text-neutral-900 font-bold' : 'text-neutral-400 hover:text-neutral-600'
              }`}
            >
              {tab.customIcon ? (
                <div className="relative">
                  <span className={`text-xl transition-transform ${isActive ? 'scale-115' : 'grayscale-50'}`}>
                    {tab.customIcon}
                  </span>
                  {goatState?.mood === 'hungry' && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  )}
                </div>
              ) : (
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'
                  }`}
                />
              )}

              <span className={`text-[10px] mt-1 tracking-tight ${isActive ? 'font-extrabold text-neutral-900' : 'font-medium'}`}>
                {tab.label}
              </span>

              {/* Active pill dot indicator */}
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-neutral-900 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
