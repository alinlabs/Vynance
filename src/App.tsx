import React, { useState, useEffect } from 'react';
import { useFinanceData } from './useFinanceData';
import RingkasanKeuangan from './pages/RingkasanKeuangan';
import JurnalUmum from './pages/JurnalUmum';
import TambahTransaksi from './pages/TambahTransaksi';
import KelolaRekening from './pages/KelolaRekening';
import TambahRekening from './pages/TambahRekening';
import UtangPiutang from './pages/UtangPiutang';
import RencanaTabungan from './pages/RencanaTabungan';
import Settings from './pages/Settings';
import Tools from './pages/Tools';
import DetailAnalisa from './pages/DetailAnalisa';
import Splash from './pages/Splash';
import Welcoming from './pages/Welcoming';
import RekeningDetail from './pages/RekeningDetail';
import Install from './pages/Install';
import Sidebar, { Tab } from './components/Sidebar';
import Header from './components/Header';
import BottomNavigation from './components/BottomNavigation';
import WelcomePopup from './components/WelcomePopup';
import AboutPopup from './components/AboutPopup';
import MobileMenu from './components/MobileMenu';
import { AnimatePresence, motion } from 'motion/react';
import { Account, Transaction, Notification, SavingsPlan } from './types';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useSettings } from './contexts/SettingsContext';
import { Activity, Bell } from 'lucide-react';
import NotificationsPage from './pages/NotificationsPage';

