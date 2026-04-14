import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Transaction, Category, Account, Contact } from '../types';
import { formatCurrency, formatDate } from '../utils';
import { Trash2, ArrowUpRight, ArrowDownRight, Image as ImageIcon, User, ArrowRightLeft, Filter, SearchX, Download, FileText, FileSpreadsheet, File as FilePdf, Share2, MoreVertical, Calendar, Building2, Wallet, Coins, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import DetailTransaksi from './DetailTransaksi';
import Combobox from '../components/Combobox';
import DatePicker from '../components/DatePicker';
import { useSettings } from '../contexts/SettingsContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  contacts?: Contact[];
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
  searchQuery?: string;
}

type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest';
type DateFilterOption = 'all' | 'today' | '30days' | '90days' | 'custom';

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

const getAccountIcon = (account?: Account) => {
  if (!account) return <img src="/image/logo-coin.png" alt="Tunai" className="w-5 h-5 object-contain rounded-md" />;
  if (account.provider && PROVIDER_LOGOS[account.provider]) {
    return <img src={PROVIDER_LOGOS[account.provider]} alt={account.provider} className="w-6 h-6 object-contain rounded-md" referrerPolicy="no-referrer" />;
  }
  switch (account.type) {
    case 'bank': return <Building2 className="text-blue-500 dark:text-blue-400" size={20} />;
    case 'ewallet': return <Wallet className="text-purple-500 dark:text-purple-400" size={20} />;
    default: return <img src="/image/logo-coin.png" alt="Tunai" className="w-5 h-5 object-contain rounded-md" />;
  }
};

