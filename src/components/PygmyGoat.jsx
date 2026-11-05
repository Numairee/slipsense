import React, { useState } from 'react';

/**
 * Interactive Pygmy Goat Mascot (น้องปิ๊กมี่ 🐐)
 * Fully scalable SVG with cute idle blinking, chewing animation, and emotions
 */
export default function PygmyGoat({
  mood = 'happy', // 'hungry' | 'happy' | 'super' | 'eating'
  size = 120,
  onClick,
  showSpeech = true,
  speechText = '',
}) {
  const [isWinking, setIsWinking] = useState(false);

  const handleClick = (e) => {
    setIsWinking(true);
    setTimeout(() => setIsWinking(false), 800);
    if (onClick) onClick(e);
  };

  return (
    <div
      onClick={handleClick}
      className="relative flex flex-col items-center justify-center cursor-pointer select-none group transition-transform active:scale-95"
      style={{ width: size, height: size }}
      title="แตะเพื่อทักทายน้องปิ๊กมี่!"
    >
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full drop-shadow-md transition-transform duration-300 group-hover:scale-105"
      >
        <defs>
          <linearGradient id="goatBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f1f3f5" />
          </linearGradient>
          <linearGradient id="goatHorn" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#d4af37" />
            <stop offset="100%" stopColor="#aa8c2c" />
          </linearGradient>
          <linearGradient id="goatBlush" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffb4a2" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#e5989b" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* Back Horns */}
        <path
          d="M 62 65 C 50 30 65 15 80 32 C 72 45 68 55 65 65 Z"
          fill="url(#goatHorn)"
          className="transition-transform origin-bottom"
        />
        <path
          d="M 138 65 C 150 30 135 15 120 32 C 128 45 132 55 135 65 Z"
          fill="url(#goatHorn)"
          className="transition-transform origin-bottom"
        />

        {/* Big Floppy Pygmy Ears */}
        {/* Left Ear */}
        <g className="animate-wiggle origin-top-right">
          <ellipse
            cx="44"
            cy="90"
            rx="26"
            ry="14"
            transform="rotate(-25 44 90)"
            fill="#ffffff"
            stroke="#e9ecef"
            strokeWidth="2"
          />
          <ellipse
            cx="44"
            cy="90"
            rx="18"
            ry="8"
            transform="rotate(-25 44 90)"
            fill="#ffd1dc"
          />
        </g>

        {/* Right Ear */}
        <g className="origin-top-left">
          <ellipse
            cx="156"
            cy="90"
            rx="26"
            ry="14"
            transform="rotate(25 156 90)"
            fill="#ffffff"
            stroke="#e9ecef"
            strokeWidth="2"
          />
          <ellipse
            cx="156"
            cy="90"
            rx="18"
            ry="8"
            transform="rotate(25 156 90)"
            fill="#ffd1dc"
          />
        </g>

        {/* Head / Face */}
        <ellipse
          cx="100"
          cy="105"
          rx="54"
          ry="48"
          fill="url(#goatBody)"
          stroke="#e9ecef"
          strokeWidth="3"
        />

        {/* Fluffy Cheeks */}
        <circle cx="68" cy="118" r="14" fill="url(#goatBlush)" />
        <circle cx="132" cy="118" r="14" fill="url(#goatBlush)" />

        {/* Little Cute Pygmy Goat Beard */}
        <path
          d="M 94 148 C 96 162 104 162 106 148 Z"
          fill="#f8f9fa"
          stroke="#dee2e6"
          strokeWidth="1.5"
        />

        {/* Snout & Nose Area */}
        <ellipse cx="100" cy="126" rx="22" ry="16" fill="#fdfbf7" />

        {/* Cute Goat Nose (Horizontal slit) */}
        <ellipse cx="94" cy="122" rx="3.5" ry="2" fill="#495057" />
        <ellipse cx="106" cy="122" rx="3.5" ry="2" fill="#495057" />

        {/* Mouth */}
        {mood === 'eating' ? (
          // Chewing mouth
          <ellipse cx="100" cy="133" rx="7" ry="5" fill="#e63946" className="animate-pulse" />
        ) : mood === 'hungry' ? (
          // Hungry cute pout
          <path
            d="M 94 135 Q 100 130 106 135"
            fill="none"
            stroke="#495057"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        ) : (
          // Happy smile
          <path
            d="M 93 131 Q 100 138 107 131"
            fill="none"
            stroke="#495057"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        )}

        {/* Eyes */}
        {isWinking ? (
          // Wink animation
          <>
            <path
              d="M 72 98 Q 80 106 88 98"
              fill="none"
              stroke="#212529"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <circle cx="120" cy="98" r="7" fill="#212529" />
            <circle cx="122" cy="96" r="2.5" fill="#ffffff" />
          </>
        ) : mood === 'hungry' ? (
          // Watery pleading eyes
          <>
            <circle cx="80" cy="98" r="7" fill="#212529" />
            <circle cx="78" cy="96" r="3" fill="#ffffff" />
            <circle cx="82" cy="100" r="1.5" fill="#ffffff" />

            <circle cx="120" cy="98" r="7" fill="#212529" />
            <circle cx="118" cy="96" r="3" fill="#ffffff" />
            <circle cx="122" cy="100" r="1.5" fill="#ffffff" />
          </>
        ) : mood === 'super' ? (
          // Sparkling stars eyes
          <>
            <path
              d="M 74 98 Q 80 90 86 98"
              fill="none"
              stroke="#212529"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path
              d="M 114 98 Q 120 90 126 98"
              fill="none"
              stroke="#212529"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </>
        ) : (
          // Standard big sparkly eyes
          <>
            <circle cx="80" cy="98" r="7" fill="#212529" />
            <circle cx="82" cy="95" r="2.8" fill="#ffffff" />
            <circle cx="78" cy="100" r="1.2" fill="#ffffff" />

            <circle cx="120" cy="98" r="7" fill="#212529" />
            <circle cx="122" cy="95" r="2.8" fill="#ffffff" />
            <circle cx="118" cy="100" r="1.2" fill="#ffffff" />
          </>
        )}

        {/* Cute forehead hair tuft */}
        <path
          d="M 96 68 C 94 60 100 58 102 66 C 104 59 108 61 106 68"
          fill="none"
          stroke="#ced4da"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Slip in mouth when eating */}
        {mood === 'eating' && (
          <g transform="rotate(-15 100 135) translate(0, -5)">
            <rect
              x="92"
              y="130"
              width="28"
              height="18"
              rx="2"
              fill="#ffffff"
              stroke="#00a950"
              strokeWidth="1.5"
            />
            <line x1="96" y1="135" x2="114" y2="135" stroke="#ced4da" strokeWidth="1.5" />
            <line x1="96" y1="139" x2="110" y2="139" stroke="#ced4da" strokeWidth="1.5" />
          </g>
        )}
      </svg>
    </div>
  );
}
