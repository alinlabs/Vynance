import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Calendar, Target, Info, CheckCircle2, Trash2, ArrowLeft } from 'lucide-react';
import { Notification } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import { useNavigate } from 'react-router-dom';

interface NotificationsPageProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
}

export default function NotificationsPage({ notifications, onMarkAsRead }: NotificationsPageProps) {
  const { t } = useSettings();
  const navigate = useNavigate();

  const sortedNotifications = [...notifications].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const getTypeIcon = (type: Notification['type']) => {
    switch (type) {
      case 'debt': return <Calendar className="text-orange-500" size={20} />;
      case 'savings': return <Target className="text-blue-500" size={20} />;
      case 'info': return <Info className="text-slate-500" size={20} />;
      default: return <Bell className="text-slate-500" size={20} />;
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-2 md:hidden">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-400 hover:text-slate-600">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('Notifikasi')}</h2>
        <div className="w-10"></div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Bell size={20} className="text-blue-500" />
            {t('Semua Notifikasi')}
          </h3>
          {notifications.length > 0 && (
            <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold">
              {notifications.filter(n => !n.isRead).length} {t('Baru')}
            </span>
          )}
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {sortedNotifications.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell size={32} className="text-slate-300 dark:text-slate-600" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">{t('Tidak ada notifikasi baru')}</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {sortedNotifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={`p-5 flex gap-4 transition-colors ${notification.isRead ? 'opacity-60' : 'bg-blue-50/30 dark:bg-blue-500/5'}`}
                >
                  <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${
                    notification.type === 'debt' ? 'bg-orange-100 dark:bg-orange-500/10' :
                    notification.type === 'savings' ? 'bg-blue-100 dark:bg-blue-500/10' :
                    'bg-slate-100 dark:bg-slate-800'
                  }`}>
                    {getTypeIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className={`font-bold text-slate-900 dark:text-slate-100 truncate ${notification.isRead ? 'font-semibold' : ''}`}>
                        {notification.title}
                      </h4>
                      <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 whitespace-nowrap ml-2">
                        {new Date(notification.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {notification.message}
                    </p>
                    
                    <div className="mt-3 flex items-center gap-3">
                      {!notification.isRead && (
                        <button
                          onClick={() => onMarkAsRead(notification.id)}
                          className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          <CheckCircle2 size={14} />
                          {t('Tandai Selesai')}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
