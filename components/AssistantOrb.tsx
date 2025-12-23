
import React from 'react';
import { AssistantStatus } from '../types';

interface AssistantOrbProps {
  status: AssistantStatus;
}

const AssistantOrb: React.FC<AssistantOrbProps> = ({ status }) => {
  const getGlowStyles = () => {
    switch (status) {
      case AssistantStatus.LISTENING: 
        return 'bg-cyan-400 shadow-[0_0_80px_rgba(34,211,238,0.6)] scale-110 border-4 border-cyan-300/50';
      case AssistantStatus.SPEAKING: 
        return 'bg-blue-600 shadow-[0_0_100px_rgba(37,99,235,0.7)] scale-105 border-4 border-blue-400/50';
      case AssistantStatus.THINKING: 
        return 'bg-indigo-500 shadow-[0_0_50px_rgba(99,102,241,0.5)] animate-pulse border-4 border-indigo-400/30';
      case AssistantStatus.ERROR: 
        return 'bg-red-500 shadow-[0_0_60px_rgba(239,68,68,0.5)] border-4 border-red-400/40';
      default: 
        return 'bg-slate-800 shadow-[0_0_30px_rgba(15,23,42,0.8)] border-4 border-slate-700/30';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative">
        {/* Outer Ring Animation */}
        {(status === AssistantStatus.LISTENING || status === AssistantStatus.SPEAKING) && (
          <div className="absolute inset-[-20px] rounded-full border border-blue-500/20 animate-ping opacity-50"></div>
        )}
        
        <div className={`relative w-40 h-40 md:w-56 md:h-56 rounded-full transition-all duration-700 flex items-center justify-center overflow-hidden ${getGlowStyles()}`}>
          {/* Internal Plasma Effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent animate-spin-slow"></div>
          
          <div className="flex items-end space-x-1 z-10">
            {[...Array(7)].map((_, i) => (
              <div 
                key={i}
                className={`w-1 md:w-1.5 bg-white rounded-full transition-all duration-300 ${
                  (status === AssistantStatus.LISTENING || status === AssistantStatus.SPEAKING) 
                    ? 'animate-wave' 
                    : 'h-2 opacity-30'
                }`}
                style={{ 
                  animationDelay: `${i * 0.15}s`,
                  height: (status === AssistantStatus.LISTENING || status === AssistantStatus.SPEAKING) ? '2rem' : '0.5rem'
                }}
              />
            ))}
          </div>
        </div>
      </div>
      
      <div className="mt-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <h2 className="text-3xl md:text-4xl font-black google-font tracking-tighter text-white uppercase italic">
          {status === AssistantStatus.IDLE ? 'STANDBY' : status}
        </h2>
        <div className="flex items-center justify-center space-x-2 mt-2">
          <div className={`w-2 h-2 rounded-full ${status !== AssistantStatus.IDLE ? 'bg-green-500 animate-pulse' : 'bg-slate-700'}`}></div>
          <p className="text-slate-500 font-bold text-[10px] tracking-[0.3em] uppercase">
            {status === AssistantStatus.IDLE && 'Awaiting Initialization'}
            {status === AssistantStatus.LISTENING && 'Listening for Input'}
            {status === AssistantStatus.THINKING && 'Processing Intelligence'}
            {status === AssistantStatus.SPEAKING && 'King Transmitting'}
            {status === AssistantStatus.ERROR && 'System Override Required'}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes wave {
          0%, 100% { height: 1.5rem; }
          50% { height: 4rem; }
        }
        .animate-wave {
          animation: wave 1.2s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default AssistantOrb;
