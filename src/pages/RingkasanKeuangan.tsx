import React, { useState, useMemo } from 'react';
import { Transaction, Account, Category, SavingsPlan } from '../types';
import { formatCurrency } from '../utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Wallet, TrendingUp, TrendingDown, CreditCard, Building2, Coins, PieChart as PieChartIcon, Activity, ArrowDownRight, ArrowUpRight, Calendar, SearchX, Search, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSettings } from '../contexts/SettingsContext';
import Combobox from '../components/Combobox';
import DatePicker from '../components/DatePicker';
import { useNavigate } from 'react-router-dom';
import { CURRENCY_OPTIONS } from '../constants';

interface DashboardProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  savingsPlans: SavingsPlan[];
}

type DateFilterOption = 'all' | 'today' | '30days' | '90days' | 'custom';

export default function Dashboard({ transactions, accounts, categories, savingsPlans }: DashboardProps) {
  const { t, currency: baseCurrency } = useSettings();
  const navigate = useNavigate();
  const [categoryType, setCategoryType] = useState<'expense' | 'income'>('expense');
  const [chartType, setChartType] = useState<'daily' | 'transaction'>('daily');
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('all');
  const [customDateRange, setCustomDateRange] = useState<{start: string, end: string}>({ start: '', end: '' });
  const [showCustomDateSheet, setShowCustomDateSheet] = useState(false);

  const [displayCurrency, setDisplayCurrency] = useState(baseCurrency);
  const [exchangeRate, setExchangeRate] = useState(1);

  React.useEffect(() => {
    if (displayCurrency === baseCurrency) {
      setExchangeRate(1);
      return;
    }
    const fetchRate = async () => {
      try {
        const res = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`);
        const data = await res.json();
        if (data && data.rates && data.rates[displayCurrency]) {
          setExchangeRate(data.rates[displayCurrency]);
        }
      } catch (e) {
        console.error("Failed to fetch exchange rate", e);
      }
    };
    fetchRate();
  }, [baseCurrency, displayCurrency]);

  const formatDisplay = (amount: number) => {
    return formatCurrency(amount * exchangeRate, displayCurrency);
  };

  const fullUserName = localStorage.getItem('vinance_user_name') || '';
  
  // Extract first name, handling abbreviations like "M. Ridwan" or "M Ridwan"
  const getFirstName = (name: string) => {
    if (!name) return '';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    
    // If first part is an abbreviation like "M.", "Muh", "A.", skip it and return the next part
    if (parts[0].length <= 3 || parts[0].endsWith('.')) {
      return parts[1] || parts[0];
    }
    return parts[0];
  };

  const userName = getFirstName(fullUserName);
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 11) return t('Selamat Pagi');
    if (hour < 15) return t('Selamat Siang');
    if (hour < 19) return t('Selamat Sore');
    return t('Selamat Malam');
  };

  const filteredTransactions = useMemo(() => {
    let result = [...(transactions || [])];
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
    return result;
  }, [transactions, dateFilter, customDateRange]);

  const totalIncome = filteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpense = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalBalance = dateFilter === 'all' 
    ? accounts.reduce((sum, acc) => sum + acc.balance, 0)
    : totalIncome - totalExpense;

  const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'];

  // Prepare data for category chart
  const dataByCategory = (Object.values(
    filteredTransactions
      .filter((t) => t.type === categoryType)
      .reduce((acc, t) => {
        if (!acc[t.categoryId]) {
          const cat = (categories || []).find(c => c.id === t.categoryId);
          acc[t.categoryId] = {
            name: cat ? cat.name : t.categoryId,
            value: 0,
          };
        }
        acc[t.categoryId].value += t.amount;
        return acc;
      }, {} as Record<string, { name: string, value: number }>)
  ) as { name: string, value: number }[])
  .filter((item) => item.value > 0)
  .map((item, index) => ({
    ...item,
    color: CHART_COLORS[index % CHART_COLORS.length]
  }));

  // Calculate Utang & Piutang
  const totalUtang = filteredTransactions.reduce((acc, t) => {
    if (t.categoryId === 'inc_terima_pinjaman') return acc + t.amount;
    if (t.categoryId === 'exp_bayar_utang') return acc - t.amount;
    return acc;
  }, 0);

  const totalPiutang = filteredTransactions.reduce((acc, t) => {
    if (t.categoryId === 'exp_kasih_pinjaman') return acc + t.amount;
    if (t.categoryId === 'inc_bayar_utang') return acc - t.amount;
    return acc;
  }, 0);

  // Prepare data for line chart (transactions per day, only dates with transactions)
  const transactionsByDate = filteredTransactions.reduce((acc, t) => {
    const date = t.date;
    if (!acc[date]) {
      acc[date] = { date, income: 0, expense: 0 };
    }
    if (t.type === 'income') acc[date].income += t.amount;
    if (t.type === 'expense') acc[date].expense += t.amount;
    return acc;
  }, {} as Record<string, { date: string, income: number, expense: number }>);

  const dailyChartData = (Object.values(transactionsByDate) as { date: string, income: number, expense: number }[])
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(d => ({
      ...d,
      dateFormatted: new Date(d.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
    }));

  const perTransactionChartData = [...filteredTransactions]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((t, i) => ({
      dateFormatted: `Trx ${i + 1}`,
      income: t.type === 'income' ? t.amount : 0,
      expense: t.type === 'expense' ? t.amount : 0,
    }));

  const lineChartData = chartType === 'daily' ? dailyChartData : perTransactionChartData;

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

  const getAccountIcon = (account: Account) => {
    if (account.provider && PROVIDER_LOGOS[account.provider]) {
      return <img src={PROVIDER_LOGOS[account.provider]} alt={account.provider} className="w-full h-full object-contain rounded-lg" referrerPolicy="no-referrer" />;
    }
    switch (account.type) {
      case 'bank': return <Building2 size={20} />;
      case 'ewallet': return <Wallet size={20} />;
      default: return <img src="/image/logo-coin.png" alt="Tunai" className="w-full h-full object-contain rounded-lg" />;
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
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  const dateOptions = [
    { value: 'all', label: t('Semua Waktu'), icon: <Calendar size={14} className="text-slate-400 hidden sm:block" /> },
    { value: 'today', label: t('Hari Ini'), icon: <Calendar size={14} className="text-slate-400 hidden sm:block" /> },
    { value: '30days', label: t('30 Hari'), icon: <Calendar size={14} className="text-slate-400 hidden sm:block" /> },
    { value: '90days', label: t('90 Hari'), icon: <Calendar size={14} className="text-slate-400 hidden sm:block" /> },
    { value: 'custom', label: t('Pilih Tgl'), icon: <Calendar size={14} className="text-slate-400 hidden sm:block" /> },
  ];

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Mobile Hero Section */}
      <motion.div variants={itemVariants} className="md:hidden bg-blue-600 -mx-3 -mt-3 p-6 rounded-b-3xl shadow-md text-white mb-6 relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white/10 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 rounded-full bg-white/10 blur-xl"></div>
        
        <div className="relative z-10">
          <h1 className="text-2xl font-bold mb-1">
            {getGreeting()}, {userName || t('Pengguna')}
          </h1>
          <p className="text-blue-100 text-sm font-light mb-6">
            {t('Ayo buat catatan keuangan mu hari ini')}
          </p>
          
          <div 
            onClick={() => navigate('/riwayat?search=true')}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 rounded-xl p-3 flex items-center gap-3 cursor-pointer transition-colors"
          >
            <Search size={20} className="text-white/80" />
            <span className="text-white/80 text-sm">{t('Cari transaksi...')}</span>
          </div>
        </div>
      </motion.div>

      {/* Desktop Greeting & Search */}
      <motion.div variants={itemVariants} className="hidden md:flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            <span>{getGreeting()}</span>
            <span>, </span>
            <span className="text-blue-600 dark:text-blue-400">{userName || t('Pengguna')}</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('Berikut adalah ringkasan keuangan Anda saat ini.')}</p>
        </div>
        
        <div 
          onClick={() => navigate('/riwayat?search=true')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 rounded-xl p-3 flex items-center gap-3 cursor-pointer transition-colors shadow-sm w-64"
        >
          <Search size={20} className="text-slate-400" />
          <span className="text-slate-500 dark:text-slate-400 text-sm">{t('Cari transaksi...')}</span>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants} className="flex flex-row items-center gap-3">
        {/* Date Filter */}
        <div className="flex-1 flex flex-col gap-1.5 min-w-0">
          <div className="flex items-center gap-1.5 px-1">
            <Calendar size={14} className="text-slate-400 dark:text-slate-500" />
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('Waktu')}</span>
          </div>
          <div className="flex items-center bg-white dark:bg-slate-900 p-2 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-800 transition-colors duration-200">
            <Combobox
              options={dateOptions}
              value={dateFilter}
              onChange={(val) => {
                setDateFilter((val || 'all') as DateFilterOption);
                if (val === 'custom') setShowCustomDateSheet(true);
              }}
              className="px-2 py-1 rounded-lg text-[11px] sm:text-sm border-none bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800 w-full font-medium"
              placeholder={t("Waktu")}
            />
          </div>
        </div>

        {/* Currency Filter */}
        <div className="flex-1 flex flex-col gap-1.5 min-w-0">
          <div className="flex items-center gap-1.5 px-1">
            <Coins size={14} className="text-slate-400 dark:text-slate-500" />
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('Kurs')}</span>
          </div>
          <div className="flex items-center bg-white dark:bg-slate-900 p-2 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-800 transition-colors duration-200">
            <Combobox
              options={CURRENCY_OPTIONS}
              value={displayCurrency}
              onChange={(val) => setDisplayCurrency(val || baseCurrency)}
              className="px-2 py-1 rounded-lg text-[11px] sm:text-sm border-none bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800 w-full font-medium"
              placeholder={t("Mata Uang")}
            />
          </div>
        </div>
      </motion.div>

      {showCustomDateSheet && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/20 dark:bg-slate-950/80 backdrop-blur-sm p-4 sm:p-0">
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-xl w-full sm:w-auto p-6 flex flex-col gap-4 border border-slate-100 dark:border-slate-800"
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

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
        <motion.div variants={itemVariants} className="col-span-2 md:col-span-1 bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-800 relative overflow-hidden group transition-colors duration-200">
          <div className="relative z-10 flex items-center justify-between">
            <div className="@container min-w-0 flex-1 pr-2 md:pr-4">
              <p className="text-[clamp(10px,8cqw,14px)] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">{t('Total Saldo')}</p>
              <p className="text-[clamp(12px,12cqw,24px)] font-bold text-slate-900 dark:text-slate-100 mt-1 md:mt-2 tracking-tight whitespace-nowrap">{formatDisplay(totalBalance)}</p>
              <button 
                onClick={() => navigate('/analisa')}
                className="mt-3 flex items-center gap-1.5 text-[10px] md:text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1.5 rounded-lg border border-blue-100 dark:border-blue-500/20"
              >
                <Activity size={14} />
                {t('Analisa Kesehatan Keuangan')}
              </button>
            </div>
            <div className="shrink-0 w-10 h-10 md:w-14 md:h-14 bg-blue-50/80 dark:bg-blue-500/10 rounded-xl md:rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-inner border border-blue-100/50 dark:border-blue-500/20">
              <Wallet className="w-5 h-5 md:w-[26px] md:h-[26px]" />
            </div>
          </div>
        </motion.div>
        
        <motion.div variants={itemVariants} className="col-span-1 bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl p-3 md:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-800 relative overflow-hidden group transition-colors duration-200">
          <div className="relative z-10 flex items-center justify-between">
            <div className="@container min-w-0 flex-1 pr-1 md:pr-2">
              <p className="text-[clamp(10px,8cqw,14px)] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">{t('Pemasukan')}</p>
              <p className="text-[clamp(12px,12cqw,20px)] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 md:mt-2 tracking-tight whitespace-nowrap">{formatDisplay(totalIncome)}</p>
            </div>
            <div className="shrink-0 w-8 h-8 md:w-12 md:h-14 bg-emerald-50/80 dark:bg-emerald-500/10 rounded-lg md:rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-inner border border-emerald-100/50 dark:border-emerald-500/20">
              <TrendingUp className="w-4 h-4 md:w-6 md:h-[26px]" />
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="col-span-1 bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl p-3 md:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-800 relative overflow-hidden group transition-colors duration-200">
          <div className="relative z-10 flex items-center justify-between">
            <div className="@container min-w-0 flex-1 pr-1 md:pr-2">
              <p className="text-[clamp(10px,8cqw,14px)] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">{t('Pengeluaran')}</p>
              <p className="text-[clamp(12px,12cqw,20px)] font-bold text-rose-600 dark:text-rose-400 mt-0.5 md:mt-2 tracking-tight whitespace-nowrap">{formatDisplay(totalExpense)}</p>
            </div>
            <div className="shrink-0 w-8 h-8 md:w-12 md:h-14 bg-rose-50/80 dark:bg-rose-500/10 rounded-lg md:rounded-2xl flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-inner border border-rose-100/50 dark:border-rose-500/20">
              <TrendingDown className="w-4 h-4 md:w-6 md:h-[26px]" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Utang & Piutang Cards */}
      <div className="grid grid-cols-2 gap-3 md:gap-6">
        <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl p-3 md:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-800 relative overflow-hidden group transition-colors duration-200">
          <div className="relative z-10 flex items-center justify-between">
            <div className="@container min-w-0 flex-1 pr-1 md:pr-2">
              <p className="text-[clamp(10px,8cqw,14px)] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">{t('Piutang (Diterima)')}</p>
              <p className="text-[clamp(12px,12cqw,20px)] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 md:mt-2 tracking-tight whitespace-nowrap">{formatDisplay(totalPiutang)}</p>
            </div>
            <div className="shrink-0 w-8 h-8 md:w-12 md:h-14 bg-emerald-50/80 dark:bg-emerald-500/10 rounded-lg md:rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-inner border border-emerald-100/50 dark:border-emerald-500/20">
              <ArrowUpRight className="w-4 h-4 md:w-6 md:h-[26px]" />
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl p-3 md:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-800 relative overflow-hidden group transition-colors duration-200">
          <div className="relative z-10 flex items-center justify-between">
            <div className="@container min-w-0 flex-1 pr-1 md:pr-2">
              <p className="text-[clamp(10px,8cqw,14px)] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">{t('Utang (Dibayar)')}</p>
              <p className="text-[clamp(12px,12cqw,20px)] font-bold text-rose-600 dark:text-rose-400 mt-0.5 md:mt-2 tracking-tight whitespace-nowrap">{formatDisplay(totalUtang)}</p>
            </div>
            <div className="shrink-0 w-8 h-8 md:w-12 md:h-14 bg-rose-50/80 dark:bg-rose-500/10 rounded-lg md:rounded-2xl flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-inner border border-rose-100/50 dark:border-rose-500/20">
              <ArrowDownRight className="w-4 h-4 md:w-6 md:h-[26px]" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Savings Plans Section */}
      {savingsPlans && savingsPlans.length > 0 && (
        <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-800 flex flex-col transition-colors duration-200">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <Target className="text-blue-500" size={20} />
              {t('Rencana Tabungan')}
            </h2>
            <button
              onClick={() => navigate('/rencana')}
              className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline"
            >
              {t('Lihat Semua')}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savingsPlans.slice(0, 2).map(plan => {
              const progress = plan.targetAmount > 0 ? Math.min(100, Math.round((plan.currentAmount / plan.targetAmount) * 100)) : 0;
              return (
                <div key={plan.id} className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-500/30 transition-colors cursor-pointer" onClick={() => navigate('/rencana')}>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-slate-900 dark:text-white">{plan.name}</h3>
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded-md">
                      {progress}%
                    </span>
                  </div>
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{t('Terkumpul')}</p>
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">{formatDisplay(plan.currentAmount)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500 dark:text-slate-400">{t('Target')}</p>
                      <p className="font-semibold text-blue-600 dark:text-blue-400 text-sm">{formatDisplay(plan.targetAmount)}</p>
                    </div>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Account Balances */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-800 flex flex-col transition-colors duration-200">
          <h2 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 md:mb-6 tracking-tight">{t('Saldo Rekening')}</h2>
          <div className="space-y-3 flex-1">
            {(accounts || []).length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 py-8">
                <Wallet size={48} className="mb-3 opacity-20" />
                <p className="text-sm text-center max-w-[200px]">{t('Belum ada rekening. Tambahkan rekening saat membuat transaksi.')}</p>
              </div>
            ) : (
              accounts.map((account) => (
                <div key={account.id} className="group flex items-center justify-between p-3 md:p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-600 transition-all">
                  <div className="flex items-center gap-2.5 md:gap-4 min-w-0 flex-1">
                    <div className="w-8 h-8 md:w-12 md:h-12 bg-white dark:bg-slate-900 rounded-lg md:rounded-xl flex items-center justify-center shadow-sm text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-700 group-hover:scale-105 transition-transform shrink-0">
                      {getAccountIcon(account)}
                    </div>
                    <div className="min-w-0 pr-2">
                      <p className="font-semibold text-slate-900 dark:text-slate-100 text-xs md:text-base line-clamp-2 leading-tight">{account.name}</p>
                      <div className="text-[9px] md:text-xs text-slate-500 dark:text-slate-400 flex flex-col mt-0.5">
                        <span className="capitalize truncate">{t(account.type)} {account.provider ? `• ${account.provider}` : ''}</span>
                        {account.accountNumber && (
                          <span className="mt-0.5 text-slate-400 dark:text-slate-500 truncate">
                            {account.accountNumber} {account.accountName ? `(a/n ${account.accountName})` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="@container shrink-0 text-right pl-2 w-[40%] max-w-[160px]">
                    <p className="font-bold text-slate-900 dark:text-slate-100 text-[clamp(12px,14cqw,16px)] whitespace-nowrap">{formatDisplay(account.balance)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Expense Chart */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-800 flex flex-col transition-colors duration-200">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
              <span className="md:hidden">{t('Kategori')}</span>
              <span className="hidden md:inline">{t('Per Kategori')}</span>
            </h2>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              <button
                onClick={() => setCategoryType('expense')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${categoryType === 'expense' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                {t('Pengeluaran')}
              </button>
              <button
                onClick={() => setCategoryType('income')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${categoryType === 'income' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                {t('Pemasukan')}
              </button>
            </div>
          </div>
          {(dataByCategory || []).length > 0 ? (
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8 flex-1">
              <div className="h-[200px] w-[200px] md:h-[250px] md:w-[250px] shrink-0">
                <ResponsiveContainer width="100%" height="100%" style={{ outline: 'none' }}>
                  <PieChart style={{ outline: 'none' }}>
                    <Pie
                      data={dataByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius="60%"
                      outerRadius="80%"
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                      style={{ outline: 'none' }}
                    >
                      {dataByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} className="hover:opacity-80 transition-opacity cursor-pointer" style={{ outline: 'none' }} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => formatDisplay(value)}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', padding: '12px 16px', fontWeight: 500, backgroundColor: 'var(--color-slate-900)' }}
                      itemStyle={{ color: 'var(--color-slate-100)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-row flex-wrap justify-center md:flex-col md:justify-center gap-3 md:gap-4 w-full md:w-auto">
                {dataByCategory.map((entry, index) => (
                  <div key={index} className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                    <div className="flex flex-col">
                      <span className="text-[10px] md:text-sm font-medium text-slate-700 dark:text-slate-300 leading-tight">{entry.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[300px] flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
              <PieChartIcon size={48} className="mb-3 opacity-20" />
              <p className="text-sm">{t('Belum ada data')}</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Line Chart for Transactions Over Time */}
      <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-800 flex flex-col transition-colors duration-200">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h2 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
            <span className="md:hidden">{t('Transaksi')}</span>
            <span className="hidden md:inline">{t('Grafik Transaksi')}</span>
          </h2>
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <button
              onClick={() => setChartType('daily')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${chartType === 'daily' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              {t('Harian')}
            </button>
            <button
              onClick={() => setChartType('transaction')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${chartType === 'transaction' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              {t('Per Transaksi')}
            </button>
          </div>
        </div>
        {(lineChartData || []).length > 0 ? (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%" style={{ outline: 'none' }}>
              <LineChart data={lineChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }} style={{ outline: 'none' }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:opacity-10" />
                <XAxis 
                  dataKey="dateFormatted" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#64748b' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickFormatter={(value) => formatDisplay(value)}
                  width={70}
                />
                <Tooltip 
                  formatter={(value: number) => formatDisplay(value)}
                  labelStyle={{ color: '#64748b', marginBottom: '4px' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', padding: '12px 16px', fontWeight: 500, backgroundColor: 'var(--color-slate-900)' }}
                  itemStyle={{ color: 'var(--color-slate-100)' }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '13px', fontWeight: 500, color: '#64748b', paddingBottom: '20px' }}
                />
                <Line type="monotone" name={t('Pemasukan')} dataKey="income" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6, outline: 'none' }} style={{ outline: 'none' }} />
                <Line type="monotone" name={t('Pengeluaran')} dataKey="expense" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6, outline: 'none' }} style={{ outline: 'none' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[300px] flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
            <Activity size={48} className="mb-3 opacity-20" />
            <p className="text-sm">{t('Belum ada data transaksi')}</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
