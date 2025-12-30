
import React from 'react';
import { DeviceState } from '../types';
import { Activity, Zap, Cpu, BarChart3 } from 'lucide-react';

interface DeviceDashboardProps {
  state: DeviceState;
}

const DeviceDashboard: React.FC<DeviceDashboardProps> = ({ state }) => {
  const controls = [
    { label: 'Wi-Fi', active: state.wifi },
    { label: 'Bluetooth', active: state.bluetooth },
    { label: 'Network', active: state.mobileData },
    { label: 'Gaming', active: state.gamingMode },
  ];

  return (
    <div className="glass rounded-[2.5rem] p-6 space-y-7 shadow-inner border-white/5 ring-1 ring-white/5">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center">
          <BarChart3 className="w-3.5 h-3.5 mr-2.5" /> Hardware Metrics
        </h3>
        <Activity className="w-3 h-3 text-cyan-400 animate-pulse" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {controls.map((control) => (
          <div 
            key={control.label}
            className={`p-4 rounded-2xl flex items-center justify-between transition-all duration-700 border ${
              control.active 
              ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_5px_15px_rgba(34,211,238,0.1)]' 
              : 'bg-white/5 border-white/5 text-slate-600'
            }`}
          >
            <span className="text-[10px] font-black uppercase tracking-widest">{control.label}</span>
            <div className={`w-2 h-2 rounded-full ${control.active ? 'bg-cyan-400 shadow-[0_0_12px_#22d3ee]' : 'bg-slate-800'}`}></div>
          </div>
        ))}
      </div>
      
      <div className="space-y-5 px-1 pt-2">
        <div className="space-y-2.5">
          <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
            <span className="flex items-center"><Zap className="w-3 h-3 mr-2 text-cyan-400" /> Neural Energy</span>
            <span className="text-cyan-400">{state.brightness}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-900/80 rounded-full overflow-hidden p-[1px] ring-1 ring-white/5">
            <div 
              className="h-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-blue-400 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(34,211,238,0.3)]" 
              style={{ width: `${state.brightness}%` }}
            />
          </div>
        </div>
        
        <div className="space-y-2.5">
          <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
            <span className="flex items-center"><Cpu className="w-3 h-3 mr-2 text-purple-400" /> Synaptic Vol</span>
            <span className="text-purple-400">{state.volume}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-900/80 rounded-full overflow-hidden p-[1px] ring-1 ring-white/5">
            <div 
              className="h-full bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(168,85,247,0.3)]" 
              style={{ width: `${state.volume}%` }}
            />
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-white/5 flex items-center justify-between px-2">
         <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Integrity: 99.98%</span>
         <div className="flex space-x-1.5">
           <div className="w-1 h-3 bg-cyan-400/40 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
           <div className="w-1 h-4 bg-cyan-400/40 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
           <div className="w-1 h-2 bg-cyan-400/40 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
         </div>
      </div>
    </div>
  );
};

export default DeviceDashboard;
