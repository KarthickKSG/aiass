
import React from 'react';
import { DeviceState } from '../types';

interface DeviceDashboardProps {
  state: DeviceState;
}

const DeviceDashboard: React.FC<DeviceDashboardProps> = ({ state }) => {
  const controls = [
    { label: 'Wi-Fi', active: state.wifi, icon: '📶' },
    { label: 'Bluetooth', active: state.bluetooth, icon: '🦷' },
    { label: 'Mobile Data', active: state.mobileData, icon: '🌐' },
    { label: 'Airplane', active: state.airplaneMode, icon: '✈️' },
    { label: 'Flashlight', active: state.flashlight, icon: '🔦' },
    { label: 'Silent', active: state.silentMode, icon: '🔕' },
    { label: 'Gaming', active: state.gamingMode, icon: '🎮' },
  ];

  return (
    <div className="bg-slate-800/50 backdrop-blur-md rounded-3xl p-6 border border-slate-700/50">
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4 px-2">System Controls</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {controls.map((control) => (
          <div 
            key={control.label}
            className={`p-4 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 ${
              control.active ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-slate-900/40 text-slate-500 border border-transparent'
            }`}
          >
            <span className="text-2xl mb-2">{control.icon}</span>
            <span className="text-xs font-bold">{control.label}</span>
          </div>
        ))}
      </div>
      
      <div className="mt-6 space-y-4 px-2">
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold text-slate-400">
            <span>BRIGHTNESS</span>
            <span>{state.brightness}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-yellow-400 transition-all duration-500" 
              style={{ width: `${state.brightness}%` }}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold text-slate-400">
            <span>VOLUME</span>
            <span>{state.volume}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-500" 
              style={{ width: `${state.volume}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceDashboard;
