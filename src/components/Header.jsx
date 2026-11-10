import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ShieldCheck, Zap, Globe } from 'lucide-react';
import { AutoScanner } from '../utils/galleryAutoScanner';
import { useI18n } from '../i18n/index.jsx';

export default function Header({
  currentDate,
  onPrevMonth,
  onNextMonth,
  onResetMonth,
  onOpenPrivacyInfo
}) {
  const { t, language, setLanguage, supportedLanguages } = useI18n();
  const [showLangMenu, setShowLangMenu] = useState(false);

  const monthIdx = currentDate.getMonth();
  const yearDisplay = language === 'th' ? currentDate.getFullYear() + 543 : currentDate.getFullYear();
  const months = t('months');
  const monthName = Array.isArray(months) ? months[monthIdx] : '';
  const now = new Date();
  const isCurrentMonth = currentDate.getFullYear() === now.getFullYear() && currentDate.getMonth() === now.getMonth();
  const isNative = AutoScanner.isNative();

  const currentLangObj = supportedLanguages.find(l => l.code === language) || supportedLanguages[0];

  return (
    <header
      className={`sticky top-0 z-30 bg-[#080C14]/90 backdrop-blur-md pb-2.5 px-4 border-b border-neutral-800 transition-all ${
        isNative ? 'pt-[max(calc(env(safe-area-inset-top,0px)+10px),36px)]' : 'pt-3'
      }`}
    >
      <div className="max-w-md mx-auto flex items-center justify-between gap-2">
        {/* Brand */}
        <div
          onClick={onOpenPrivacyInfo}
          className="flex items-center gap-2.5 cursor-pointer select-none"
        >
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-cyan-500/20 to-blue-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-md">
            <Zap className="w-5 h-5 fill-cyan-400 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-black text-base tracking-tight text-white leading-none">
                SlipSense
              </h1>
              <span className="text-[9px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-0.5">
                <ShieldCheck className="w-2.5 h-2.5" />
                {t('noTrackBadge')}
              </span>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700">
                v2.2.0
              </span>
            </div>
            <p className="text-[10px] text-neutral-400 font-medium mt-0.5">
              {t('appSubtitle')}
            </p>
          </div>
        </div>

        {/* Right Controls: Language Pill + Month Selector */}
        <div className="flex items-center gap-1.5">
          {/* Quick Language Selector */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1 px-2 py-1 rounded-xl bg-neutral-900 border border-neutral-800 text-[11px] font-bold text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors active:scale-95 shadow-sm"
              title={t('languageSection')}
            >
              <span>{currentLangObj.flag}</span>
              <span className="text-[10px] uppercase font-mono">{currentLangObj.code}</span>
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-1.5 w-36 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-1.5 z-50 animate-fade-in">
                {supportedLanguages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLanguage(l.code);
                      setShowLangMenu(false);
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors text-left ${
                      language === l.code
                        ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                        : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                    }`}
                  >
                    <span>{l.flag}</span>
                    <span>{l.nativeName}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Month Selector Pill */}
          <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-2xl shadow-md p-0.5">
            <button
              onClick={onPrevMonth}
              className="w-6 h-6 flex items-center justify-center text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors active:scale-90"
              title={t('prevMonth')}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <div
              onClick={onResetMonth}
              className="px-1.5 py-0.5 text-center select-none cursor-pointer hover:bg-neutral-800 rounded-lg transition-colors min-w-[68px]"
              title={t('currentMonthTip')}
            >
              <div className="text-[10px] font-extrabold text-white leading-tight">
                {monthName}
              </div>
              <div className="text-[9px] font-semibold text-neutral-400 leading-tight flex items-center justify-center gap-1">
                <span>{yearDisplay}</span>
                {!isCurrentMonth && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                )}
              </div>
            </div>

            <button
              onClick={onNextMonth}
              className="w-6 h-6 flex items-center justify-center text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors active:scale-90"
              title={t('nextMonth')}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
