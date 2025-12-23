import React from 'react';
import { DeviceState } from '../types';
import { Activity, Zap, Cpu } from 'lucide-react';

interface DeviceDashboardProps {
  state: DeviceState;
}

const DeviceDashboard: React.FC<DeviceDashboardProps> = ({ state }) => {
  const controls = [
    { label: 'Wi-Fi', active: state.wifi },
    { label: 'Bluetooth', active: state.bluetooth },
    { label: 'Mobile', active: state.mobileData },
    { label: 'Gaming', active: state.gamingMode },
  ];

  return (
    <div className="glass rounded-[2rem] p-5 space-y-6">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Quantum Metrics</h3>
        <Activity className="w-3 h-3 text-cyan-400 animate-pulse" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {controls.map((control) => (
          <div 
            key={control.label}
            className={`p-3 rounded-2xl flex items-center space-x-3 transition-all duration-500 border ${
              control.active 
              ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' 
              : 'bg-white/5 border-white/5 text-slate-500'
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${control.active ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]' : 'bg-slate-700'}`}></div>
            <span className="text-[10px] font-bold uppercase tracking-wider">{control.label}</span>
          </div>
        ))}
      </div>
      
      <div className="space-y-4 px-1">
        <div className="space-y-2">
          <div className="flex justify-between text-[9px] font-black text-slate-500 uppercase tracking-widest">
            <span className="flex items-center"><Zap className="w-2.5 h-2.5 mr-1" /> Neural Energy</span>
            <span>{state.brightness}%</span>
          </div>
          <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-cyan-600 to-blue-400 transition-all duration-1000" 
              style={{ width: `${state.brightness}%` }}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-[9px] font-black text-slate-500 uppercase tracking-widest">
            <span className="flex items-center"><Cpu className="w-2.5 h-2.5 mr-1" /> Synaptic Volume</span>
            <span>{state.volume}%</span>
          </div>
          <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-600 to-purple-400 transition-all duration-1000" 
              style={{ width: `${state.volume}%` }}
            />
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-white/5 flex items-center justify-between px-1">
         <span className="text-[8px] font-bold text-slate-600 uppercase tracking-tighter">Integrity: 99.8%</span>
         <div className="flex space-x-1">
           <div className="w-1 h-3 bg-cyan-400/50 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
           <div className="w-1 h-2 bg-cyan-400/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
           <div className="w-1 h-4 bg-cyan-400/50 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
         </div>
      </div>
    </div>
  );
};

export default DeviceDashboard;