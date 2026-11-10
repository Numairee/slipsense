import React from 'react';
import { Home, BarChart3, Target, Receipt, Settings } from 'lucide-react';
import { sound } from '../utils/sound';
import { useI18n } from '../i18n/index.jsx';

export default function Navbar({ activeTab, onChangeTab }) {
  const { t } = useI18n();

  const tabs = [
    { id: 'home', label: t('tabHome'), icon: Home },
    { id: 'analytics', label: t('tabAnalytics'), icon: BarChart3 },
    { id: 'budgets', label: t('tabBudgets'), icon: Target },
    { id: 'history', label: t('tabHistory'), icon: Receipt },
    { id: 'settings', label: t('tabSettings'), icon: Settings },
  ];

  const handleTabClick = (id) => {
    sound.playPop();
    onChangeTab(id);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#080C14]/95 backdrop-blur-md border-t border-neutral-800 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2 px-3 shadow-2xl transition-all">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 rounded-2xl transition-all relative select-none ${
                isActive ? 'text-cyan-400 font-bold' : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-115 text-cyan-400 stroke-[2.4]' : 'stroke-[1.8]'
                  }`}
                />
              </div>

              <span className={`text-[10px] mt-1 tracking-tight ${
                isActive ? 'font-black text-cyan-300' : 'font-medium'
              }`}>
                {tab.label}
              </span>

              {/* Active pill dot indicator */}
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/80 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
