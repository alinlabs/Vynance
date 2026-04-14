import React, { useState, useRef, useEffect } from 'react';
import { Account } from '../types';
import { Building2, Wallet, Coins, Plus, Edit2, Trash2, Copy, FileText, Image as ImageIcon, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSettings } from '../contexts/SettingsContext';
import { formatCurrency, getBankCode } from '../utils';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface AccountListProps {
  accounts: Account[];
  onNavigateToAdd: () => void;
  onNavigateToEdit: (account: Account) => void;
  onDeleteAccount: (id: string) => void;
}

const PROVIDER_LOGOS: Record<string, string> = {
  'Allo Bank': 'https://play-lh.googleusercontent.com/0gw4GVJoKuQCDIz8DOXt5fQDEy-RD0BDnQge-BsbnBaBTmXWgqjydABvetmCqTXE1Gm2=w48-h48-rw',
  'SeaBank': 'https://play-lh.googleusercontent.com/ZGLrjk0PKIj2L4DaWiKmhAf0f6cBXml6eHgjRpJhQ4XQpGvw4T5d4hjl_EQF5jY9Vked=s48-rw',
  'Bank Jago': 'https://www.jago.com/favicon/og-image.png',
  'Bank Neo': 'https://play-lh.googleusercontent.com/29-fa8r-aNxlmlyijeoxWbA41ak5wwB5sX8R1o50pIYEwjSDQb-d6GrApVeyJn3ddw=s48-rw',
  'Bank Central Asia': 'https://i.pinimg.com/736x/29/61/0b/29610b7dbf7e4ea5070626923a12cba8.jpg',
  'Bank Mandiri': 'https://ui-avatars.com/api/?name=BM&background=1e3a8a&color=fff',
  'Bank Negara Indonesia': 'https://i0.wp.com/amanahfurniture.com/wp-content/uploads/2022/10/logo-bni-46.png',
  'Bank Rakyat Indonesia': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Logo_Bank_Rakyat_Indonesia.svg/250px-Logo_Bank_Rakyat_Indonesia.svg.png',
  'Bank Tabungan Negara': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/BTN_2024.svg/250px-BTN_2024.svg.png',
  'DANA': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTRhvs9h_tTVvV-4g-BE7r4ALtNl5wvkuNwAg&s',
  'OVO': 'https://iconlogovector.com/uploads/images/2024/03/lg-65e38949ad9b9-OVO.webp',
  'GoPay': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTU1_u4kBagPaDWERIyFFmDI8VxkzZEd4YFWQ&s',
  'ShopeePay': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTnQ54gdjaHKfhtVWT3C1n-gLZljKqucGLOeg&s',
};

