import React from 'react';
import { LayoutDashboard, PlusCircle, Users, WalletCards, History } from 'lucide-react';
import { Tab } from './Sidebar';
import { useSettings } from '../contexts/SettingsContext';

interface BottomNavigationProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

export default function BottomNavigation({ activeTab, setActiveTab }: BottomNavigationProps) {
  const { t } = useSettings();

  const navItems: { id: Tab; label: string; icon: React.ElementType; isPrimary?: boolean }[] = [
    { id: 'dashboard', label: t('Dashboard'), icon: LayoutDashboard },
    { id: 'jurnal', label: t('Riwayat'), icon: History },
    { id: 'add-transaction', label: t('Tambah'), icon: PlusCircle, isPrimary: true },
    { id: 'utang', label: t('Utang'), icon: Users },
    { id: 'rekening', label: t('Rekening'), icon: WalletCards },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pb-safe z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] dark:shadow-none transition-colors duration-200">
      <div className="flex items-center justify-around px-1 py-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          if (item.isPrimary) {
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="relative -top-5 flex flex-col items-center justify-center w-14 gap-1"
              >
                <div className="flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-full shadow-[0_4px_12px_rgba(37,99,235,0.4)] hover:bg-blue-700 transition-transform hover:scale-105 active:scale-95">
                  <Icon size={24} />
                </div>
                <span className="text-[9px] font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap absolute -bottom-4">{t('Buat Transaksi')}</span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center w-14 gap-1 transition-colors ${
                isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <div className={`p-1 rounded-xl transition-colors ${isActive ? 'bg-blue-50 dark:bg-blue-500/10' : 'bg-transparent'}`}>
                <Icon size={20} className={isActive ? 'scale-110 transition-transform' : ''} />
              </div>
              <span className={`text-[9px] font-medium ${isActive ? 'text-blue-700 dark:text-blue-400' : ''}`}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