export default function TransactionList({ transactions, categories, accounts, contacts = [], onDelete, onEdit, searchQuery = '' }: TransactionListProps) {
  const { t } = useSettings();
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterAccount, setFilterAccount] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('all');
  const [customDateRange, setCustomDateRange] = useState<{start: string, end: string}>({ start: '', end: '' });
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const desktopExportMenuRef = useRef<HTMLDivElement>(null);
  const mobileExportMenuRef = useRef<HTMLDivElement>(null);
  const [showCustomDateSheet, setShowCustomDateSheet] = useState(false);

  useEffect(() => {
    if (dateFilter === 'custom') {
      setShowCustomDateSheet(true);
    } else {
      setShowCustomDateSheet(false);
    }
  }, [dateFilter]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const isOutsideDesktop = desktopExportMenuRef.current && !desktopExportMenuRef.current.contains(event.target as Node);
      const isOutsideMobile = mobileExportMenuRef.current && !mobileExportMenuRef.current.contains(event.target as Node);
      
      if (isOutsideDesktop && isOutsideMobile) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getCategoryName = (id: string) => categories.find((c) => c.id === id)?.name || id || t('Unknown');
  const getAccountName = (id: string) => accounts.find((a) => a.id === id)?.name || t('Unknown');
  const getContactName = (id: string) => contacts.find((c) => c.id === id)?.name;

  const filteredAndSortedTransactions = useMemo(() => {
    let result = [...(transactions || [])];

    // Filter by search query
    if (searchQuery.trim() !== '') {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.description.toLowerCase().includes(lowerQuery) ||
        getCategoryName(t.categoryId).toLowerCase().includes(lowerQuery) ||
        getAccountName(t.accountId).toLowerCase().includes(lowerQuery) ||
        (t.toAccountId && getAccountName(t.toAccountId).toLowerCase().includes(lowerQuery)) ||
        (t.contactId && getContactName(t.contactId)?.toLowerCase().includes(lowerQuery)) ||
        t.amount.toString().includes(lowerQuery)
      );
    }

    // Filter by account
    if (filterAccount !== 'all') {
      result = result.filter(t => t.accountId === filterAccount || t.toAccountId === filterAccount);
    }

    // Filter by date
    if (dateFilter !== 'all') {
      const now = new Date();
      now.setHours(23, 59, 59, 999);
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      if (dateFilter === 'today') {
        result = result.filter(t => {
          const d = new Date(t.date);
          return d >= todayStart && d <= now;
        });
      } else if (dateFilter === '30days') {
        const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        result = result.filter(t => new Date(t.date) >= past30);
      } else if (dateFilter === '90days') {
        const past90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        result = result.filter(t => new Date(t.date) >= past90);
      } else if (dateFilter === 'custom') {
        if (customDateRange.start) {
          const start = new Date(customDateRange.start);
          start.setHours(0, 0, 0, 0);
          result = result.filter(t => new Date(t.date) >= start);
        }
        if (customDateRange.end) {
          const end = new Date(customDateRange.end);
          end.setHours(23, 59, 59, 999);
          result = result.filter(t => new Date(t.date) <= end);
        }
      }
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'oldest':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'highest':
          return b.amount - a.amount;
        case 'lowest':
          return a.amount - b.amount;
        default:
          return 0;
      }
    });

    return result;
  }, [transactions, filterAccount, sortBy, dateFilter, customDateRange, searchQuery]);

  const exportToCSV = () => {
    const headers = [t('Tanggal'), t('Keterangan'), t('Kategori'), t('Rekening'), t('Nominal')];
    const rows = filteredAndSortedTransactions.map(t => [
      formatDate(t.date),
      `"${t.description}"`,
      `"${getCategoryName(t.categoryId)}"`,
      `"${getAccountName(t.accountId)}"`,
      t.amount.toString()
    ]);
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'jurnal_umum.csv';
    link.click();
  };

  const exportToText = () => {
    const lines = filteredAndSortedTransactions.map(t => 
      `${formatDate(t.date)} - ${t.description} - ${getCategoryName(t.categoryId)} - ${getAccountName(t.accountId)} - ${formatCurrency(t.amount)}`
    );
    const textContent = lines.join('\n');
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'jurnal_umum.txt';
    link.click();
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text(t('Jurnal Umum'), 14, 15);
    
    const headers = [[t('Tanggal'), t('Keterangan'), t('Kategori'), t('Rekening'), t('Nominal')]];
    const data = filteredAndSortedTransactions.map(t => [
      formatDate(t.date),
      t.description,
      getCategoryName(t.categoryId),
      getAccountName(t.accountId),
      formatCurrency(t.amount)
    ]);

    autoTable(doc, {
      head: headers,
      body: data,
      startY: 20,
    });

    doc.save('jurnal_umum.pdf');
  };

  const exportToImage = async () => {
    const tableElement = document.getElementById('jurnal-table-container');
    if (!tableElement) return;
    try {
      const canvas = await html2canvas(tableElement, { scale: 2, useCORS: true });
      const link = document.createElement('a');
      link.download = 'jurnal_umum.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error generating image:', error);
    }
  };

  const selectedTransaction = useMemo(() => 
    transactions.find(t => t.id === selectedTransactionId),
  [transactions, selectedTransactionId]);

  const handleShare = async (trx: Transaction) => {
    const text = `${t('Transaksi')}: ${trx.description}\n${t('Tanggal')}: ${formatDate(trx.date)}\n${t('Nominal')}: ${formatCurrency(trx.amount)}\n${t('Kategori')}: ${getCategoryName(trx.categoryId)}\n${t('Rekening')}: ${getAccountName(trx.accountId)}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: t('Detail Transaksi'),
          text: text,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(text);
      alert(t('Detail transaksi disalin ke clipboard!'));
    }
  };

  if (selectedTransaction) {
    return (
      <DetailTransaksi
        transaction={selectedTransaction}
        category={categories.find(c => c.id === selectedTransaction.categoryId)}
        account={accounts.find(a => a.id === selectedTransaction.accountId)}
        toAccount={accounts.find(a => a.id === selectedTransaction.toAccountId)}
        contact={contacts.find(c => c.id === selectedTransaction.contactId)}
        onClose={() => setSelectedTransactionId(null)}
      />
    );
  }

  const headerActionsElement = document.getElementById('header-actions-container');

  const exportMenu = (
    <div className="relative" ref={desktopExportMenuRef}>
      <button 
        onClick={() => setShowExportMenu(!showExportMenu)}
        className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
      >
        <MoreVertical size={20} />
      </button>
      
      <AnimatePresence>
        {showExportMenu && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-lg dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden z-50 transition-colors duration-200"
          >
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 mb-1">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('Download Riwayat')}</span>
            </div>
            <button onClick={() => { exportToPDF(); setShowExportMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2">
              <FilePdf size={16} /> {t('Eksport PDF')}
            </button>
            <button onClick={() => { exportToImage(); setShowExportMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2">
              <ImageIcon size={16} /> {t('Eksport Gambar')}
            </button>
            <button onClick={() => { exportToCSV(); setShowExportMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2">
              <FileSpreadsheet size={16} /> {t('Eksport Excel')}
            </button>
            <button onClick={() => { exportToText(); setShowExportMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2">
              <FileText size={16} /> {t('Salin Teks')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const dateOptions = [
    { value: 'all', label: t('Semua Waktu'), icon: <Calendar size={14} className="text-slate-400 hidden sm:block" /> },
    { value: 'today', label: t('Hari Ini'), icon: <Calendar size={14} className="text-slate-400 hidden sm:block" /> },
    { value: '30days', label: t('30 Hari'), icon: <Calendar size={14} className="text-slate-400 hidden sm:block" /> },
    { value: '90days', label: t('90 Hari'), icon: <Calendar size={14} className="text-slate-400 hidden sm:block" /> },
    { value: 'custom', label: t('Pilih Tgl'), icon: <Calendar size={14} className="text-slate-400 hidden sm:block" /> },
  ];

  const accountOptions = [
    { value: 'all', label: t('Semua Rekening'), icon: <Filter size={14} className="text-slate-400 hidden sm:block" /> },
    ...accounts.map(a => ({ value: a.id, label: a.name, icon: <Filter size={14} className="text-slate-400 hidden sm:block" /> }))
  ];

  const sortOptions = [
    { value: 'newest', label: t('Terbaru') },
    { value: 'oldest', label: t('Terlama') },
    { value: 'highest', label: t('Terbesar') },
    { value: 'lowest', label: t('Terkecil') },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      {headerActionsElement && createPortal(exportMenu, headerActionsElement)}
      
      {/* Filters and Actions Toolbar */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 w-full">
          {/* 3 Filter Cards */}
          <div className="flex-1 grid grid-cols-3 gap-2">
            <Combobox
              options={dateOptions}
              value={dateFilter}
              onChange={(val) => setDateFilter((val || 'all') as DateFilterOption)}
              className="px-2 sm:px-3 py-2 rounded-xl text-xs sm:text-sm"
              placeholder={t("Waktu")}
            />

            <Combobox
              options={accountOptions}
              value={filterAccount}
              onChange={(val) => setFilterAccount(val || 'all')}
              className="px-2 sm:px-3 py-2 rounded-xl text-xs sm:text-sm"
              placeholder={t("Rekening")}
            />
            
            <Combobox
              options={sortOptions}
              value={sortBy}
              onChange={(val) => setSortBy((val || 'newest') as SortOption)}
              className="px-2 sm:px-3 py-2 rounded-xl text-xs sm:text-sm"
              placeholder={t("Urutkan")}
            />
          </div>

          {/* Mobile 3-Dots Export Menu */}
          <div className="relative shrink-0 md:hidden" ref={mobileExportMenuRef}>
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors h-full flex items-center justify-center"
            >
              <MoreVertical size={20} />
            </button>
            
            <AnimatePresence>
              {showExportMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-lg dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden z-50 transition-colors duration-200"
                >
                  <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 mb-1">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('Download Riwayat')}</span>
                  </div>
                  <button onClick={() => { exportToPDF(); setShowExportMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2">
                    <FilePdf size={16} /> {t('Eksport PDF')}
                  </button>
                  <button onClick={() => { exportToImage(); setShowExportMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2">
                    <ImageIcon size={16} /> {t('Eksport Gambar')}
                  </button>
                  <button onClick={() => { exportToCSV(); setShowExportMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2">
                    <FileSpreadsheet size={16} /> {t('Eksport Excel')}
                  </button>
                  <button onClick={() => { exportToText(); setShowExportMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2">
                    <FileText size={16} /> {t('Salin Teks')}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {showCustomDateSheet && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/20 dark:bg-slate-950/80 backdrop-blur-sm p-4 sm:p-0">
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-xl w-full sm:w-auto p-6 flex flex-col gap-4 border border-slate-100 dark:border-slate-800 transition-colors duration-200"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">{t('Pilih Rentang Tanggal')}</h3>
                <button onClick={() => {
                  setShowCustomDateSheet(false);
                  if (!customDateRange.start && !customDateRange.end) {
                    setDateFilter('all');
                  }
                }} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300">
                  <SearchX size={20} />
                </button>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-full sm:w-auto">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{t('Dari')}</label>
                  <DatePicker
                    value={customDateRange.start}
                    onChange={val => setCustomDateRange(prev => ({ ...prev, start: val }))}
                    className="w-full"
                  />
                </div>
                <span className="text-slate-400 dark:text-slate-500 hidden sm:block mt-5">-</span>
                <div className="w-full sm:w-auto">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{t('Sampai')}</label>
                  <DatePicker
                    value={customDateRange.end}
                    onChange={val => setCustomDateRange(prev => ({ ...prev, end: val }))}
                    className="w-full"
                  />
                </div>
              </div>
              <button 
                onClick={() => setShowCustomDateSheet(false)}
                className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-sm"
              >
                {t('Terapkan')}
              </button>
            </motion.div>
          </div>
        )}
      </div>

      <motion.div 
        id="jurnal-table-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden w-full max-w-full transition-colors duration-200"
      >
        <div className="overflow-x-auto hidden md:block w-full">
        <table className="w-full text-left border-collapse min-w-max">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-sm border-b border-slate-100 dark:border-slate-800">
              <th className="px-6 py-4 font-medium">{t('Tanggal')}</th>
              <th className="px-6 py-4 font-medium">{t('Keterangan')}</th>
              <th className="px-6 py-4 font-medium">{t('Kategori')}</th>
              <th className="px-6 py-4 font-medium">{t('Rekening')}</th>
              <th className="px-6 py-4 font-medium text-center">{t('Bukti Transaksi')}</th>
              <th className="px-6 py-4 font-medium text-right">{t('Nominal')}</th>
              <th className="px-6 py-4 font-medium text-center">{t('Aksi')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/80 dark:divide-slate-800/80">
            <AnimatePresence mode="popLayout">
              {(filteredAndSortedTransactions || []).length === 0 ? (
                <motion.tr 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                      <SearchX size={48} className="mb-4 opacity-20" />
                      <p className="text-base font-medium text-slate-600 dark:text-slate-300">{t('Belum ada transaksi')}</p>
                      <p className="text-sm mt-1">{t('Coba sesuaikan filter atau tambah transaksi baru.')}</p>
                    </div>
                  </td>
                </motion.tr>
              ) : (
                filteredAndSortedTransactions.map((trx) => (
                  <motion.tr 
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                    key={trx.id} 
                    onClick={() => setSelectedTransactionId(trx.id)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatDate(trx.date)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{trx.description}</span>
                        {trx.contactId && (
                          <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 font-medium bg-orange-50 dark:bg-orange-500/10 w-fit px-2 py-0.5 rounded-md">
                            <User size={12} />
                            {getContactName(trx.contactId) || t('Kontak tidak diketahui')}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                      {trx.type === 'transfer' ? (
                        <span className="font-medium text-blue-600 dark:text-blue-400">{t('Mutasi')}</span>
                      ) : (
                        <span className="font-medium text-slate-700 dark:text-slate-300">{getCategoryName(trx.categoryId)}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                      {trx.type === 'transfer' ? (
                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-lg w-fit border border-slate-100 dark:border-slate-700">
                          <span className="font-medium">{getAccountName(trx.accountId)}</span>
                          <ArrowRightLeft size={12} className="text-slate-400 dark:text-slate-500" />
                          <span className="font-medium">{getAccountName(trx.toAccountId!)}</span>
                        </div>
                      ) : (
                        <span className="font-medium">{getAccountName(trx.accountId)}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {trx.receiptUrl ? (
                        <a href={trx.receiptUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 px-2.5 py-1.5 rounded-lg transition-colors">
                          <ImageIcon size={14} />
                          <span>{t('Lihat Bukti')}</span>
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {trx.type === 'income' ? (
                          <ArrowUpRight size={16} className="text-emerald-500 dark:text-emerald-400" />
                        ) : trx.type === 'expense' ? (
                          <ArrowDownRight size={16} className="text-rose-500 dark:text-rose-400" />
                        ) : (
                          <ArrowRightLeft size={16} className="text-blue-500 dark:text-blue-400" />
                        )}
                        <span className={trx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : trx.type === 'expense' ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400'}>
                          {formatCurrency(trx.amount)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(trx);
                          }}
                          className="text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-500/10"
                          title={t("Edit Transaksi")}
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShare(trx);
                          }}
                          className="text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-500/10"
                          title={t("Bagikan Transaksi")}
                        >
                          <Share2 size={18} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(trx.id);
                          }}
                          className="text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10"
                          title={t("Hapus Transaksi")}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Mobile View */}
      <div className="md:hidden divide-y divide-slate-100/80 dark:divide-slate-800/80">
        <AnimatePresence mode="popLayout">
          {(filteredAndSortedTransactions || []).length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-4 py-12 text-center"
            >
              <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                <SearchX size={40} className="mb-3 opacity-20" />
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{t('Belum ada transaksi')}</p>
              </div>
            </motion.div>
          ) : (
            filteredAndSortedTransactions.map((trx) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={trx.id}
                onClick={() => setSelectedTransactionId(trx.id)}
                className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 active:bg-slate-100 dark:active:bg-slate-800 cursor-pointer transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="p-2 rounded-xl shrink-0 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 flex items-center justify-center w-10 h-10">
                      {getAccountIcon(accounts.find(a => a.id === trx.accountId))}
                    </div>
                    <div className="flex flex-col min-w-0 pt-0.5">
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-none mb-1">{formatDate(trx.date)}</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-none mb-1.5 truncate">{trx.description}</p>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-none">
                          {trx.type === 'transfer' ? t('Mutasi') : getCategoryName(trx.categoryId)}
                        </span>
                        {trx.contactId && (
                          <span className="flex items-center gap-0.5 text-[9px] text-orange-600 dark:text-orange-400 font-medium bg-orange-50 dark:bg-orange-500/10 px-1 py-0.5 rounded leading-none">
                            <User size={8} />
                            {getContactName(trx.contactId) || t('Kontak')}
                          </span>
                        )}
                        {trx.receiptUrl && (
                          <a href={trx.receiptUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="flex items-center gap-0.5 text-[9px] font-medium px-1 py-0.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded leading-none">
                            <ImageIcon size={8} />
                            {t('Bukti')}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end justify-between self-stretch ml-2">
                    <div className="flex items-center gap-1.5">
                      <p className={`text-sm font-bold ${trx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : trx.type === 'expense' ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400'}`}>
                        {formatCurrency(trx.amount)}
                      </p>
                      <div className={`${trx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : trx.type === 'expense' ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400'}`}>
                        {trx.type === 'income' ? <ArrowUpRight size={16} strokeWidth={2.5} /> : trx.type === 'expense' ? <ArrowDownRight size={16} strokeWidth={2.5} /> : <ArrowRightLeft size={16} strokeWidth={2.5} />}
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 mt-2">
                      <button onClick={(e) => { e.stopPropagation(); onEdit(trx); }} className="text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleShare(trx); }} className="text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        <Share2 size={14} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); onDelete(trx.id); }} className="text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </motion.div>
    </div>
  );
}
