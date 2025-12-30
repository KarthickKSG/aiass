
import React, { useState } from 'react';
import { AssistantStatus } from '../types';
import { User, Cpu, Sparkles, Hexagon } from 'lucide-react';

interface AIAvatarProps {
  status: AssistantStatus;
}

type AvatarType = 'arachnid' | 'valkyrie' | 'core';

const AssistantOrb: React.FC<AIAvatarProps> = ({ status }) => {
  const [avatarType, setAvatarType] = useState<AvatarType>('valkyrie');

  const getColors = () => {
    switch (status) {
      case AssistantStatus.LISTENING: return { cyan: '#22d3ee', magenta: '#8b5cf6', primary: '#22d3ee', opacity: 1, glow: '0 0 60px #22d3ee44' };
      case AssistantStatus.SPEAKING: return { cyan: '#22d3ee', magenta: '#8b5cf6', primary: '#22d3ee', opacity: 1, glow: '0 0 100px #22d3ee66' };
      case AssistantStatus.THINKING: return { cyan: '#a855f7', magenta: '#22d3ee', primary: '#a855f7', opacity: 0.9, glow: '0 0 50px #a855f744' };
      case AssistantStatus.ERROR: return { cyan: '#ef4444', magenta: '#7f1d1d', primary: '#ef4444', opacity: 1, glow: '0 0 50px #ef444444' };
      default: return { cyan: '#475569', magenta: '#1e293b', primary: '#334155', opacity: 0.6, glow: 'none' };
    }
  };

  const { cyan, magenta, primary, opacity, glow } = getColors();

  const styles = `
    @keyframes breathing {
      0%, 100% { transform: scale(1); opacity: 0.85; filter: blur(0px); }
      50% { transform: scale(1.06); opacity: 1; filter: blur(0.5px); }
    }
    @keyframes orbit-slow {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    @keyframes eye-pulse {
      0%, 100% { transform: scale(1); opacity: 0.8; }
      50% { transform: scale(1.3); opacity: 1; }
    }
    @keyframes synaptic-pulse {
      0% { stroke-dashoffset: 200; opacity: 0.2; }
      50% { opacity: 0.7; }
      100% { stroke-dashoffset: 0; opacity: 0.2; }
    }
    .animate-breathing { animation: breathing 4s ease-in-out infinite; }
    .animate-orbit-slow { animation: orbit-slow 20s linear infinite; }
    .animate-eye { animation: eye-pulse 1.5s ease-in-out infinite; transform-origin: center; }
    .animate-synaptic-fast { animation: synaptic-pulse 2s linear infinite; }
  `;

  return (
    <div className="flex flex-col items-center justify-center p-6 relative group select-none" aria-label={`Neural Interface Status: ${status}`}>
      <style>{styles}</style>
      
      {/* Protocol Toggle */}
      <div className="absolute -top-16 right-0 md:translate-x-40 z-30 flex flex-col space-y-4 opacity-0 group-hover:opacity-100 transition-all duration-700 delay-100">
        {[
          { type: 'valkyrie' as AvatarType, icon: User, label: 'Valkyrie' },
          { type: 'arachnid' as AvatarType, icon: Cpu, label: 'Arachnid' },
          { type: 'core' as AvatarType, icon: Hexagon, label: 'Core' }
        ].map((item) => (
          <button 
            key={item.type}
            onClick={() => setAvatarType(item.type)}
            className={`p-4 rounded-3xl border transition-all shadow-2xl backdrop-blur-3xl flex items-center space-x-3 group/btn ${avatarType === item.type ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' : 'bg-slate-900/80 border-white/10 text-slate-500 hover:text-white'}`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[9px] font-black uppercase tracking-widest overflow-hidden w-0 group-hover/btn:w-20 transition-all duration-500">{item.label}</span>
          </button>
        ))}
      </div>

      <div className={`relative w-72 h-72 md:w-96 md:h-96 flex items-center justify-center transition-all duration-1000`}>
        
        {/* Ambient Neural Bloom */}
        <div 
          className="absolute inset-0 rounded-full blur-[120px] opacity-20 transition-all duration-[1500ms]"
          style={{ backgroundColor: primary, boxShadow: glow }}
        ></div>

        {/* Structural Brackets */}
        <div className="absolute inset-0 flex justify-between items-center px-1 pointer-events-none z-0">
          <div className={`text-[12rem] font-thin transition-all duration-1000 ${status !== AssistantStatus.IDLE ? 'scale-110 text-cyan-400 opacity-40' : 'text-slate-800 opacity-10'}`}>[</div>
          <div className={`text-[12rem] font-thin transition-all duration-1000 ${status !== AssistantStatus.IDLE ? 'scale-110 text-cyan-400 opacity-40' : 'text-slate-800 opacity-10'}`}>]</div>
        </div>

        {avatarType === 'valkyrie' ? (
          <svg viewBox="0 0 200 200" className={`w-64 h-64 md:w-80 md:h-80 relative z-10 transition-all duration-1000 ${status !== AssistantStatus.IDLE ? 'animate-breathing' : 'opacity-70'}`}>
            <defs>
              <linearGradient id="valkGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#020617" />
              </linearGradient>
            </defs>

            {/* Orbiting Elements */}
            <circle cx="100" cy="100" r="95" fill="none" stroke={cyan} strokeWidth="0.5" strokeDasharray="4 20" opacity="0.1" className="animate-orbit-slow" />
            
            {/* Neural Web */}
            <g opacity={opacity * 0.4}>
              <path d="M60,40 Q100,0 140,40" fill="none" stroke={magenta} strokeWidth="0.5" className="animate-synaptic-fast" />
              <path d="M40,100 Q10,50 80,40" fill="none" stroke={cyan} strokeWidth="0.4" className="animate-synaptic-fast" style={{ animationDelay: '0.5s' }} />
              <path d="M160,100 Q190,50 120,40" fill="none" stroke={cyan} strokeWidth="0.4" className="animate-synaptic-fast" style={{ animationDelay: '1.2s' }} />
            </g>

            {/* Valkyrie Face Frame */}
            <path 
              d="M70,55 C70,30 130,30 130,55 C130,110 120,135 100,155 C80,135 70,110 70,55 Z" 
              fill="url(#valkGrad)" 
              stroke={cyan} 
              strokeWidth="1.5"
              className="drop-shadow-2xl"
            />

            {/* Neural Eyes */}
            <g transform="translate(100, 75)">
              <g className={status === AssistantStatus.LISTENING ? 'animate-eye' : ''}>
                <circle cx="-15" cy="0" r="2.5" fill={cyan} />
                <circle cx="15" cy="0" r="2.5" fill={cyan} />
                <circle cx="-15" cy="0" r="5" fill={cyan} opacity="0.15" />
                <circle cx="15" cy="0" r="5" fill={cyan} opacity="0.15" />
              </g>
            </g>

            {/* Speech Waveform interface */}
            {status === AssistantStatus.SPEAKING && (
              <g transform="translate(100, 115)">
                <ellipse cx="0" cy="0" rx="6" ry="2" fill={cyan} className="animate-pulse" />
                <circle cx="0" cy="0" r="12" stroke={cyan} strokeWidth="0.5" fill="none" className="animate-ping" />
              </g>
            )}

            {/* Synaptic Core */}
            <g transform="translate(100, 175)">
              <circle r="16" fill="#020617" stroke={magenta} strokeWidth="0.5" opacity="0.6" />
              <circle r="6" fill={cyan} className={status === AssistantStatus.THINKING ? 'animate-pulse' : 'opacity-30'} />
            </g>
          </svg>
        ) : avatarType === 'arachnid' ? (
          <svg viewBox="0 0 200 200" className={`w-64 h-64 md:w-80 md:h-80 relative z-10 transition-all duration-700`}>
            <g stroke={cyan} strokeWidth="3" fill="none" strokeLinecap="round" opacity={opacity}>
              <path d="M80,80 L40,40 L20,80" className="animate-pulse" />
              <path d="M80,110 L30,110 L10,140" className="animate-pulse" style={{ animationDelay: '0.3s' }} />
              <path d="M120,80 L160,40 L180,80" className="animate-pulse" style={{ animationDelay: '0.6s' }} />
              <path d="M120,110 L170,110 L190,140" className="animate-pulse" style={{ animationDelay: '0.9s' }} />
            </g>
            <path d="M75,100 L125,100 L135,130 L100,160 L65,130 Z" fill="#020617" stroke={cyan} strokeWidth="2.5" />
            <circle cx="100" cy="115" r="4" fill={magenta} className={status !== AssistantStatus.IDLE ? 'animate-ping' : ''} />
          </svg>
        ) : (
          /* CORE PROTOCOL */
          <div className={`w-40 h-40 md:w-56 md:h-56 relative flex items-center justify-center transition-all duration-1000 ${status !== AssistantStatus.IDLE ? 'animate-breathing' : ''}`}>
             <div className="absolute inset-0 border-2 border-cyan-500/20 rounded-[2rem] rotate-45 animate-orbit-slow" style={{ animationDuration: '10s' }}></div>
             <div className="absolute inset-0 border-2 border-purple-500/20 rounded-[2.5rem] -rotate-45 animate-orbit-slow" style={{ animationDuration: '15s' }}></div>
             <div className="w-20 h-20 md:w-28 md:h-28 bg-[#020617] border-2 border-cyan-400 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(34,211,238,0.3)]">
                <Hexagon className={`w-10 h-10 md:w-14 md:h-14 transition-colors duration-1000 ${status !== AssistantStatus.IDLE ? 'text-cyan-400' : 'text-slate-800'}`} />
             </div>
          </div>
        )}
      </div>
      
      {/* Subtitle Interface */}
      <div className="mt-16 text-center max-w-sm px-10">
        <div className="inline-flex items-center space-x-4 bg-white/[0.03] border border-white/10 px-8 py-3 rounded-full mb-8 shadow-2xl backdrop-blur-3xl ring-1 ring-white/5 group-hover:scale-105 transition-transform duration-700">
           <Sparkles className={`w-4 h-4 transition-all duration-1000 ${status !== AssistantStatus.IDLE ? 'text-cyan-400 drop-shadow-[0_0_8px_#22d3ee]' : 'text-slate-700'}`} />
           <span className="text-[11px] font-black text-slate-400 tracking-[0.4em] uppercase">
             {avatarType.toUpperCase()} ENGINE ACTIVE
           </span>
        </div>
        
        <h2 className="text-5xl md:text-6xl font-black google-font tracking-tighter text-white transition-all duration-700 group-hover:tracking-normal">
          KING <span style={{ color: magenta }} className={`transition-all duration-1000 ${status === AssistantStatus.THINKING ? 'animate-pulse' : ''}`}>AI</span>
        </h2>
        
        <div className="mt-8 h-10 flex items-center justify-center">
          <p className={`text-slate-500 font-black text-[11px] tracking-[0.5em] uppercase transition-all duration-1000 ${status !== AssistantStatus.IDLE ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            {status === AssistantStatus.LISTENING && 'Monitoring Neural Stream'}
            {status === AssistantStatus.THINKING && 'Processing Logic Drift'}
            {status === AssistantStatus.SPEAKING && 'Streaming Synthesis'}
            {status === AssistantStatus.ERROR && 'Critical Neural Breach'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AssistantOrb;
