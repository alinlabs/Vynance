import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { Account, Transaction } from '../types';
import { formatCurrency } from '../utils';

interface WelcomePopupProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  accounts: Account[];
  transactions: Transaction[];
}

export default function WelcomePopup({ isOpen, onClose, userName, accounts, transactions }: WelcomePopupProps) {
  const { t } = useSettings();
  const [message, setMessage] = useState('');
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

  useEffect(() => {
    if (isOpen) {
      const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
      const formattedBalance = formatCurrency(totalBalance);
      
      // Calculate total debt
      const utangTransactions = (transactions || []).filter(trx => trx.categoryId === 'inc_terima_pinjaman' || trx.categoryId === 'exp_bayar_utang');
      const totalUtang = utangTransactions.reduce((acc, trx) => {
        if (trx.categoryId === 'inc_terima_pinjaman') return acc + trx.amount;
        if (trx.categoryId === 'exp_bayar_utang') return acc - trx.amount;
        return acc;
      }, 0);

      // Calculate previous balance (e.g., 7 days ago)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      let balanceChange = 0;
      let recentActivity = false;

      const recentTransactions = (transactions || []).filter(trx => new Date(trx.date) >= sevenDaysAgo);
      if (recentTransactions.length > 0) {
        recentActivity = true;
        balanceChange = recentTransactions.reduce((acc, trx) => {
          if (trx.type === 'income') return acc + trx.amount;
          if (trx.type === 'expense') return acc - trx.amount;
          return acc;
        }, 0);
      }

      let insightMessage = '';

      if (totalBalance < 0) {
        insightMessage = `${t('Wah, saldo Anda saat ini sedang minus')} (${formattedBalance}). ${t('Yuk, evaluasi kembali pengeluaran Anda dan tetap semangat!')}`;
      } else if (totalUtang > 0) {
        insightMessage = `${t('Saldo Anda saat ini adalah')} ${formattedBalance}. ${t('Jangan lupa, Anda memiliki catatan utang sebesar')} ${formatCurrency(totalUtang)}. ${t('Mari kelola keuangan dengan bijak!')}`;
      } else if (!recentActivity && (transactions || []).length > 0) {
        insightMessage = `${t('Senang melihat Anda kembali! Saldo Anda bertahan di')} ${formattedBalance}. ${t('Belum ada aktivitas baru akhir-akhir ini, yuk catat transaksi hari ini!')}`;
      } else if (balanceChange > 0) {
        insightMessage = `${t('Kabar baik!')} ${t('Saldo Anda meningkat dalam 7 hari terakhir. Total saldo saat ini adalah')} ${formattedBalance}. ${t('Pertahankan kebiasaan baik ini!')}`;
      } else if (balanceChange < 0) {
        insightMessage = `${t('Pengeluaran Anda cukup aktif belakangan ini. Saldo Anda saat ini adalah')} ${formattedBalance}. ${t('Pastikan pengeluaran tetap sesuai rencana, ya!')}`;
      } else {
        const templates = [
          `${t('Senang melihat Anda kembali! Total saldo Anda saat ini adalah')} ${formattedBalance}. ${t('Yuk, catat transaksi hari ini!')}`,
          `${t('Semoga hari Anda menyenangkan! Saldo Anda tercatat sebesar')} ${formattedBalance}. ${t('Jangan lupa pantau pengeluaran Anda.')}`,
          `${t('Siap untuk mengelola keuangan? Saldo terkini Anda adalah')} ${formattedBalance}. ${t('Tetap semangat!')}`
        ];
        insightMessage = templates[Math.floor(Math.random() * templates.length)];
      }
      
      setMessage(insightMessage);
    }
  }, [isOpen, accounts, transactions, t]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 11) return t('Selamat Pagi');
    if (hour < 15) return t('Selamat Siang');
    if (hour < 19) return t('Selamat Sore');
    return t('Selamat Malam');
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-slate-950/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl relative text-center border border-slate-100 dark:border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <X size={24} />
            </button>
            
            <motion.div 
              animate={{ y: [-5, 5, -5] }} 
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className="w-20 h-20 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-blue-100 dark:border-blue-500/20"
            >
              <img src="/image/logo-icon.png" alt="Logo" className="w-12 h-12 object-contain" />
            </motion.div>
            
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              {getGreeting()}, {userName}!
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              {message}
            </p>

            {isInstallable && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-500/10 rounded-2xl border border-blue-100 dark:border-blue-500/20 flex flex-col items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center">
                  <Download size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{t('Install Vynance')}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{t('Install aplikasi untuk akses lebih cepat dan mudah.')}</p>
                </div>
                <button
                  onClick={handleInstallClick}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
                >
                  {t('Install Sekarang')}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
