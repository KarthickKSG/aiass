
import React from 'react';
import { AssistantStatus } from '../types';

interface AIAvatarProps {
  status: AssistantStatus;
}

const AssistantOrb: React.FC<AIAvatarProps> = ({ status }) => {
  const getColors = () => {
    switch (status) {
      case AssistantStatus.LISTENING: return { glow: 'rgba(34, 211, 238, 0.4)', core: '#22d3ee', shadow: '0 0 40px #22d3ee' };
      case AssistantStatus.SPEAKING: return { glow: 'rgba(59, 130, 246, 0.4)', core: '#3b82f6', shadow: '0 0 60px #3b82f6' };
      case AssistantStatus.THINKING: return { glow: 'rgba(168, 85, 247, 0.4)', core: '#a855f7', shadow: '0 0 30px #a855f7' };
      case AssistantStatus.ERROR: return { glow: 'rgba(239, 68, 68, 0.4)', core: '#ef4444', shadow: '0 0 20px #ef4444' };
      default: return { glow: 'rgba(71, 85, 105, 0.2)', core: '#475569', shadow: '0 0 10px #475569' };
    }
  };

  const { core, shadow } = getColors();

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center">
        {/* Background Aura */}
        <div 
          className="absolute inset-0 rounded-full blur-[60px] opacity-30 transition-all duration-1000"
          style={{ backgroundColor: core }}
        ></div>

        {/* The Avatar Hologram */}
        <svg viewBox="0 0 200 200" className="w-full h-full relative z-10 filter drop-shadow-2xl">
          <defs>
            <linearGradient id="avatarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={core} stopOpacity="0.8" />
              <stop offset="100%" stopColor={core} stopOpacity="0.3" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Head Outline */}
          <path
            d="M100,30 C60,30 40,70 40,110 C40,150 70,180 100,180 C130,180 160,150 160,110 C160,70 140,30 100,30 Z"
            fill="none"
            stroke="url(#avatarGradient)"
            strokeWidth="1.5"
            className="animate-pulse"
          />

          {/* Neural Core */}
          <circle
            cx="100" cy="100" r={status === AssistantStatus.THINKING ? "25" : "15"}
            fill={core}
            fillOpacity="0.2"
            className="transition-all duration-500"
          >
            {status === AssistantStatus.SPEAKING && (
              <animate attributeName="r" values="15;22;15" dur="0.8s" repeatCount="indefinite" />
            )}
          </circle>

          {/* Eye HUD Elements */}
          <g filter="url(#glow)">
            <rect x="75" y="85" width="15" height="4" rx="2" fill={core} className={status === AssistantStatus.LISTENING ? 'animate-pulse' : ''} />
            <rect x="110" y="85" width="15" height="4" rx="2" fill={core} className={status === AssistantStatus.LISTENING ? 'animate-pulse' : ''} />
          </g>

          {/* Digital Brain Pattern */}
          <g opacity="0.4" stroke={core} strokeWidth="0.5" fill="none">
             <path d="M80,50 Q100,40 120,50" />
             <path d="M70,70 Q100,60 130,70" />
             <path d="M90,40 L90,60 M110,40 L110,60" />
          </g>
        </svg>

        {/* Circular Audio Rings */}
        {(status === AssistantStatus.LISTENING || status === AssistantStatus.SPEAKING) && (
          <div className="absolute inset-0">
            <div className="absolute inset-0 border border-blue-500/20 rounded-full animate-ping"></div>
            <div className="absolute inset-4 border border-blue-500/10 rounded-full animate-ping" style={{ animationDelay: '0.2s' }}></div>
          </div>
        )}
      </div>
      
      <div className="mt-8 text-center">
        <h2 className="text-2xl md:text-3xl font-black google-font tracking-tighter text-white opacity-90">
          KING <span className="text-blue-500">IV</span>
        </h2>
        <div className="flex items-center justify-center space-x-2 mt-1">
          <div className={`w-1.5 h-1.5 rounded-full ${status !== AssistantStatus.IDLE ? 'bg-blue-500 shadow-[0_0_8px_#3b82f6]' : 'bg-slate-700'}`}></div>
          <p className="text-slate-500 font-bold text-[9px] tracking-[0.4em] uppercase">
            {status === AssistantStatus.IDLE && 'Offline System'}
            {status === AssistantStatus.LISTENING && 'Acquiring Voice'}
            {status === AssistantStatus.THINKING && 'Processing Logic'}
            {status === AssistantStatus.SPEAKING && 'Audio Response'}
            {status === AssistantStatus.ERROR && 'Hardware Conflict'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AssistantOrb;
