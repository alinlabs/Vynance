import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Target, Wrench, Settings, ChevronRight } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { Tab } from './Sidebar';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

export default function MobileMenu({ isOpen, onClose, activeTab, setActiveTab }: MobileMenuProps) {
  const { t } = useSettings();

  const menuItems = [
    { id: 'rencana', label: t('Rencana Tabungan'), icon: Target, description: t('Atur target masa depan') },
    { id: 'tools', label: t('Alat Bantu'), icon: Wrench, description: t('Kalkulator & Analisis') },
    { id: 'settings', label: t('Pengaturan'), icon: Settings, description: t('Preferensi aplikasi') },
  ] as const;

  const handleItemClick = (id: Tab) => {
    setActiveTab(id);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 md:hidden"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-[280px] bg-white dark:bg-slate-900 shadow-2xl z-50 md:hidden flex flex-col"
          >
            <div className="p-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t('Menu Utama')}</h2>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl transition-colors ${
                      isActive ? 'bg-white dark:bg-slate-800 shadow-sm' : 'bg-slate-100 dark:bg-slate-800'
                    }`}>
                      <Icon size={20} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-bold">{item.label}</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">{item.description}</p>
                    </div>
                    <ChevronRight size={16} className={`transition-transform ${isActive ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'}`} />
                  </button>
                );
              })}
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                  V
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Vynance App</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">v1.2.0 • Premium</p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
