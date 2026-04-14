import React from 'react';
import { LayoutDashboard, WalletCards, Users, Settings, History, Target, Wrench } from 'lucide-react';
import { motion } from 'motion/react';
import { useSettings } from '../contexts/SettingsContext';

export type Tab = 'dashboard' | 'jurnal' | 'rekening' | 'utang' | 'rencana' | 'add-transaction' | 'add-account' | 'settings' | 'tools';

interface SidebarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  onLogoClick?: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, onLogoClick }: SidebarProps) {
  const { t } = useSettings();

  const tabs = [
    { id: 'dashboard', label: t('Dashboard'), icon: LayoutDashboard },
    { id: 'jurnal', label: t('Riwayat Transaksi'), icon: History },
    { id: 'utang', label: t('Utang & Piutang'), icon: Users },
    { id: 'rencana', label: t('Rencana Tabungan'), icon: Target },
    { id: 'rekening', label: t('Kelola Rekening'), icon: WalletCards },
    { id: 'tools', label: t('Alat Bantu'), icon: Wrench },
    { id: 'settings', label: t('Pengaturan'), icon: Settings },
  ] as const;

  return (
    <aside className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200/60 dark:border-slate-800 hidden md:flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-none z-20 transition-colors duration-200">
      <div 
        className="p-8 flex items-center gap-3 cursor-pointer"
        onClick={onLogoClick}
      >
        <img src="/image/logo-full-text-color.png" alt="Vynance" className="h-8 object-contain dark:hidden" />
        <img src="/image/logo-full-text-white.png" alt="Vynance" className="h-8 object-contain hidden dark:block" />
      </div>
      
      <nav className="flex-1 px-4 space-y-1.5 mt-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-medium transition-all duration-200 group ${
                isActive 
                  ? 'text-blue-700 dark:text-blue-400' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active-indicator"
                  className="absolute inset-0 bg-blue-50/80 dark:bg-blue-500/10 rounded-2xl -z-10 border border-blue-100/50 dark:border-blue-500/20"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon size={20} className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
              {tab.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
