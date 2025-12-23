
import React from 'react';
import { Notification } from '../types';
import { Bell, MessageSquare, Calendar, AlertCircle, Terminal, Cpu } from 'lucide-react';

interface NotificationPanelProps { notifications: Notification[]; }

const NotificationPanel: React.FC<NotificationPanelProps> = ({ notifications }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageSquare className="w-4 h-4 text-cyan-400" />;
      case 'schedule': return <Calendar className="w-4 h-4 text-purple-400" />;
      case 'alert': return <AlertCircle className="w-4 h-4 text-orange-400" />;
      default: return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="flex-1 h-full overflow-hidden flex flex-col w-full relative z-10">
      <div className="flex items-center justify-between mb-6 px-2">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center">
          <Terminal className="w-3.5 h-3.5 mr-2.5" /> Synaptic Log
        </h3>
        <div className="flex items-center space-x-2 bg-cyan-500/5 px-3 py-1 rounded-full border border-cyan-500/10">
           <Cpu className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
           <span className="text-[8px] text-cyan-400 font-black uppercase tracking-widest">Live Sync</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-4 pr-3 scrollbar-hide">
        {notifications.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-700 space-y-4">
            <div className="w-12 h-12 rounded-full border border-slate-800/50 flex items-center justify-center">
              <Bell className="w-5 h-5 opacity-20" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Awaiting Transmissions...</span>
          </div>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className="group bg-white/5 border border-white/5 p-4 rounded-[1.5rem] flex items-start space-x-5 transition-all hover:bg-white/[0.08] hover:border-cyan-500/20 active:scale-[0.99]">
              <div className="w-10 h-10 rounded-2xl bg-slate-900/80 border border-white/5 flex items-center justify-center shrink-0 group-hover:bg-cyan-500/10 transition-colors shadow-inner">
                {getIcon(n.type)}
              </div>
              <div className="flex-1 min-w-0 py-0.5">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-black text-slate-200 text-[10px] tracking-wider uppercase">{n.sender}</span>
                  <span className="text-[9px] font-bold text-slate-600 uppercase tabular-nums tracking-tighter">
                    {n.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                <p className="text-[12px] text-slate-400 font-medium leading-relaxed group-hover:text-slate-300 transition-colors">
                  {n.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