export default function App() {
  const { t } = useSettings();
  const { 
    transactions, 
    accounts, 
    contacts,
    categories, 
    savingsPlans,
    addContact,
    addAccount, 
    updateAccount,
    deleteAccount,
    addTransaction, 
    updateTransaction,
    deleteTransaction,
    addSavingsPlan,
    updateSavingsPlan,
    deleteSavingsPlan,
    resetAllData
  } = useFinanceData();
  
  const location = useLocation();
  const navigate = useNavigate();
  
  const [editingAccount, setEditingAccount] = useState<Account | undefined>();
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>();
  const [isWelcoming, setIsWelcoming] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [welcomeUserName, setWelcomeUserName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showAboutPopup, setShowAboutPopup] = useState(false);
  const [toolsTab, setToolsTab] = useState<'cicilan' | 'pricing'>('cicilan');
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Generate Notifications
  useEffect(() => {
    const newNotifications: Notification[] = [];
    const today = new Date().toISOString().split('T')[0];

    // 1. Debt/Credit Due Dates
    transactions.forEach(trx => {
      if (trx.dueDate && trx.dueDate === today) {
        const isDebt = trx.categoryId === 'inc_terima_pinjaman' || trx.categoryId === 'exp_bayar_utang';
        newNotifications.push({
          id: `debt-${trx.id}`,
          title: isDebt ? t('Tagihan Utang Hari Ini') : t('Tagihan Piutang Hari Ini'),
          message: `${trx.description}: ${new Intl.NumberFormat('id-ID').format(trx.amount)}`,
          date: today,
          type: 'debt',
          isRead: false,
          relatedId: trx.id
        });
      }
    });

    // 2. Savings Plan Billing
    savingsPlans.forEach(plan => {
      if (plan.billingMethod) {
        let shouldNotify = false;
        const now = new Date();
        const dayOfMonth = now.getDate();
        const dayOfWeek = now.getDay(); // 0-6

        switch (plan.billingMethod) {
          case 'daily':
            shouldNotify = true;
            break;
          case '3days':
            // Simple logic: notify every 3 days from start of month
            if (dayOfMonth % 3 === 0) shouldNotify = true;
            break;
          case 'weekly':
            // Notify every Monday (1)
            if (dayOfWeek === 1) shouldNotify = true;
            break;
          case 'monthly':
            // Notify on 1st of month
            if (dayOfMonth === 1) shouldNotify = true;
            break;
          case 'specific_date':
            if (plan.billingDate === dayOfMonth) shouldNotify = true;
            break;
        }

        if (shouldNotify) {
          newNotifications.push({
            id: `savings-${plan.id}-${today}`,
            title: t('Waktunya Menabung!'),
            message: `${t('Jangan lupa isi tabungan')} ${plan.name}`,
            date: today,
            type: 'savings',
            isRead: false,
            relatedId: plan.id
          });
        }
      }
    });

    setNotifications(newNotifications);
  }, [transactions, savingsPlans, t]);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
    const scrollableDiv = document.getElementById('main-scroll-area');
    if (scrollableDiv) {
      scrollableDiv.scrollTo(0, 0);
      setIsScrolled(false);
    }
  }, [location.pathname]);

  // Handle scroll event
  useEffect(() => {
    if (showSplash || isWelcoming) return;

    const scrollableDiv = document.getElementById('main-scroll-area');
    if (!scrollableDiv) return;

    const handleScroll = () => {
      // The hero section is roughly 150-200px tall. We can set a threshold like 50px.
      setIsScrolled(scrollableDiv.scrollTop > 50);
    };

    scrollableDiv.addEventListener('scroll', handleScroll);
    return () => scrollableDiv.removeEventListener('scroll', handleScroll);
  }, [showSplash, isWelcoming, location.pathname]);

  // Handle search query param
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('search') === 'true') {
      setIsSearchVisible(true);
      // Remove the query param so it doesn't trigger again on refresh
      navigate(location.pathname, { replace: true });
    }
  }, [location.search, navigate, location.pathname]);

  useEffect(() => {
    // Check if onboarding is complete
    const isComplete = localStorage.getItem('vinance_onboarding_complete');
    if (isComplete === 'true') {
      setShowSplash(false);
    }

    // Simulate loading time for Welcoming screen
    const timer = setTimeout(() => {
      setIsWelcoming(false);
      
      // Check for welcome popup logic
      const storedName = localStorage.getItem('vinance_user_name');
      
      if (isComplete === 'true' && storedName && storedName.trim() !== '') {
        setWelcomeUserName(storedName);
        setShowWelcomePopup(true);
      }
    }, 2500); // 2.5 seconds

    return () => clearTimeout(timer);
  }, []);

  const handleSplashComplete = (newAccount?: any) => {
    if (newAccount) {
      addAccount(newAccount);
    }
    setShowSplash(false);
  };

  if (location.pathname === '/install') {
    return <Install />;
  }

  if (isWelcoming) {
    return <Welcoming />;
  }

  if (showSplash) {
    return <Splash onComplete={handleSplashComplete} />;
  }

  // Map route to activeTab for Sidebar/Header/BottomNav
  const getActiveTab = (): Tab => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return 'dashboard';
    if (path.startsWith('/riwayat')) return 'jurnal';
    if (path.startsWith('/kewajiban')) return 'utang';
    if (path.startsWith('/rencana')) return 'rencana';
    if (path === '/rekening/tambah') return 'add-account';
    if (path.startsWith('/rekening')) return 'rekening';
    if (path.startsWith('/pengaturan')) return 'settings';
    if (path.startsWith('/tools')) return 'tools';
    if (path.startsWith('/transaksi/tambah')) return 'add-transaction';
    return 'dashboard';
  };

  const activeTab = getActiveTab();

  const handleTabChange = (tab: Tab) => {
    switch (tab) {
      case 'dashboard': navigate('/dashboard'); break;
      case 'jurnal': navigate('/riwayat'); break;
      case 'utang': navigate('/kewajiban'); break;
      case 'rencana': navigate('/rencana'); break;
      case 'rekening': navigate('/rekening'); break;
      case 'settings': navigate('/pengaturan'); break;
      case 'tools': navigate('/tools'); break;
      case 'add-transaction': 
        setEditingTransaction(undefined);
        navigate('/transaksi/tambah'); 
        break;
      case 'add-account': 
        setEditingAccount(undefined);
        navigate('/rekening/tambah'); 
        break;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex overflow-hidden selection:bg-blue-100 dark:selection:bg-blue-900/50 selection:text-blue-900 dark:selection:text-blue-100 transition-colors duration-200">
      <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} onLogoClick={() => setShowAboutPopup(true)} />

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <Header 
          activeTab={activeTab} 
          setActiveTab={handleTabChange} 
          onAddAccountClick={() => {
            setEditingAccount(undefined);
            navigate('/rekening/tambah');
          }}
          onAddRencanaClick={() => {
            window.dispatchEvent(new CustomEvent('vynance-add-rencana'));
          }}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isSearchVisible={isSearchVisible}
          setIsSearchVisible={setIsSearchVisible}
          isScrolled={isScrolled}
          onLogoClick={() => setShowAboutPopup(true)}
          onMenuClick={() => setIsMobileMenuOpen(true)}
          toolsTab={toolsTab}
          setToolsTab={setToolsTab}
          notificationCount={notifications.filter(n => !n.isRead).length}
          onNotificationClick={() => navigate('/notifications')}
        />

        <div id="main-scroll-area" className="flex-1 overflow-y-auto p-3 md:p-8 scroll-smooth pb-24 md:pb-8">
          <div className="max-w-6xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <Routes location={location}>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={
                    <RingkasanKeuangan 
                      transactions={transactions} 
                      accounts={accounts} 
                      categories={categories} 
                      savingsPlans={savingsPlans}
                    />
                  } />
                  <Route path="/riwayat" element={
                    <JurnalUmum 
                      transactions={transactions} 
                      accounts={accounts} 
                      categories={categories} 
                      contacts={contacts}
                      onDelete={deleteTransaction}
                      onEdit={(trx) => {
                        setEditingTransaction(trx);
                        navigate('/transaksi/tambah');
                      }}
                      searchQuery={searchQuery}
                    />
                  } />
                  <Route path="/rekening" element={
                    <KelolaRekening
                      accounts={accounts}
                      onNavigateToAdd={() => {
                        setEditingAccount(undefined);
                        navigate('/rekening/tambah');
                      }}
                      onNavigateToEdit={(account) => {
                        setEditingAccount(account);
                        navigate('/rekening/tambah');
                      }}
                      onDeleteAccount={deleteAccount}
                    />
                  } />
                  <Route path="/rekening/tambah" element={
                    <TambahRekening
                      initialData={editingAccount}
                      onSubmit={(data) => {
                        if (editingAccount) {
                          updateAccount(editingAccount.id, data);
                        } else {
                          addAccount(data);
                        }
                        navigate('/rekening');
                        setEditingAccount(undefined);
                      }}
                      onClose={() => {
                        navigate(-1);
                        setEditingAccount(undefined);
                      }}
                      onNavigateToSettings={() => {
                        if (window.innerWidth < 768) {
                          navigate('/pengaturan/pengguna', { replace: true });
                        } else {
                          navigate('/pengaturan', { replace: true });
                        }
                      }}
                    />
                  } />
                  <Route path="/kewajiban" element={
                    <UtangPiutang
                      contacts={contacts}
                      transactions={transactions}
                      categories={categories}
                      accounts={accounts}
                    />
                  } />
                  <Route path="/rencana" element={
                    <RencanaTabungan
                      savingsPlans={savingsPlans}
                      accounts={accounts}
                      onAddPlan={addSavingsPlan}
                      onUpdatePlan={updateSavingsPlan}
                      onDeletePlan={deleteSavingsPlan}
                    />
                  } />
                  <Route path="/transaksi/tambah" element={
                    <TambahTransaksi
                      accounts={accounts}
                      categories={categories}
                      contacts={contacts}
                      savingsPlans={savingsPlans}
                      transactions={transactions}
                      initialData={editingTransaction}
                      onSubmit={(data) => {
                        if (editingTransaction) {
                          updateTransaction(editingTransaction.id, data);
                        } else {
                          addTransaction(data);
                        }
                        navigate('/riwayat');
                        setEditingTransaction(undefined);
                      }}
                      onAddAccount={addAccount}
                      onAddContact={addContact}
                      onClose={() => {
                        navigate(-1);
                        setEditingTransaction(undefined);
                      }}
                      onNavigateToSettings={() => {
                        if (window.innerWidth < 768) {
                          navigate('/pengaturan/pengguna', { replace: true });
                        } else {
                          navigate('/pengaturan', { replace: true });
                        }
                      }}
                    />
                  } />
                  <Route path="/pengaturan/*" element={
                    <Settings onResetAllData={resetAllData} />
                  } />
                  <Route path="/tools" element={<Tools activeTab={toolsTab} setActiveTab={setToolsTab} />} />
                  <Route path="/notifications" element={
                    <NotificationsPage 
                      notifications={notifications} 
                      onMarkAsRead={(id) => {
                        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
                      }}
                    />
                  } />
                  <Route path="/analisa" element={
                    <DetailAnalisa 
                      transactions={transactions} 
                      accounts={accounts} 
                      savingsPlans={savingsPlans} 
                    />
                  } />
                  <Route path="/rek/:bankCode/:reversedAccountNumber/:slugName" element={
                    <RekeningDetail accounts={accounts} />
                  } />
                  <Route path="/install" element={<Install />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      <BottomNavigation activeTab={activeTab} setActiveTab={handleTabChange} />

      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
        activeTab={activeTab} 
        setActiveTab={handleTabChange} 
      />

      <WelcomePopup 
        isOpen={showWelcomePopup} 
        onClose={() => setShowWelcomePopup(false)} 
        userName={welcomeUserName} 
        accounts={accounts}
        transactions={transactions}
      />
      
      <AboutPopup
        isOpen={showAboutPopup}
        onClose={() => setShowAboutPopup(false)}
      />
    </div>
  );
}
