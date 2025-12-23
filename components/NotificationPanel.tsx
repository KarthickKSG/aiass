
import React from 'react';
import { Notification } from '../types';
import { Bell, MessageSquare, Calendar, AlertCircle } from 'lucide-react';

interface NotificationPanelProps {
  notifications: Notification[];
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ notifications }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageSquare className="w-4 h-4 text-blue-400" />;
      case 'schedule': return <Calendar className="w-4 h-4 text-purple-400" />;
      case 'alert': return <AlertCircle className="w-4 h-4 text-orange-400" />;
      default: return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col w-full">
      <div className="flex items-center justify-between mb-3 px-2">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Feeds</h3>
        <span className="text-[9px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-bold">LIVE</span>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-hide">
        {notifications.length === 0 ? (
          <div className="text-center py-6 text-slate-700 text-xs font-medium border border-dashed border-slate-800 rounded-2xl">
            Neutral System State
          </div>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className="bg-slate-900/60 border border-white/5 p-4 rounded-2xl flex items-start space-x-3 active:bg-slate-800 transition-all">
              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/5 flex items-center justify-center shrink-0 shadow-inner">
                {getIcon(n.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-200 text-xs truncate">{n.sender}</span>
                  <span className="text-[9px] font-bold text-slate-600 uppercase tabular-nums">
                    {n.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2 mt-1 font-medium leading-relaxed">
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
