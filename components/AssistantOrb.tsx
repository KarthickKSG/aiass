
import React from 'react';
import { AssistantStatus } from '../types';

interface AssistantOrbProps {
  status: AssistantStatus;
}

const AssistantOrb: React.FC<AssistantOrbProps> = ({ status }) => {
  const getGlowColor = () => {
    switch (status) {
      case AssistantStatus.LISTENING: return 'bg-cyan-400 shadow-[0_0_50px_rgba(34,211,238,0.8)] scale-110';
      case AssistantStatus.SPEAKING: return 'bg-blue-500 shadow-[0_0_60px_rgba(59,130,246,0.9)] scale-105';
      case AssistantStatus.THINKING: return 'bg-purple-500 shadow-[0_0_40px_rgba(168,85,247,0.7)] animate-pulse';
      case AssistantStatus.ERROR: return 'bg-red-500 shadow-[0_0_40px_rgba(239,68,68,0.7)]';
      default: return 'bg-slate-700 shadow-[0_0_20px_rgba(71,85,105,0.4)]';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 md:p-12">
      <div className={`relative w-36 h-36 md:w-48 md:h-48 rounded-full transition-all duration-500 flex items-center justify-center ${getGlowColor()}`}>
        {status === AssistantStatus.THINKING && (
          <div className="absolute inset-0 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        )}
        
        <div className="flex items-center space-x-1">
          {[...Array(5)].map((_, i) => (
            <div 
              key={i}
              className={`w-1 md:w-1.5 bg-white rounded-full transition-all duration-150 ${
                status === AssistantStatus.LISTENING || status === AssistantStatus.SPEAKING 
                  ? 'animate-bounce' 
                  : 'h-4 opacity-50'
              }`}
              style={{ 
                animationDelay: `${i * 0.1}s`,
                height: status === AssistantStatus.LISTENING || status === AssistantStatus.SPEAKING ? '1.5rem' : '0.4rem'
              }}
            />
          ))}
        </div>
      </div>
      <div className="mt-6 md:mt-8 text-center">
        <h2 className="text-2xl md:text-3xl font-bold google-font tracking-tight">KING</h2>
        <p className="text-slate-400 mt-1 md:mt-2 font-medium text-sm md:text-base">
          {status === AssistantStatus.IDLE && 'Say "Hey King" to activate'}
          {status === AssistantStatus.LISTENING && 'Listening...'}
          {status === AssistantStatus.THINKING && 'Thinking...'}
          {status === AssistantStatus.SPEAKING && 'King is speaking'}
          {status === AssistantStatus.ERROR && 'Check Permissions'}
        </p>
      </div>
    </div>
  );
};

export default AssistantOrb;
