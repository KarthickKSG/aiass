
import React from 'react';
import { Notification } from '../types';

interface NotificationPanelProps {
  notifications: Notification[];
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ notifications }) => {
  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4 px-2">Notifications</h3>
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
        {notifications.length === 0 ? (
          <div className="text-center py-10 text-slate-600 italic">No recent activity</div>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-2xl flex items-start space-x-3 hover:bg-slate-800/60 transition-colors">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shrink-0">
                {n.sender[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-slate-200 truncate">{n.sender}</span>
                  <span className="text-[10px] text-slate-500 uppercase">{n.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-sm text-slate-400 line-clamp-2 mt-1 leading-relaxed">
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
