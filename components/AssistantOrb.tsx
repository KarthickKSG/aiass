
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
      case AssistantStatus.LISTENING: return { cyan: '#00f2ff', magenta: '#bc13fe', primary: '#00f2ff', opacity: 1, glow: '0 0 30px #00f2ff' };
      case AssistantStatus.SPEAKING: return { cyan: '#00f2ff', magenta: '#bc13fe', primary: '#00f2ff', opacity: 1, glow: '0 0 45px #00f2ff' };
      case AssistantStatus.THINKING: return { cyan: '#bc13fe', magenta: '#00f2ff', primary: '#bc13fe', opacity: 0.9, glow: '0 0 25px #bc13fe' };
      case AssistantStatus.ERROR: return { cyan: '#ff0000', magenta: '#7a0000', primary: '#ff0000', opacity: 1, glow: '0 0 25px #ff0000' };
      default: return { cyan: '#475569', magenta: '#1e293b', primary: '#334155', opacity: 0.6, glow: 'none' };
    }
  };

  const { cyan, magenta, primary, opacity, glow } = getColors();

  const styles = `
    @keyframes breathing {
      0%, 100% { transform: scale(1); opacity: 0.8; }
      50% { transform: scale(1.02); opacity: 1; }
    }
    @keyframes eye-listening-pulse {
      0%, 100% { filter: drop-shadow(0 0 2px ${cyan}); transform: scale(1); opacity: 0.7; }
      50% { filter: drop-shadow(0 0 8px ${cyan}); transform: scale(1.3); opacity: 1; }
    }
    @keyframes vocal-mouth {
      0%, 100% { transform: scaleX(0.5) scaleY(0.2); opacity: 0.2; }
      50% { transform: scaleX(1.2) scaleY(1.5); opacity: 1; }
    }
    @keyframes mandible-move {
      0%, 100% { transform: rotate(0deg); }
      50% { transform: rotate(15deg); }
    }
    @keyframes particle-float {
      0% { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
      20% { opacity: 1; }
      100% { transform: translateY(-40px) translateX(10px) scale(0); opacity: 0; }
    }
    @keyframes thinking-shift {
      0%, 100% { transform: translate(0, 0) rotate(0deg); }
      25% { transform: translate(1px, -1px) rotate(0.5deg); }
      75% { transform: translate(-1px, 1px) rotate(-0.5deg); }
    }
    @keyframes spider-float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
    }
    @keyframes energy-flow {
      0% { stroke-dashoffset: 100; opacity: 0.2; }
      50% { opacity: 0.6; }
      100% { stroke-dashoffset: 0; opacity: 0.2; }
    }
    .animate-breathing { animation: breathing 3s ease-in-out infinite; }
    .animate-listening-eye { animation: eye-listening-pulse 0.8s ease-in-out infinite; transform-origin: center; }
    .animate-vocal-mouth { animation: vocal-mouth 0.2s ease-in-out infinite; transform-origin: center; }
    .animate-mandible-left { animation: mandible-move 0.15s ease-in-out infinite; transform-origin: top right; }
    .animate-mandible-right { animation: mandible-move 0.15s ease-in-out infinite reverse; transform-origin: top left; }
    .animate-thinking-shift { animation: thinking-shift 0.4s ease-in-out infinite; }
    .particle { pointer-events: none; position: absolute; background: ${cyan}; border-radius: 50%; opacity: 0; }
  `;

  return (
    <div className="flex flex-col items-center justify-center p-4 relative group select-none" aria-label={`AI Avatar status: ${status}`}>
      <style>{styles}</style>
      
      {/* Avatar Protocol Switcher */}
      <div className="absolute top-0 right-0 z-30 flex flex-col space-y-3 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-16">
        <button 
          onClick={() => setAvatarType('valkyrie')}
          className={`p-3 rounded-2xl border transition-all shadow-xl ${avatarType === 'valkyrie' ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' : 'bg-slate-900/80 border-white/10 text-slate-500 hover:text-white'}`}
          title="Valkyrie Protocol"
        >
          <User className="w-5 h-5" />
        </button>
        <button 
          onClick={() => setAvatarType('arachnid')}
          className={`p-3 rounded-2xl border transition-all shadow-xl ${avatarType === 'arachnid' ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' : 'bg-slate-900/80 border-white/10 text-slate-500 hover:text-white'}`}
          title="Arachnid Protocol"
        >
          <Cpu className="w-5 h-5" />
        </button>
      </div>

      <div className={`relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center transition-all duration-700 ${status === AssistantStatus.THINKING ? 'animate-thinking-shift' : ''}`}>
        {/* Particle System for Thinking */}
        {status === AssistantStatus.THINKING && (
          <div className="absolute inset-0 pointer-events-none overflow-visible">
            {[...Array(8)].map((_, i) => (
              <div 
                key={i} 
                className="particle" 
                style={{
                  width: '3px',
                  height: '3px',
                  left: `${40 + Math.random() * 20}%`,
                  top: `${40 + Math.random() * 20}%`,
                  animation: `particle-float ${1 + Math.random()}s linear infinite`,
                  animationDelay: `${Math.random()}s`,
                  backgroundColor: Math.random() > 0.5 ? cyan : magenta
                }}
              />
            ))}
          </div>
        )}

        {/* Ambient Bloom */}
        <div 
          className="absolute inset-0 rounded-full blur-[120px] opacity-20 transition-all duration-1000"
          style={{ backgroundColor: primary, boxShadow: glow }}
        ></div>

        {/* Framing Brackets */}
        <div className="absolute inset-0 flex justify-between items-center px-4 pointer-events-none z-0">
          <div className={`text-8xl md:text-9xl font-thin transition-all duration-500 ${status === AssistantStatus.SPEAKING ? 'scale-110 text-cyan-400 opacity-100' : 'text-slate-900 opacity-40'}`}>&lt;</div>
          <div className={`text-8xl md:text-9xl font-thin transition-all duration-500 ${status === AssistantStatus.SPEAKING ? 'scale-110 text-cyan-400 opacity-100' : 'text-slate-900 opacity-40'}`} style={{ transform: status === AssistantStatus.SPEAKING ? 'scaleX(-1.1)' : 'scaleX(-1)' }}>&gt;</div>
        </div>

        {avatarType === 'valkyrie' ? (
          /* VALKYRIE: High-End Professional AI */
          <svg viewBox="0 0 200 200" className={`w-48 h-48 md:w-72 md:h-72 relative z-10 transition-all duration-1000 ${status !== AssistantStatus.IDLE ? 'animate-spider-float' : 'animate-breathing'}`}>
            <defs>
              <linearGradient id="valkyrieCore" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#020617" />
              </linearGradient>
            </defs>

            {/* Aura Flows */}
            <g opacity={opacity * 0.5}>
              <path d="M70,40 Q100,-10 130,40" fill="none" stroke={magenta} strokeWidth="0.5" className="animate-energy-flow" />
              <path d="M50,70 Q30,20 80,30" fill="none" stroke={cyan} strokeWidth="0.6" className="animate-energy-flow" style={{ animationDelay: '0.5s' }} />
              <path d="M150,70 Q170,20 120,30" fill="none" stroke={cyan} strokeWidth="0.6" className="animate-energy-flow" style={{ animationDelay: '1s' }} />
            </g>

            {/* Face Silhouette */}
            <path 
              d="M75,50 C75,30 125,30 125,50 C125,90 115,115 100,135 C85,115 75,90 75,50 Z" 
              fill="url(#valkyrieCore)" 
              stroke={cyan} 
              strokeWidth="1.5"
              className="drop-shadow-2xl"
            />

            {/* Valkyrie Eyes: Status Responsive */}
            <g transform="translate(100, 65)">
              <g className={status === AssistantStatus.LISTENING ? 'animate-listening-eye' : ''}>
                <circle cx="-14" cy="0" r="2.5" fill={cyan} />
                <circle cx="14" cy="0" r="2.5" fill={cyan} />
                <circle cx="-14" cy="0" r="5" fill={cyan} opacity="0.15" />
                <circle cx="14" cy="0" r="5" fill={cyan} opacity="0.15" />
              </g>
            </g>

            {/* Speaking Mouth Effect */}
            {status === AssistantStatus.SPEAKING && (
              <g transform="translate(100, 100)">
                <ellipse cx="0" cy="0" rx="6" ry="2" fill={cyan} className="animate-vocal-mouth" />
                <ellipse cx="0" cy="0" rx="10" ry="4" fill={cyan} opacity="0.2" className="animate-vocal-mouth" style={{ animationDelay: '0.1s' }} />
              </g>
            )}

            {/* Neural Heart */}
            <g transform="translate(100, 155)">
              <circle r="12" fill="#020617" stroke={magenta} strokeWidth="0.5" opacity="0.8" />
              <circle r="6" fill={cyan} className={status === AssistantStatus.THINKING ? 'animate-pulse' : 'opacity-30'} />
              {status === AssistantStatus.SPEAKING && (
                <circle r="8" stroke={cyan} fill="none" strokeWidth="0.5" className="animate-ping" />
              )}
            </g>
          </svg>
        ) : (
          /* ARACHNID: Industrial Mechanical AI */
          <svg viewBox="0 0 200 200" className={`w-48 h-48 md:w-72 md:h-72 relative z-10 transition-all duration-700 ${status !== AssistantStatus.IDLE ? 'animate-spider-float' : ''}`}>
            {/* Mechanical Legs */}
            <g stroke={cyan} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity={opacity}>
              <path d="M85,80 L50,50 L35,80" />
              <path d="M80,95 L40,85 L25,120" />
              <path d="M115,80 L150,50 L165,80" />
              <path d="M120,95 L160,85 L175,120" />
            </g>

            {/* Body Chassis */}
            <path d="M80,85 L120,85 L130,115 L100,135 L70,115 Z" fill="#020617" stroke={cyan} strokeWidth="2" />

            {/* Mandibles: Speaking Responsive */}
            <g transform="translate(100, 90)">
              <path 
                d="M-5,0 L-15,10" 
                stroke={cyan} strokeWidth="2" 
                className={status === AssistantStatus.SPEAKING ? 'animate-mandible-left' : ''} 
              />
              <path 
                d="M5,0 L15,10" 
                stroke={cyan} strokeWidth="2" 
                className={status === AssistantStatus.SPEAKING ? 'animate-mandible-right' : ''} 
              />
            </g>

            {/* Arachnid Eyes: Listening Responsive */}
            <g transform="translate(100, 78)">
              <g className={status === AssistantStatus.LISTENING ? 'animate-listening-eye' : ''}>
                <circle cx="-6" cy="0" r="1.8" fill={magenta} />
                <circle cx="6" cy="0" r="1.8" fill={magenta} />
                <circle cx="-6" cy="0" r="4" fill={magenta} opacity="0.2" />
                <circle cx="6" cy="0" r="4" fill={magenta} opacity="0.2" />
              </g>
            </g>

            {/* Tactical Scan Line */}
            {status !== AssistantStatus.IDLE && (
              <rect x="75" y="90" width="50" height="1" fill={cyan} className="animate-scan" />
            )}
          </svg>
        )}
      </div>
      
      {/* Interface Status Label */}
      <div className="mt-10 text-center max-w-xs px-4">
        <div className="inline-flex items-center space-x-3 bg-white/5 border border-white/10 px-6 py-2 rounded-full mb-6 shadow-2xl backdrop-blur-xl">
           <Sparkles className={`w-4 h-4 transition-colors ${status !== AssistantStatus.IDLE ? 'text-cyan-400' : 'text-slate-600'}`} />
           <span className="text-[10px] font-black text-slate-300 tracking-[0.3em] uppercase">
             {avatarType === 'valkyrie' ? 'Valkyrie Node' : 'Arachnid Node'}
           </span>
        </div>
        
        <h2 className="text-3xl md:text-5xl font-black google-font tracking-tighter text-white transition-all duration-500">
          KING <span style={{ color: magenta }} className={status === AssistantStatus.THINKING ? 'animate-pulse' : ''}>AI</span>
        </h2>
        
        <div className="mt-4 h-6 overflow-hidden">
          <p className={`text-slate-500 font-bold text-[10px] tracking-[0.5em] uppercase transition-all duration-500 ${status !== AssistantStatus.IDLE ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-50'}`}>
            {status === AssistantStatus.IDLE && 'Neural link standby'}
            {status === AssistantStatus.LISTENING && 'Listening to frequencies...'}
            {status === AssistantStatus.THINKING && 'Executing synaptic drift...'}
            {status === AssistantStatus.SPEAKING && 'Streaming output packet...'}
            {status === AssistantStatus.ERROR && 'Encryption breach detected'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AssistantOrb;
