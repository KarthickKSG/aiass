
import React, { useState } from 'react';
import { AssistantStatus } from '../types';
import { User, Cpu, Sparkles } from 'lucide-react';

interface AIAvatarProps {
  status: AssistantStatus;
}

type AvatarType = 'arachnid' | 'valkyrie';

const AssistantOrb: React.FC<AIAvatarProps> = ({ status }) => {
  const [avatarType, setAvatarType] = useState<AvatarType>('valkyrie');

  const getColors = () => {
    switch (status) {
      case AssistantStatus.LISTENING: return { cyan: '#00f2ff', magenta: '#bc13fe', primary: '#00f2ff', opacity: 1, glow: '0 0 20px #00f2ff' };
      case AssistantStatus.SPEAKING: return { cyan: '#00f2ff', magenta: '#bc13fe', primary: '#00f2ff', opacity: 1, glow: '0 0 35px #00f2ff' };
      case AssistantStatus.THINKING: return { cyan: '#bc13fe', magenta: '#00f2ff', primary: '#bc13fe', opacity: 0.8, glow: '0 0 15px #bc13fe' };
      case AssistantStatus.ERROR: return { cyan: '#ff0000', magenta: '#7a0000', primary: '#ff0000', opacity: 1, glow: '0 0 20px #ff0000' };
      default: return { cyan: '#475569', magenta: '#1e293b', primary: '#334155', opacity: 0.5, glow: 'none' };
    }
  };

  const { cyan, magenta, primary, opacity, glow } = getColors();

  const styles = `
    @keyframes spider-float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-8px); }
    }
    @keyframes energy-flow {
      0% { stroke-dashoffset: 100; opacity: 0.3; }
      50% { opacity: 0.8; }
      100% { stroke-dashoffset: 0; opacity: 0.3; }
    }
    @keyframes eye-transmission-glow {
      0%, 80%, 100% { filter: drop-shadow(0 0 2px ${cyan}); opacity: 0.8; fill: ${cyan}; transform: scale(1); }
      85% { filter: drop-shadow(0 0 22px #fff); opacity: 1; fill: #fff; transform: scale(1.45); }
      90% { filter: drop-shadow(0 0 10px ${cyan}); opacity: 0.9; fill: ${cyan}; transform: scale(1.1); }
    }
    @keyframes bracket-speak {
      0%, 100% { opacity: 0.6; transform: scale(1) translateX(0); }
      50% { opacity: 1; transform: scale(1.08) translateX(5px); }
    }
    @keyframes hair-sway {
      0%, 100% { transform: rotate(-1deg) scaleY(1); }
      50% { transform: rotate(1deg) scaleY(1.02); }
    }
    @keyframes circuit-pulse {
      0%, 100% { opacity: 0.2; stroke-width: 0.5; }
      50% { opacity: 0.8; stroke-width: 1.2; }
    }
    @keyframes sonic-ripple {
      0% { transform: scale(0.8); opacity: 1; }
      100% { transform: scale(2.5); opacity: 0; }
    }
    @keyframes neural-orbit {
      0% { transform: rotate(0deg) translateX(12px) rotate(0deg); }
      100% { transform: rotate(360deg) translateX(12px) rotate(-360deg); }
    }
    @keyframes thinking-iris {
      0%, 100% { transform: scale(1); opacity: 0.5; }
      50% { transform: scale(1.2); opacity: 1; }
    }
    .animate-spider-float { animation: spider-float 4s ease-in-out infinite; }
    .animate-eye-transmission { animation: eye-transmission-glow 2.5s ease-in-out infinite; transform-origin: center; }
    .animate-energy-flow { stroke-dasharray: 50; animation: energy-flow 3s linear infinite; }
    .animate-hair-sway { animation: hair-sway 6s ease-in-out infinite; transform-origin: top; }
    .animate-circuit-pulse { animation: circuit-pulse 2s ease-in-out infinite; }
    .animate-sonic-ripple { animation: sonic-ripple 1.5s ease-out infinite; transform-origin: center; }
    .animate-neural-orbit { animation: neural-orbit 4s linear infinite; }
    .animate-thinking-iris { animation: thinking-iris 1s ease-in-out infinite; transform-origin: center; }
  `;

  return (
    <div className="flex flex-col items-center justify-center p-4 relative group" aria-label={`AI Avatar status: ${status}`}>
      <style>{styles}</style>
      
      {/* Avatar Toggle HUD */}
      <div className="absolute top-0 right-0 z-30 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-x-12">
        <button 
          onClick={() => setAvatarType('valkyrie')}
          className={`p-2 rounded-lg border transition-all ${avatarType === 'valkyrie' ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' : 'bg-slate-900/50 border-white/10 text-slate-500 hover:text-white'}`}
          title="Valkyrie Protocol (Professional)"
        >
          <User className="w-4 h-4" />
        </button>
        <button 
          onClick={() => setAvatarType('arachnid')}
          className={`p-2 rounded-lg border transition-all ${avatarType === 'arachnid' ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' : 'bg-slate-900/50 border-white/10 text-slate-500 hover:text-white'}`}
          title="Arachnid Protocol (Industrial)"
        >
          <Cpu className="w-4 h-4" />
        </button>
      </div>

      <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
        {/* Background Glow */}
        <div 
          className="absolute inset-0 rounded-full blur-[100px] opacity-10 transition-all duration-1000"
          style={{ backgroundColor: primary }}
        ></div>

        {/* Framing Brackets */}
        <div className="absolute inset-0 flex justify-between items-center px-2 pointer-events-none z-0">
          <div className={`text-7xl md:text-8xl font-thin google-font transition-all duration-500 ${status === AssistantStatus.SPEAKING ? 'animate-bracket-speak text-cyan-400' : 'text-slate-800'}`}>&lt;</div>
          <div className={`text-7xl md:text-8xl font-thin google-font transition-all duration-500 ${status === AssistantStatus.SPEAKING ? 'animate-bracket-speak text-cyan-400' : 'text-slate-800'}`} style={{ transform: status === AssistantStatus.SPEAKING ? 'scaleX(-1)' : 'none' }}>&gt;</div>
        </div>

        {avatarType === 'valkyrie' ? (
          /* Valkyrie Professional Avatar - Futuristic Refinement */
          <svg viewBox="0 0 200 200" className={`w-48 h-48 md:w-64 md:h-64 relative z-10 transition-all duration-700 ${status !== AssistantStatus.IDLE ? 'animate-spider-float' : ''}`}>
            <defs>
              <linearGradient id="valkyrieFace" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0f172a" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#020617" stopOpacity="1" />
              </linearGradient>
              <filter id="energyBloom">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Futuristic Aura Brushes */}
            <g className="animate-hair-sway" opacity={opacity}>
              <path d="M65,45 Q100,-25 135,45" fill="none" stroke={magenta} strokeWidth="0.5" className="animate-energy-flow" />
              <path d="M40,75 Q20,15 70,35" fill="none" stroke={cyan} strokeWidth="0.6" className="animate-energy-flow" style={{ animationDelay: '0.7s' }} />
              <path d="M160,75 Q180,15 130,35" fill="none" stroke={cyan} strokeWidth="0.6" className="animate-energy-flow" style={{ animationDelay: '1.2s' }} />
            </g>

            {/* Professional Face Silhouette */}
            <path 
              d="M75,50 C75,30 125,30 125,50 C125,90 115,115 100,130 C85,115 75,90 75,50 Z" 
              fill="url(#valkyrieFace)" 
              stroke={cyan} 
              strokeWidth="1"
              filter="url(#energyBloom)"
            />

            {/* Advanced Glowing Circuits - Face */}
            <g stroke={cyan} fill="none" className="animate-circuit-pulse">
              <path d="M82,55 C82,55 85,45 100,45" strokeWidth="0.5" />
              <path d="M118,55 C118,55 115,45 100,45" strokeWidth="0.5" />
              <path d="M80,85 L85,95 L80,105" strokeWidth="0.4" />
              <path d="M120,85 L115,95 L120,105" strokeWidth="0.4" />
            </g>

            {/* Valkyrie Professional Eyes */}
            <g className={status === AssistantStatus.SPEAKING ? 'animate-eye-transmission' : 'animate-eye-glow'}>
              <circle cx="88" cy="65" r="1.8" fill={cyan} />
              <circle cx="112" cy="65" r="1.8" fill={cyan} />
              <circle cx="88" cy="65" r="3.5" fill={cyan} opacity="0.15" />
              <circle cx="112" cy="65" r="3.5" fill={cyan} opacity="0.15" />
            </g>

            {/* Shoulder/Chest Base with Tech Core */}
            <path d="M55,145 Q100,125 145,145 L155,185 Q100,175 45,185 Z" fill="#020617" stroke={magenta} strokeWidth="0.5" opacity="0.9" />
            
            {/* Neural Core in Chest */}
            <g transform="translate(100, 160)">
              <circle r="8" fill="#0f172a" stroke={cyan} strokeWidth="0.5" />
              <circle r="4" fill={cyan} opacity="0.3" className={status === AssistantStatus.THINKING ? 'animate-thinking-iris' : ''} />
              
              {/* Thinking State: Neural Data Orbits */}
              {status === AssistantStatus.THINKING && (
                <g>
                  <circle r="1" fill={cyan} className="animate-neural-orbit" />
                  <circle r="1" fill={magenta} className="animate-neural-orbit" style={{ animationDelay: '-1.5s', animationDuration: '3s' }} />
                  <circle r="1.2" fill={cyan} className="animate-neural-orbit" style={{ animationDelay: '-0.8s', animationDuration: '5s' }} />
                </g>
              )}

              {/* Speaking State: Sonic Ripples */}
              {status === AssistantStatus.SPEAKING && (
                <g>
                  <circle r="5" stroke={cyan} fill="none" strokeWidth="0.5" className="animate-sonic-ripple" />
                  <circle r="5" stroke={magenta} fill="none" strokeWidth="0.5" className="animate-sonic-ripple" style={{ animationDelay: '0.5s' }} />
                  <circle r="5" stroke={cyan} fill="none" strokeWidth="0.5" className="animate-sonic-ripple" style={{ animationDelay: '1s' }} />
                </g>
              )}
            </g>

            {/* Advanced Chest Circuitry */}
            <g stroke={cyan} fill="none" opacity="0.3" strokeWidth="0.3" className="animate-circuit-pulse">
              <path d="M80,150 L100,140 L120,150" />
              <path d="M70,165 L90,160" />
              <path d="M130,165 L110,160" />
            </g>

            {/* Speaking equalizer for Valkyrie - refined to throat/hologram style */}
            {status === AssistantStatus.SPEAKING && (
              <g transform="translate(80, 85)" opacity="0.6">
                <rect x="0" y="0" width="1" height="15" fill={cyan} className="animate-vocalize" style={{ transformOrigin: 'bottom' }} />
                <rect x="5" y="0" width="1" height="25" fill={cyan} className="animate-vocalize" style={{ animationDelay: '0.1s', transformOrigin: 'bottom' }} />
                <rect x="10" y="0" width="1" height="10" fill={magenta} className="animate-vocalize" style={{ animationDelay: '0.2s', transformOrigin: 'bottom' }} />
                <rect x="15" y="0" width="1" height="30" fill={cyan} className="animate-vocalize" style={{ animationDelay: '0.3s', transformOrigin: 'bottom' }} />
                <rect x="20" y="0" width="1" height="18" fill={cyan} className="animate-vocalize" style={{ animationDelay: '0.4s', transformOrigin: 'bottom' }} />
                <rect x="25" y="0" width="1" height="22" fill={magenta} className="animate-vocalize" style={{ animationDelay: '0.5s', transformOrigin: 'bottom' }} />
                <rect x="30" y="0" width="1" height="12" fill={cyan} className="animate-vocalize" style={{ animationDelay: '0.6s', transformOrigin: 'bottom' }} />
                <rect x="35" y="0" width="1" height="28" fill={cyan} className="animate-vocalize" style={{ animationDelay: '0.7s', transformOrigin: 'bottom' }} />
                <rect x="40" y="0" width="1" height="15" fill={cyan} className="animate-vocalize" style={{ animationDelay: '0.8s', transformOrigin: 'bottom' }} />
              </g>
            )}
          </svg>
        ) : (
          /* Industrial Arachnid Avatar with Scan line */
          <svg viewBox="0 0 200 200" className={`w-48 h-48 md:w-64 md:h-64 relative z-10 transition-all duration-500 ${status !== AssistantStatus.IDLE ? 'animate-spider-float' : ''}`}>
            <defs>
              <linearGradient id="spiderBody" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#020617" />
              </linearGradient>
            </defs>

            {/* Industrial Legs and Body */}
            <g stroke={cyan} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity={opacity}>
              <path d="M85,80 L50,50 L35,80" className={status !== AssistantStatus.IDLE ? 'animate-pulse' : ''} />
              <path d="M80,95 L40,85 L25,120" style={{ animationDelay: '0.1s' }} className={status !== AssistantStatus.IDLE ? 'animate-pulse' : ''} />
              <path d="M85,115 L45,135 L40,165" style={{ animationDelay: '0.2s' }} className={status !== AssistantStatus.IDLE ? 'animate-pulse' : ''} />
              <path d="M95,125 L75,155 L70,185" style={{ animationDelay: '0.3s' }} className={status !== AssistantStatus.IDLE ? 'animate-pulse' : ''} />
              
              <path d="M115,80 L150,50 L165,80" className={status !== AssistantStatus.IDLE ? 'animate-pulse' : ''} />
              <path d="M120,95 L160,85 L175,120" style={{ animationDelay: '0.1s' }} className={status !== AssistantStatus.IDLE ? 'animate-pulse' : ''} />
              <path d="M115,115 L155,135 L160,165" style={{ animationDelay: '0.2s' }} className={status !== AssistantStatus.IDLE ? 'animate-pulse' : ''} />
              <path d="M105,125 L125,155 L130,185" style={{ animationDelay: '0.3s' }} className={status !== AssistantStatus.IDLE ? 'animate-pulse' : ''} />
            </g>

            <path d="M85,85 L115,85 L125,110 L100,125 L75,110 Z" fill="url(#spiderBody)" stroke={cyan} strokeWidth="1" />

            {/* Abdomen with Scan line */}
            <g transform="translate(75, 110)">
              <path 
                d="M0,0 L50,0 L40,55 L25,70 L10,55 Z" 
                fill="#020617" stroke={magenta} strokeWidth="1.5" 
                className={status === AssistantStatus.SPEAKING ? 'animate-abdomen-throb' : ''}
              />
              <clipPath id="abdClip"><path d="M0,0 L50,0 L40,55 L25,70 L10,55 Z" /></clipPath>
              <rect width="50" height="2" fill={cyan} opacity="0.4" clipPath="url(#abdClip)" className="animate-scan-v" />
            </g>

            {/* Head & Refined Speaking Eyes */}
            <g>
              <path d="M90,85 L110,85 L105,70 L95,70 Z" fill="#0f172a" stroke={cyan} strokeWidth="1" />
              <circle cx="96" cy="78" r="1.5" fill={cyan} className={status === AssistantStatus.SPEAKING ? 'animate-eye-transmission' : 'animate-eye-glow'} />
              <circle cx="104" cy="78" r="1.5" fill={cyan} className={status === AssistantStatus.SPEAKING ? 'animate-eye-transmission' : 'animate-eye-glow'} />
            </g>

            {status === AssistantStatus.SPEAKING && (
              <g transform="translate(93, 82)">
                <rect x="1" y="0" width="1.5" height="1" fill={cyan} className="animate-vocalize" />
                <rect x="4" y="0" width="1.5" height="1" fill={cyan} className="animate-vocalize" style={{ animationDelay: '0.04s' }} />
                <rect x="7" y="0" width="1.5" height="1" fill={cyan} className="animate-vocalize" style={{ animationDelay: '0.08s' }} />
                <rect x="10" y="0" width="1.5" height="1" fill={cyan} className="animate-vocalize" style={{ animationDelay: '0.12s' }} />
              </g>
            )}
          </svg>
        )}

        {/* Neural Transmission Pulse */}
        {status === AssistantStatus.SPEAKING && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-56 h-56 border-[1px] border-cyan-500/10 rounded-full animate-[ping_2s_linear_infinite]"></div>
            <div className="w-56 h-56 border-[1px] border-magenta-500/5 rounded-full animate-[ping_3s_linear_infinite]"></div>
          </div>
        )}
      </div>
      
      <div className="mt-8 text-center">
        <div className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full mb-4 shadow-xl">
           <Sparkles className={`w-3 h-3 ${status !== AssistantStatus.IDLE ? 'text-cyan-400 animate-pulse' : 'text-slate-600'}`} />
           <span className="text-[10px] font-black text-slate-300 tracking-[0.2em] uppercase">
             {avatarType === 'valkyrie' ? 'VALKYRIE-1 PRESTIGE' : 'ARACHNID-X PROTOCOL'}
           </span>
        </div>
        <h2 className="text-3xl md:text-4xl font-black google-font tracking-tighter text-white">
          KING <span style={{ color: magenta }} className={status === AssistantStatus.THINKING ? 'animate-pulse' : ''}>AI</span>
        </h2>
        <p className="text-slate-500 font-bold text-[9px] tracking-[0.4em] uppercase mt-2">
          {status === AssistantStatus.IDLE && 'Neural Hub Standby'}
          {status === AssistantStatus.LISTENING && 'Monitoring audio frequencies...'}
          {status === AssistantStatus.THINKING && 'Executing cognitive link...'}
          {status === AssistantStatus.SPEAKING && 'Transmitting response packet...'}
          {status === AssistantStatus.ERROR && 'Synaptic breach detected'}
        </p>
      </div>
    </div>
  );
};

export default AssistantOrb;
