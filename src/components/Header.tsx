import React, { useRef, useEffect, useState } from 'react';
import { PlusCircle, Settings as SettingsIcon, LayoutDashboard, ListOrdered, WalletCards, Users, ArrowLeft, Search, X, Info, Download, Menu, Plus, Bell } from 'lucide-react';
import { Tab } from './Sidebar';
import { motion, AnimatePresence } from 'motion/react';
import { useSettings } from '../contexts/SettingsContext';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  onAddAccountClick?: () => void;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  isSearchVisible?: boolean;
  setIsSearchVisible?: (visible: boolean) => void;
  isScrolled?: boolean;
  onLogoClick?: () => void;
  onMenuClick?: () => void;
  onAddRencanaClick?: () => void;
  toolsTab?: 'cicilan' | 'pricing';
  setToolsTab?: (tab: 'cicilan' | 'pricing') => void;
  notificationCount?: number;
  onNotificationClick?: () => void;
}

export default function Header({ 
  activeTab, 
  setActiveTab, 
  onAddAccountClick,
  searchQuery = '',
  setSearchQuery,
  isSearchVisible = false,
  setIsSearchVisible,
  isScrolled = false,
  onLogoClick,
  onMenuClick,
  onAddRencanaClick,
  toolsTab,
  setToolsTab,
  notificationCount = 0,
  onNotificationClick
}: HeaderProps) {
  const { t } = useSettings();
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  useEffect(() => {
    if (isSearchVisible && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchVisible]);

  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard': return t('Ringkasan Keuangan');
      case 'jurnal': return t('Riwayat Transaksi');
      case 'rekening': return t('Kelola Rekening');
      case 'utang': return t('Utang & Piutang');
      case 'rencana': return t('Rencana Tabungan');
      case 'add-transaction': return t('Tambah Transaksi');
      case 'add-account': return t('Tambah Rekening');
      case 'settings': return t('Pengaturan');
      case 'tools': return t('Alat Bantu');
      default: return 'Vynance';
    }
  };

  const isDashboardMobileTop = activeTab === 'dashboard' && !isScrolled;

  return (
    <header className={`${isDashboardMobileTop ? 'bg-blue-600 border-transparent md:bg-white/80 md:dark:bg-slate-900/80 md:backdrop-blur-xl md:border-b md:border-slate-200/60 md:dark:border-slate-800' : 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800'} px-4 md:px-6 py-3 md:py-4 flex flex-col md:flex-row md:items-center justify-between shrink-0 sticky top-0 z-30 transition-colors duration-200 gap-3 md:gap-4`}>
      <div className="flex items-center justify-between w-full md:w-auto shrink-0">
        <div className="md:hidden flex items-center gap-2.5">
          <div id="header-left-actions-mobile"></div>
          {(activeTab === 'add-transaction' || activeTab === 'add-account' || activeTab === 'settings') && (
            <button onClick={() => navigate(-1)} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 -ml-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
              <ArrowLeft size={20} />
            </button>
          )}
          {activeTab === 'dashboard' ? (
            <>
              {isDashboardMobileTop ? (
                <img src="/image/logo-full-text-white.png" alt="Logo" className="h-8 object-contain cursor-pointer" onClick={onLogoClick} />
              ) : (
                <>
                  <img src="/image/logo-full-text-color.png" alt="Logo" className="h-8 object-contain dark:hidden cursor-pointer" onClick={onLogoClick} />
                  <img src="/image/logo-full-text-white.png" alt="Logo" className="h-8 object-contain hidden dark:block cursor-pointer" onClick={onLogoClick} />
                </>
              )}
            </>
          ) : (
            <>
              <img src="/image/logo-icon.png" alt="Logo" className="h-8 w-8 object-contain cursor-pointer" onClick={onLogoClick} />
              <div className="flex flex-col justify-center cursor-pointer" onClick={onLogoClick}>
                <h1 className="text-slate-800 dark:text-slate-100 font-bold text-base leading-none tracking-tight">
                  <span id="header-title-mobile">{getTitle()}</span>
                </h1>
                <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px] leading-tight mt-0.5">
                  Vynance
                </span>
              </div>
            </>
          )}
        </div>
        <div className="hidden md:flex items-center gap-3">
          <div id="header-left-actions-desktop"></div>
          {(activeTab === 'add-transaction' || activeTab === 'add-account') && (
            <button onClick={() => navigate(-1)} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1.5 -ml-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
              <ArrowLeft size={24} />
            </button>
          )}
          {activeTab !== 'settings' && (
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 tracking-tight">
              <span id="header-title-desktop">{getTitle()}</span>
            </h2>
          )}
          {activeTab === 'settings' && (
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 tracking-tight ml-2">
              <span id="header-title-desktop-settings">{getTitle()}</span>
            </h2>
          )}
        </div>

        {/* Mobile Action Buttons (Search & Settings) */}
        <div className="flex md:hidden items-center gap-1">
          <div id="header-actions-container-mobile" className="flex items-center"></div>
          <button
            onClick={onNotificationClick}
            className={`p-1.5 rounded-lg transition-colors relative ${isDashboardMobileTop ? 'text-white hover:bg-white/10' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <Bell size={22} />
            {notificationCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border border-white dark:border-slate-900"></span>
            )}
          </button>
          {activeTab === 'rencana' && (
            <button
              onClick={onAddRencanaClick}
              className="p-1.5 rounded-lg transition-colors text-white bg-blue-600 hover:bg-blue-700 shadow-sm mr-1"
            >
              <Plus size={20} />
            </button>
          )}
          {activeTab === 'jurnal' && (
            <button
              onClick={() => {
                if (setIsSearchVisible) {
                  setIsSearchVisible(!isSearchVisible);
                }
              }}
              className={`p-1.5 rounded-lg transition-colors ${isSearchVisible ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              <Search size={22} />
            </button>
          )}
          {activeTab === 'settings' && (
            <button
              onClick={onLogoClick}
              className="p-1.5 rounded-lg transition-colors text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Info size={22} />
            </button>
          )}
          {isInstallable && activeTab === 'dashboard' && (
            <button
              onClick={handleInstallClick}
              className={`p-1.5 rounded-lg transition-colors ${isDashboardMobileTop ? 'text-white hover:bg-white/10 md:text-slate-600 md:dark:text-slate-400 md:hover:bg-slate-100 md:dark:hover:bg-slate-800' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              title={t('Install Vynance')}
            >
              <Download size={22} />
            </button>
          )}
          <button
            onClick={onMenuClick}
            className={`p-1.5 rounded-lg transition-colors ${isDashboardMobileTop ? 'text-white hover:bg-white/10 md:text-slate-600 md:dark:text-slate-400 md:hover:bg-slate-100 md:dark:hover:bg-slate-800' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <Menu size={22} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isSearchVisible && activeTab === 'jurnal' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="w-full md:flex-1 md:max-w-3xl order-3 md:order-none overflow-hidden"
          >
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400 dark:text-slate-500" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
                placeholder={t('Cari transaksi...')}
                className="block w-full pl-10 pr-10 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl leading-5 bg-slate-50 dark:bg-slate-800/50 placeholder-slate-400 dark:placeholder-slate-500 text-slate-900 dark:text-slate-100 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 sm:text-sm transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery && setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="hidden md:flex items-center gap-3 shrink-0 order-2 md:order-none">
        {activeTab === 'tools' && setToolsTab && (
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mr-2">
            <button
              onClick={() => setToolsTab('cicilan')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                toolsTab === 'cicilan' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {t('Kalkulator Cicilan')}
            </button>
            <button
              onClick={() => setToolsTab('pricing')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                toolsTab === 'pricing' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {t('Analisis Harga')}
            </button>
          </div>
        )}

        {activeTab === 'rekening' ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onAddAccountClick ? onAddAccountClick() : setActiveTab('add-account')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-[0_4px_12px_rgba(37,99,235,0.2)] hover:shadow-[0_6px_16px_rgba(37,99,235,0.3)]"
          >
            <PlusCircle size={18} />
            <span>{t('Tambah Rekening')}</span>
          </motion.button>
        ) : activeTab === 'rencana' ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onAddRencanaClick}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-[0_4px_12px_rgba(37,99,235,0.2)] hover:shadow-[0_6px_16px_rgba(37,99,235,0.3)]"
          >
            <PlusCircle size={18} />
            <span>{t('Tambah Rencana')}</span>
          </motion.button>
        ) : activeTab !== 'add-transaction' && activeTab !== 'add-account' && activeTab !== 'settings' && activeTab !== 'tools' ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab('add-transaction')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-[0_4px_12px_rgba(37,99,235,0.2)] hover:shadow-[0_6px_16px_rgba(37,99,235,0.3)]"
          >
            <PlusCircle size={18} />
            <span>{t('Tambah Transaksi')}</span>
          </motion.button>
        ) : null}
        
        <div id="header-actions-container" className="flex items-center"></div>
        
        {activeTab !== 'settings' && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={onNotificationClick}
              className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors relative"
            >
              <Bell size={22} />
              {notificationCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-white dark:border-slate-900"></span>
              )}
            </button>

            {activeTab === 'jurnal' && (
              <button
                onClick={() => {
                  if (setIsSearchVisible) {
                    setIsSearchVisible(!isSearchVisible);
                  }
                }}
                className={`p-2 rounded-xl transition-colors ${isSearchVisible ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <Search size={22} />
              </button>
            )}

            {isInstallable && activeTab === 'dashboard' && (
              <button
                onClick={handleInstallClick}
                className="p-2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-xl transition-colors"
                title={t('Install Vynance')}
              >
                <Download size={22} />
              </button>
            )}

            <button
              onClick={() => setActiveTab('settings')}
              className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <SettingsIcon size={22} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
