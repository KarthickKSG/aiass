import React from 'react';
import { Notification } from '../types';
import { Bell, MessageSquare, Calendar, AlertCircle, Terminal } from 'lucide-react';

interface NotificationPanelProps { notifications: Notification[]; }

const NotificationPanel: React.FC<NotificationPanelProps> = ({ notifications }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />;
      case 'schedule': return <Calendar className="w-3.5 h-3.5 text-purple-400" />;
      case 'alert': return <AlertCircle className="w-3.5 h-3.5 text-orange-400" />;
      default: return <Bell className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col w-full">
      <div className="flex items-center justify-between mb-5 px-1">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center">
          <Terminal className="w-3 h-3 mr-2" /> Synaptic History
        </h3>
        <div className="flex items-center space-x-1">
           <div className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse"></div>
           <span className="text-[8px] text-cyan-400/80 font-black uppercase tracking-widest">Syncing</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
        {notifications.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-700 space-y-2">
            <div className="w-8 h-8 rounded-full border border-slate-800 flex items-center justify-center">
              <Bell className="w-4 h-4 opacity-20" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Neutral Core State</span>
          </div>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className="group glass border-white/5 p-4 rounded-[1.2rem] flex items-start space-x-4 transition-all hover:bg-white/5">
              <div className="w-9 h-9 rounded-xl bg-slate-800/50 border border-white/5 flex items-center justify-center shrink-0 group-hover:border-cyan-500/30 transition-colors">
                {getIcon(n.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-black text-slate-200 text-[10px] tracking-tight uppercase">{n.sender}</span>
                  <span className="text-[8px] font-bold text-slate-600 uppercase tabular-nums">
                    {n.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed group-hover:text-slate-400 transition-colors">
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