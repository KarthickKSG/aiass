
import React from 'react';
import { AssistantStatus } from '../types';

interface AIAvatarProps {
  status: AssistantStatus;
}

const AssistantOrb: React.FC<AIAvatarProps> = ({ status }) => {
  const getColors = () => {
    switch (status) {
      case AssistantStatus.LISTENING: return { cyan: '#00f2ff', magenta: '#bc13fe', primary: '#00f2ff', opacity: 1, glow: '0 0 20px #00f2ff' };
      case AssistantStatus.SPEAKING: return { cyan: '#00f2ff', magenta: '#bc13fe', primary: '#00f2ff', opacity: 1, glow: '0 0 30px #00f2ff' };
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
    @keyframes vocalize {
      0%, 100% { transform: scaleY(1); }
      50% { transform: scaleY(3.5); }
    }
    @keyframes particle-up {
      0% { transform: translateY(0) scale(1); opacity: 1; }
      100% { transform: translateY(-45px) scale(0); opacity: 0; }
    }
    @keyframes code-scroll {
      0% { transform: translateY(0); }
      100% { transform: translateY(-20px); }
    }
    @keyframes eye-glow {
      0%, 100% { filter: drop-shadow(0 0 2px ${cyan}); opacity: 0.8; }
      50% { filter: drop-shadow(0 0 10px ${cyan}); opacity: 1; }
    }
    @keyframes eye-rapid-fire {
      0%, 100% { filter: drop-shadow(0 0 2px ${cyan}); opacity: 0.8; transform: scale(1); }
      25% { filter: drop-shadow(0 0 15px #fff); opacity: 1; transform: scale(1.3); }
      50% { filter: drop-shadow(0 0 5px ${cyan}); opacity: 0.9; transform: scale(1.1); }
    }
    @keyframes bracket-listening {
      0%, 100% { opacity: 0.4; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.1); }
    }
    @keyframes bracket-speak {
      0%, 100% { opacity: 0.6; transform: scale(1) translateX(0); }
      50% { opacity: 1; transform: scale(1.06) translateX(4px); }
    }
    @keyframes abdomen-throb {
      0%, 100% { filter: drop-shadow(0 0 5px ${magenta}44); transform: scale(1); opacity: 0.9; }
      50% { filter: drop-shadow(0 0 20px ${magenta}); transform: scale(1.04); opacity: 1; }
    }
    .animate-spider-float { animation: spider-float 4s ease-in-out infinite; }
    .animate-vocalize { animation: vocalize 0.12s ease-in-out infinite; transform-origin: center; }
    .animate-particle { animation: particle-up 1.2s ease-out infinite; }
    .animate-code-scroll { animation: code-scroll 2s linear infinite; }
    .animate-eye-glow { animation: eye-glow 0.8s ease-in-out infinite; }
    .animate-eye-rapid-fire { animation: eye-rapid-fire 0.25s ease-in-out infinite; transform-origin: center; }
    .animate-bracket-listening { animation: bracket-listening 1.5s ease-in-out infinite; }
    .animate-bracket-speak { animation: bracket-speak 0.6s ease-in-out infinite; }
    .animate-abdomen-throb { animation: abdomen-throb 1s ease-in-out infinite; transform-origin: center; }
  `;

  return (
    <div className="flex flex-col items-center justify-center p-4" aria-label={`Arachnid Avatar status: ${status}`}>
      <style>{styles}</style>
      <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
        
        {/* Background Atmosphere */}
        <div 
          className="absolute inset-0 rounded-full blur-[100px] opacity-10 transition-all duration-1000"
          style={{ backgroundColor: primary }}
        ></div>

        {/* Framing Brackets < > */}
        <div className="absolute inset-0 flex justify-between items-center px-4 pointer-events-none">
          <div 
            className={`text-6xl md:text-8xl font-light google-font transition-all duration-500 ${
              status === AssistantStatus.LISTENING ? 'animate-bracket-listening text-cyan-400' : 
              status === AssistantStatus.SPEAKING ? 'animate-bracket-speak text-cyan-400' : ''
            }`}
            style={{ color: cyan, textShadow: glow }}
          >
            &lt;
          </div>
          <div 
            className={`text-6xl md:text-8xl font-light google-font transition-all duration-500 ${
              status === AssistantStatus.LISTENING ? 'animate-bracket-listening text-cyan-400' : 
              status === AssistantStatus.SPEAKING ? 'animate-bracket-speak text-cyan-400' : ''
            }`}
            style={{ 
              color: cyan, 
              textShadow: glow,
              transform: status === AssistantStatus.SPEAKING ? 'scaleX(-1)' : 'none'
            }}
          >
            &gt;
          </div>
        </div>

        {/* The Mechanical Spider SVG */}
        <svg 
          viewBox="0 0 200 200" 
          className={`w-48 h-48 md:w-64 md:h-64 relative z-10 transition-all duration-500 ${status !== AssistantStatus.IDLE ? 'animate-spider-float' : ''}`}
        >
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

          {/* Thinking Particles */}
          {status === AssistantStatus.THINKING && (
            <g>
              <circle cx="100" cy="140" r="2.5" fill={magenta} className="animate-particle" style={{ animationDelay: '0s' }} />
              <circle cx="85" cy="130" r="1.5" fill={cyan} className="animate-particle" style={{ animationDelay: '0.3s' }} />
              <circle cx="115" cy="135" r="1.2" fill={magenta} className="animate-particle" style={{ animationDelay: '0.6s' }} />
              <circle cx="95" cy="150" r="2" fill={cyan} className="animate-particle" style={{ animationDelay: '0.9s' }} />
              <circle cx="105" cy="125" r="1" fill={magenta} className="animate-particle" style={{ animationDelay: '1.2s' }} />
            </g>
          )}

          {/* Legs - Left Side */}
          <g stroke={cyan} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity={opacity}>
            <path d="M85,80 L50,50 L35,80" className={status !== AssistantStatus.IDLE ? 'animate-pulse' : ''} />
            <path d="M80,95 L40,85 L25,120" style={{ animationDelay: '0.1s' }} className={status !== AssistantStatus.IDLE ? 'animate-pulse' : ''} />
            <path d="M85,115 L45,135 L40,165" style={{ animationDelay: '0.2s' }} className={status !== AssistantStatus.IDLE ? 'animate-pulse' : ''} />
            <path d="M95,125 L75,155 L70,185" style={{ animationDelay: '0.3s' }} className={status !== AssistantStatus.IDLE ? 'animate-pulse' : ''} />
          </g>

          {/* Legs - Right Side */}
          <g stroke={cyan} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity={opacity}>
            <path d="M115,80 L150,50 L165,80" className={status !== AssistantStatus.IDLE ? 'animate-pulse' : ''} />
            <path d="M120,95 L160,85 L175,120" style={{ animationDelay: '0.1s' }} className={status !== AssistantStatus.IDLE ? 'animate-pulse' : ''} />
            <path d="M115,115 L155,135 L160,165" style={{ animationDelay: '0.2s' }} className={status !== AssistantStatus.IDLE ? 'animate-pulse' : ''} />
            <path d="M105,125 L125,155 L130,185" style={{ animationDelay: '0.3s' }} className={status !== AssistantStatus.IDLE ? 'animate-pulse' : ''} />
          </g>

          {/* Thorax (Middle Body) */}
          <path d="M85,85 L115,85 L125,110 L100,125 L75,110 Z" fill="url(#spiderBody)" stroke={cyan} strokeWidth="1" />

          {/* Abdomen (Core) */}
          <g transform="translate(75, 110)">
            <path 
              d="M0,0 L50,0 L40,55 L25,70 L10,55 Z" 
              fill="#020617" 
              stroke={magenta} 
              strokeWidth="1.5" 
              filter="url(#neonGlow)" 
              className={status === AssistantStatus.SPEAKING ? 'animate-abdomen-throb' : ''}
            />
            {/* Interior Code Pattern with Seamless Scroll */}
            <clipPath id="abdomenClip">
              <path d="M0,0 L50,0 L40,55 L25,70 L10,55 Z" />
            </clipPath>
            <g opacity="0.6" clipPath="url(#abdomenClip)">
               <g className={status === AssistantStatus.THINKING ? 'animate-code-scroll' : ''}>
                  <rect x="10" y="15" width="30" height="2" fill={cyan} />
                  <rect x="15" y="25" width="20" height="2" fill={cyan} />
                  <rect x="10" y="35" width="30" height="2" fill={magenta} />
                  <rect x="20" y="45" width="10" height="2" fill={cyan} />
                  
                  {/* Seamless continuation for animation */}
                  <rect x="10" y="65" width="30" height="2" fill={cyan} />
                  <rect x="15" y="75" width="20" height="2" fill={cyan} />
                  <rect x="10" y="85" width="30" height="2" fill={magenta} />
                  <rect x="20" y="95" width="10" height="2" fill={cyan} />
               </g>
            </g>
          </g>

          {/* Head & Eyes */}
          <g>
            <path d="M90,85 L110,85 L105,70 L95,70 Z" fill="#0f172a" stroke={cyan} strokeWidth="1" />
            
            {/* Eyes */}
            <circle 
              cx="96" cy="78" r="1.5" 
              fill={cyan} 
              className={
                status === AssistantStatus.LISTENING ? 'animate-eye-glow' : 
                status === AssistantStatus.SPEAKING ? 'animate-eye-rapid-fire' : ''
              } 
            />
            <circle 
              cx="104" cy="78" r="1.5" 
              fill={cyan} 
              className={
                status === AssistantStatus.LISTENING ? 'animate-eye-glow' : 
                status === AssistantStatus.SPEAKING ? 'animate-eye-rapid-fire' : ''
              } 
            />

            {/* Vocalizer (Equalizer-style Mouth) */}
            {status === AssistantStatus.SPEAKING && (
              <g transform="translate(93, 82)">
                <rect x="1" y="0" width="1.5" height="1" fill={cyan} className="animate-vocalize" style={{ animationDelay: '0s' }} />
                <rect x="4" y="0" width="1.5" height="1" fill={cyan} className="animate-vocalize" style={{ animationDelay: '0.04s' }} />
                <rect x="7" y="0" width="1.5" height="1" fill={cyan} className="animate-vocalize" style={{ animationDelay: '0.08s' }} />
                <rect x="10" y="0" width="1.5" height="1" fill={cyan} className="animate-vocalize" style={{ animationDelay: '0.12s' }} />
              </g>
            )}
          </g>
        </svg>

        {/* Neural Transmission Pulse */}
        {status === AssistantStatus.SPEAKING && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-48 h-48 border-2 border-cyan-500/15 rounded-full animate-[ping_1.5s_linear_infinite]"></div>
            <div className="w-48 h-48 border-2 border-magenta-500/10 rounded-full animate-[ping_2s_linear_infinite]"></div>
          </div>
        )}
      </div>
      
      <div className="mt-8 text-center">
        <div className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full mb-4 shadow-xl">
           <div className={`w-2 h-2 rounded-full transition-all duration-500 ${status !== AssistantStatus.IDLE ? 'bg-cyan-400 animate-pulse shadow-[0_0_12px_#00f2ff]' : 'bg-slate-700'}`}></div>
           <span className="text-[10px] font-black text-slate-300 tracking-[0.2em] uppercase">Neural Engine V4.5</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-black google-font tracking-tighter text-white">
          KING <span style={{ color: magenta }} className={status === AssistantStatus.THINKING ? 'animate-pulse' : ''}>AI</span>
        </h2>
        <p className="text-slate-500 font-bold text-[9px] tracking-[0.4em] uppercase mt-2">
          {status === AssistantStatus.IDLE && 'Standby Mode'}
          {status === AssistantStatus.LISTENING && 'Listening to user frequency...'}
          {status === AssistantStatus.THINKING && 'Processing synaptic request...'}
          {status === AssistantStatus.SPEAKING && 'Transmitting response...'}
          {status === AssistantStatus.ERROR && 'Sync failure detected'}
        </p>
      </div>
    </div>
  );
};

export default AssistantOrb;
