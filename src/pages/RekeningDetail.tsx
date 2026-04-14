import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Account } from '../types';
import { formatCurrency, getBankNameFromCode, getBankLogoFromCode } from '../utils';
import { Copy, Share2, ArrowLeft, CheckCircle2, ShieldAlert, Building2, User, CreditCard } from 'lucide-react';
import { motion } from 'motion/react';
import { useSettings } from '../contexts/SettingsContext';

interface RekeningDetailProps {
  accounts: Account[];
}

export default function RekeningDetail({ accounts }: RekeningDetailProps) {
  const { bankCode, reversedAccountNumber, slugName } = useParams<{ bankCode: string, reversedAccountNumber: string, slugName: string }>();
  const navigate = useNavigate();
  const { t } = useSettings();
  
  const [copied, setCopied] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  // Parse URL parameters
  const accountNumber = useMemo(() => {
    return reversedAccountNumber ? reversedAccountNumber.split('').reverse().join('') : '';
  }, [reversedAccountNumber]);

  const accountName = useMemo(() => {
    if (!slugName) return '';
    return slugName.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }, [slugName]);

  const formattedBankCode = useMemo(() => {
    if (!bankCode) return '';
    return getBankNameFromCode(bankCode);
  }, [bankCode]);

  // Check if current user is the owner
  useEffect(() => {
    if (accounts && accounts.length > 0 && accountNumber) {
      // Find if any of the user's accounts match this account number
      const isMatch = accounts.some(acc => {
        // Remove non-numeric characters for comparison just in case
        const cleanAccNum = acc.accountNumber?.replace(/\D/g, '');
        const cleanUrlNum = accountNumber.replace(/\D/g, '');
        return cleanAccNum === cleanUrlNum;
      });
      setIsOwner(isMatch);
    }
  }, [accounts, accountNumber]);

  // Update document title for SEO
  useEffect(() => {
    document.title = `Rekening ${formattedBankCode} a.n. ${accountName} - Vynance`;
  }, [formattedBankCode, accountName]);

  const handleCopy = () => {
    navigator.clipboard.writeText(accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const url = window.location.href;
    const shareData = {
      title: `Rekening ${formattedBankCode} a.n. ${accountName}`,
      text: `Kirim ke rekening ${formattedBankCode} atas nama ${accountName} dengan mudah dan cepat.`,
      url: url,
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        alert(t('Link berhasil disalin!'));
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  // Find the account to display balance if owner
  const ownerAccount = useMemo(() => {
    if (!isOwner) return null;
    return accounts.find(acc => acc.accountNumber?.replace(/\D/g, '') === accountNumber.replace(/\D/g, ''));
  }, [isOwner, accounts, accountNumber]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            {t('Detail Rekening')}
          </h1>
          <div className="w-10"></div> {/* Spacer for centering */}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-3xl mx-auto w-full p-4 md:p-6 flex flex-col gap-6">
        
        {/* Main Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden"
        >
          {/* Background Decoration */}
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4 border-4 border-white dark:border-slate-900 shadow-sm overflow-hidden">
              {bankCode && getBankLogoFromCode(bankCode) ? (
                <img src={getBankLogoFromCode(bankCode)} alt={formattedBankCode} className="w-full h-full object-cover" />
              ) : (
                <Building2 size={32} className="text-blue-600 dark:text-blue-400" />
              )}
            </div>
            
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 mb-1">
              {formattedBankCode}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">
              {t('Informasi Rekening Tujuan')}
            </p>

            <div className="w-full space-y-4 text-left">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3 mb-1">
                  <User size={16} className="text-slate-400" />
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('Atas Nama')}</span>
                </div>
                <p className="text-lg font-semibold text-slate-800 dark:text-slate-100 ml-7">
                  {accountName}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 flex items-center justify-between group">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <CreditCard size={16} className="text-slate-400" />
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('Nomor Rekening')}</span>
                  </div>
                  <p className="text-xl font-bold text-slate-800 dark:text-slate-100 ml-7 tracking-wide">
                    {accountNumber}
                  </p>
                </div>
                <button 
                  onClick={handleCopy}
                  className="p-3 bg-white dark:bg-slate-700 rounded-xl shadow-sm border border-slate-200 dark:border-slate-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-600 transition-colors"
                  title={t('Salin Nomor Rekening')}
                >
                  {copied ? <CheckCircle2 size={24} className="text-emerald-500" /> : <Copy size={24} />}
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Owner Only Section */}
        {isOwner && ownerAccount && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-6 text-white shadow-md relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2 opacity-90">
                <ShieldAlert size={18} />
                <span className="text-sm font-medium uppercase tracking-wider">{t('Hanya Anda Yang Melihat Ini')}</span>
              </div>
              <p className="text-blue-100 text-sm mb-1">{t('Saldo Saat Ini')}</p>
              <h3 className="text-3xl font-bold">{formatCurrency(ownerAccount.balance)}</h3>
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 mt-4">
          <button 
            onClick={handleShare}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-4 font-semibold text-lg flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
          >
            <Share2 size={20} />
            {t('Bagikan Rekening')}
          </button>
        </div>

      </main>
    </div>
  );
}