export default function AccountList({ accounts, onNavigateToAdd, onNavigateToEdit, onDeleteAccount }: AccountListProps) {
  const { t } = useSettings();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getAccountIcon = (account: Account) => {
    if (account.provider && PROVIDER_LOGOS[account.provider]) {
      return <img src={PROVIDER_LOGOS[account.provider]} alt={account.provider} className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />;
    }
    switch (account.type) {
      case 'bank': return <Building2 className="text-blue-500" size={24} />;
      case 'ewallet': return <Wallet className="text-purple-500" size={24} />;
      default: return <img src="/image/logo-coin.png" alt="Tunai" className="w-full h-full object-contain rounded-lg" />;
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm(t('Apakah Anda yakin ingin menghapus rekening ini? Semua transaksi yang terkait juga akan dihapus.'))) {
      onDeleteAccount(id);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(t('Nomor rekening/HP disalin ke clipboard!'));
  };

  const handleExportPDF = async (account: Account) => {
    setActiveDropdown(null);
    const cardElement = cardRefs.current[account.id];
    if (!cardElement) return;
    try {
      const canvas = await html2canvas(cardElement, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Rekening_${account.name}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      window.print();
    }
  };

  const handleExportImage = async (account: Account) => {
    setActiveDropdown(null);
    const cardElement = cardRefs.current[account.id];
    if (!cardElement) return;
    try {
      const canvas = await html2canvas(cardElement, { scale: 2, useCORS: true });
      const link = document.createElement('a');
      link.download = `Rekening_${account.name}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error generating image:', error);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
      >
        <AnimatePresence mode="popLayout">
          {accounts.map((account) => (
            <motion.div 
              layout
              variants={itemVariants}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              key={account.id} 
              ref={(el) => cardRefs.current[account.id] = el}
              className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-2xl md:rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-800 flex flex-col group hover:border-blue-100 dark:hover:border-blue-900/50 hover:shadow-[0_8px_24px_rgba(37,99,235,0.08)] transition-all relative"
            >
              <div className="flex justify-between items-start mb-4 md:mb-5 gap-2">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="shrink-0 p-2.5 md:p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl md:rounded-2xl flex items-center justify-center w-12 h-12 md:w-14 md:h-14 border border-slate-100 dark:border-slate-700 group-hover:scale-110 transition-transform duration-300">
                    {getAccountIcon(account)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg md:text-xl font-semibold text-slate-900 dark:text-slate-100 leading-tight truncate md:overflow-visible md:whitespace-normal">{account.name}</h3>
                    {account.provider ? (
                      <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 truncate md:overflow-visible md:whitespace-normal">{account.provider}</p>
                    ) : account.type === 'cash' ? (
                      <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">{t('Tunai')}</p>
                    ) : null}
                  </div>
                </div>
                <div className="flex gap-1 md:gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity relative shrink-0">
                  <button
                    onClick={() => onNavigateToEdit(account)}
                    className="p-1.5 md:p-2 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg md:rounded-xl transition-colors"
                    title={t("Edit")}
                  >
                    <Edit2 size={16} className="md:w-[18px] md:h-[18px]" />
                  </button>
                  <button
                    onClick={() => handleDelete(account.id)}
                    className="p-1.5 md:p-2 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg md:rounded-xl transition-colors"
                    title={t("Hapus")}
                  >
                    <Trash2 size={16} className="md:w-[18px] md:h-[18px]" />
                  </button>
                  <div className="relative" ref={activeDropdown === account.id ? dropdownRef : null}>
                    <button
                      onClick={() => setActiveDropdown(activeDropdown === account.id ? null : account.id)}
                      className="p-1.5 md:p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg md:rounded-xl transition-colors"
                      title={t("Lainnya")}
                    >
                      <MoreVertical size={16} className="md:w-[18px] md:h-[18px]" />
                    </button>
                    <AnimatePresence>
                      {activeDropdown === account.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-lg dark:shadow-none border border-slate-100 dark:border-slate-800 py-1 z-10 overflow-hidden"
                        >
                          <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 mb-1">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('Opsi Rekening')}</span>
                          </div>
                          <button
                            onClick={() => {
                              const bankCode = getBankCode(account.provider || account.type);
                              const reversedAcc = (account.accountNumber || '').split('').reverse().join('');
                              const slugName = (account.accountName || '').toLowerCase().replace(/\s+/g, '-');
                              const url = `${window.location.origin}/rek/${bankCode}/${reversedAcc}/${slugName}`;
                              navigator.clipboard.writeText(url);
                              alert(t('Link bagikan berhasil disalin!'));
                              setActiveDropdown(null);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            {t('Bagikan Rekening')}
                          </button>
                          <button
                            onClick={() => handleExportPDF(account)}
                            className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            {t('Download PDF')}
                          </button>
                          <button
                            onClick={() => handleExportImage(account)}
                            className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            {t('Download Gambar')}
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
              
              {account.type !== 'cash' && (
                <div className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mb-4 space-y-1 md:space-y-1.5 bg-slate-50/50 dark:bg-slate-800/30 p-2.5 md:p-3 rounded-xl border border-slate-100/50 dark:border-slate-700/50">
                  <p className="flex justify-between"><span className="font-medium text-slate-600 dark:text-slate-300">a.n :</span> <span className="text-slate-800 dark:text-slate-200 truncate max-w-[120px]">{account.accountName}</span></p>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-800 dark:text-slate-200 font-mono text-[10px] md:text-xs mt-0.5">{account.accountNumber}</span>
                    <button 
                      onClick={() => handleCopy(account.accountNumber || '')}
                      className="text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      title={t("Salin Nomor")}
                    >
                      <Copy size={12} className="md:w-3.5 md:h-3.5" />
                    </button>
                  </div>
                </div>
              )}
              
              <div className="mt-auto pt-3 md:pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-end">
                <div>
                  <p className="text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400 mb-0.5 md:mb-1">{t('Saldo Saat Ini')}</p>
                  <p className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                    {formatCurrency(account.balance)}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {(accounts || []).length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-full text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800"
          >
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet className="h-10 w-10 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">{t('Belum ada rekening')}</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">{t('Tambahkan rekening bank, e-wallet, atau dompet tunai Anda untuk mulai mencatat transaksi.')}</p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onNavigateToAdd}
              className="text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-500/10 px-6 py-3 rounded-xl transition-colors"
            >
              + {t('Tambah Rekening Pertama')}
            </motion.button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
