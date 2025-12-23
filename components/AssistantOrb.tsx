
import React from 'react';
import { AssistantStatus } from '../types';

interface AIAvatarProps {
  status: AssistantStatus;
}

const AssistantOrb: React.FC<AIAvatarProps> = ({ status }) => {
  const getColors = () => {
    switch (status) {
      case AssistantStatus.LISTENING: return { cyan: '#00f2ff', magenta: '#bc13fe', primary: '#00f2ff', opacity: 1 };
      case AssistantStatus.SPEAKING: return { cyan: '#00f2ff', magenta: '#bc13fe', primary: '#00f2ff', opacity: 1 };
      case AssistantStatus.THINKING: return { cyan: '#bc13fe', magenta: '#00f2ff', primary: '#bc13fe', opacity: 0.8 };
      case AssistantStatus.ERROR: return { cyan: '#ff0000', magenta: '#7a0000', primary: '#ff0000', opacity: 1 };
      default: return { cyan: '#475569', magenta: '#1e293b', primary: '#334155', opacity: 0.5 };
    }
  };

  const { cyan, magenta, primary, opacity } = getColors();

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
        
        {/* Background Atmosphere */}
        <div 
          className="absolute inset-0 rounded-full blur-[100px] opacity-20 transition-all duration-1000"
          style={{ backgroundColor: primary }}
        ></div>

        {/* Framing Brackets < > */}
        <div className="absolute inset-0 flex justify-between items-center px-4 pointer-events-none">
          <div 
            className={`text-6xl md:text-8xl font-light google-font transition-all duration-500 ${status === AssistantStatus.SPEAKING ? 'scale-110 translate-x-[-10px]' : ''}`}
            style={{ color: cyan, textShadow: `0 0 20px ${cyan}44` }}
          >
            &lt;
          </div>
          <div 
            className={`text-6xl md:text-8xl font-light google-font transition-all duration-500 ${status === AssistantStatus.SPEAKING ? 'scale-110 translate-x-[10px]' : ''}`}
            style={{ color: cyan, textShadow: `0 0 20px ${cyan}44` }}
          >
            &gt;
          </div>
        </div>

        {/* The Mechanical Spider SVG */}
        <svg viewBox="0 0 200 200" className="w-48 h-48 md:w-64 md:h-64 relative z-10 drop-shadow-[0_0_15px_rgba(0,242,255,0.3)]">
          <defs>
            <linearGradient id="spiderBody" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>
            <filter id="neonGlow">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Legs - Left Side */}
          <g stroke={cyan} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity={opacity}>
            {/* Upper Left */}
            <path d="M85,80 L50,50 L35,80" className={status !== AssistantStatus.IDLE ? 'animate-pulse' : ''} />
            <path d="M80,95 L40,85 L25,120" style={{ animationDelay: '0.1s' }} />
            {/* Lower Left */}
            <path d="M85,115 L45,135 L40,165" style={{ animationDelay: '0.2s' }} />
            <path d="M95,125 L75,155 L70,185" style={{ animationDelay: '0.3s' }} />
          </g>

          {/* Legs - Right Side */}
          <g stroke={cyan} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity={opacity}>
            {/* Upper Right */}
            <path d="M115,80 L150,50 L165,80" className={status !== AssistantStatus.IDLE ? 'animate-pulse' : ''} />
            <path d="M120,95 L160,85 L175,120" style={{ animationDelay: '0.1s' }} />
            {/* Lower Right */}
            <path d="M115,115 L155,135 L160,165" style={{ animationDelay: '0.2s' }} />
            <path d="M105,125 L125,155 L130,185" style={{ animationDelay: '0.3s' }} />
          </g>

          {/* Thorax (Middle Body) */}
          <path d="M85,85 L115,85 L125,110 L100,125 L75,110 Z" fill="url(#spiderBody)" stroke={cyan} strokeWidth="1" />

          {/* Abdomen (Core) */}
          <g transform="translate(75, 110)">
            <path d="M0,0 L50,0 L40,55 L25,70 L10,55 Z" fill="#020617" stroke={magenta} strokeWidth="1.5" filter="url(#neonGlow)" />
            {/* Interior Code Pattern */}
            <g opacity="0.6">
               <rect x="10" y="15" width="30" height="2" fill={cyan}>
                 {status === AssistantStatus.THINKING && <animate attributeName="width" values="0;30;0" dur="2s" repeatCount="indefinite" />}
               </rect>
               <rect x="15" y="25" width="20" height="2" fill={cyan} />
               <rect x="10" y="35" width="30" height="2" fill={magenta} />
               <rect x="20" y="45" width="10" height="2" fill={cyan} />
            </g>
          </g>

          {/* Head & Eyes */}
          <g>
            <path d="M90,85 L110,85 L105,70 L95,70 Z" fill="#0f172a" stroke={cyan} strokeWidth="1" />
            <circle cx="96" cy="78" r="1.5" fill={cyan} className={status === AssistantStatus.LISTENING ? 'animate-ping' : ''} />
            <circle cx="104" cy="78" r="1.5" fill={cyan} className={status === AssistantStatus.LISTENING ? 'animate-ping' : ''} />
          </g>
        </svg>

        {/* Neural Transmission Pulse */}
        {status === AssistantStatus.SPEAKING && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 border-2 border-cyan-500/30 rounded-full animate-[ping_1.5s_linear_infinite]"></div>
            <div className="w-32 h-32 border-2 border-magenta-500/20 rounded-full animate-[ping_2s_linear_infinite]"></div>
          </div>
        )}
      </div>
      
      <div className="mt-8 text-center">
        <div className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full mb-4">
           <div className={`w-2 h-2 rounded-full ${status !== AssistantStatus.IDLE ? 'bg-cyan-400 animate-pulse shadow-[0_0_10px_#00f2ff]' : 'bg-slate-700'}`}></div>
           <span className="text-[10px] font-black text-slate-300 tracking-[0.2em] uppercase">Arachnid Sync-V4</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-black google-font tracking-tighter text-white">
          KING <span style={{ color: magenta }}>AI</span>
        </h2>
        <p className="text-slate-500 font-bold text-[9px] tracking-[0.4em] uppercase mt-2">
          {status === AssistantStatus.IDLE && 'Dormant Protocol'}
          {status === AssistantStatus.LISTENING && 'Interpreting Frequency'}
          {status === AssistantStatus.THINKING && 'Compiling Neural Data'}
          {status === AssistantStatus.SPEAKING && 'Broadcasting Signal'}
          {status === AssistantStatus.ERROR && 'Core Disconnect'}
        </p>
      </div>
    </div>
  );
};

export default AssistantOrb;
