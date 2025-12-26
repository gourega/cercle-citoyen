
import React from 'react';
import { X, BellRing, Sparkles, Award, ArrowRight, MessageSquare, History } from 'lucide-react';
import { CitizenNotification } from '../types';

interface NotificationDrawerProps {
  notifications: CitizenNotification[];
  onClose: () => void;
  onMarkRead: (id: string) => void;
}

const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ notifications, onClose, onMarkRead }) => {
  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col">
        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-blue-50/30">
          <div>
            <h2 className="text-2xl font-serif font-bold text-gray-900">Appels du Tambour</h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mt-1">Le pouls de votre engagement</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white rounded-2xl transition-all">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {notifications.length > 0 ? (
            notifications.map((n) => (
              <div 
                key={n.id} 
                className={`p-6 rounded-[2rem] border transition-all hover:shadow-md group relative overflow-hidden ${n.isRead ? 'bg-white border-gray-100' : 'bg-blue-50/50 border-blue-100 ring-1 ring-blue-50'}`}
              >
                {!n.isRead && <div className="absolute top-6 right-6 w-2 h-2 bg-blue-600 rounded-full"></div>}
                
                <div className="flex gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    n.type === 'drum_call' ? 'bg-amber-100 text-amber-600' : 
                    n.type === 'wisdom_echo' ? 'bg-blue-100 text-blue-600' : 
                    'bg-emerald-100 text-emerald-600'
                  }`}>
                    {n.type === 'drum_call' ? <BellRing size={18} /> : 
                     n.type === 'wisdom_echo' ? <Sparkles size={18} /> : 
                     <Award size={18} />}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm mb-1">{n.title}</h4>
                    <p className="text-xs text-gray-500 leading-relaxed mb-3">{n.message}</p>
                    <div className="flex items-center gap-4">
                      <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{n.timestamp}</span>
                      {!n.isRead && (
                        <button 
                          onClick={() => onMarkRead(n.id)}
                          className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                        >
                          Marquer comme lu
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-30">
              <History size={48} className="mb-4 text-gray-300" />
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Aucun écho récent</p>
            </div>
          )}
        </div>

        <div className="p-8 border-t border-gray-50 bg-gray-50/50">
          <button className="w-full flex items-center justify-center gap-3 py-4 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors">
            Voir tout l'historique <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationDrawer;
