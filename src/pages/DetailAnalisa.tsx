import React, { useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  ArrowLeft, 
  Download, 
  Copy, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck,
  PieChart,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';
import { Transaction, Account, SavingsPlan } from '../types';
import { formatCurrency } from '../utils';

interface DetailAnalisaProps {
  transactions: Transaction[];
  accounts: Account[];
  savingsPlans: SavingsPlan[];
}

export default function DetailAnalisa({ transactions, accounts, savingsPlans }: DetailAnalisaProps) {
  const { t, currency: baseCurrency } = useSettings();
  const navigate = useNavigate();
  const reportRef = useRef<HTMLDivElement>(null);

  const [displayCurrency, setDisplayCurrency] = React.useState(baseCurrency);
  const [exchangeRate, setExchangeRate] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadingProgress, setLoadingProgress] = React.useState(0);

  React.useEffect(() => {
    // Simulate analysis loading
    const duration = 2000;
    const interval = 50;
    const steps = duration / interval;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      setLoadingProgress(Math.min(100, (currentStep / steps) * 100));
      if (currentStep >= steps) {
        clearInterval(timer);
        setTimeout(() => setIsLoading(false), 300);
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
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
    if (displayCurrency !== baseCurrency) {
      fetchRate();
    } else {
      setExchangeRate(1);
    }
  }, [baseCurrency, displayCurrency]);

  const formatDisplay = (amount: number) => {
    return formatCurrency(amount * exchangeRate, displayCurrency);
  };

  const analysis = useMemo(() => {
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    
    // Last 30 days metrics
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentTransactions = transactions.filter(tx => new Date(tx.date) >= thirtyDaysAgo);
    const monthlyIncome = recentTransactions
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);
    const monthlyExpense = recentTransactions
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);

    // Category Breakdown
    const categoryTotals: Record<string, number> = {};
    recentTransactions.filter(tx => tx.type === 'expense').forEach(tx => {
      categoryTotals[tx.categoryId] = (categoryTotals[tx.categoryId] || 0) + tx.amount;
    });
    const topCategories = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    // Debt Analysis
    const totalDebt = transactions.reduce((acc, t) => {
      if (t.categoryId === 'inc_terima_pinjaman') return acc + t.amount;
      if (t.categoryId === 'exp_bayar_utang') return acc - t.amount;
      return acc;
    }, 0);
    const debtToIncomeRatio = monthlyIncome > 0 ? (totalDebt / monthlyIncome) * 100 : 0;

    // Ratios
    const savingsRatio = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpense) / monthlyIncome) * 100 : 0;
    const emergencyFundMonths = monthlyExpense > 0 ? totalBalance / monthlyExpense : totalBalance > 0 ? 99 : 0;
    
    // Health Score (0-100)
    let score = 40;
    if (savingsRatio > 30) score += 25;
    else if (savingsRatio > 15) score += 15;
    else if (savingsRatio > 0) score += 5;
    else score -= 10;

    if (emergencyFundMonths >= 6) score += 25;
    else if (emergencyFundMonths >= 3) score += 15;
    else if (emergencyFundMonths >= 1) score += 5;

    if (debtToIncomeRatio < 30) score += 10;
    else if (debtToIncomeRatio > 50) score -= 15;

    score = Math.max(0, Math.min(100, score));

    // Status & Insights
    let status = t('Cukup Sehat');
    let color = 'text-blue-500';
    let bgColor = 'bg-blue-500';
    
    if (score >= 85) {
      status = t('Sangat Sehat');
      color = 'text-emerald-500';
      bgColor = 'bg-emerald-500';
    } else if (score >= 70) {
      status = t('Sehat');
      color = 'text-teal-500';
      bgColor = 'bg-teal-500';
    } else if (score < 40) {
      status = t('Kurang Sehat');
      color = 'text-rose-500';
      bgColor = 'bg-rose-500';
    }

    const insights = [];
    if (savingsRatio < 10) insights.push({ type: 'warning', text: t('Rasio tabungan Anda rendah. Usahakan menyisihkan minimal 10-20% dari pendapatan untuk masa depan.') });
    if (emergencyFundMonths < 3) insights.push({ type: 'warning', text: t('Dana darurat Anda belum ideal. Targetkan minimal 3-6 bulan pengeluaran untuk mengantisipasi hal tak terduga.') });
    if (monthlyExpense > monthlyIncome) insights.push({ type: 'danger', text: t('Defisit Anggaran: Pengeluaran Anda melebihi pendapatan bulan ini. Segera evaluasi pos pengeluaran gaya hidup.') });
    if (debtToIncomeRatio > 35) insights.push({ type: 'danger', text: t('Rasio Utang Tinggi: Cicilan utang Anda sudah melebihi batas aman (35%). Hindari mengambil pinjaman baru.') });
    if (score >= 85) insights.push({ type: 'success', text: t('Manajemen Keuangan Prima! Anda memiliki kontrol yang sangat baik atas arus kas dan aset Anda.') });

    return {
      score,
      status,
      color,
      bgColor,
      monthlyIncome,
      monthlyExpense,
      savingsRatio,
      emergencyFundMonths,
      debtToIncomeRatio,
      totalDebt,
      topCategories,
      insights,
      totalBalance
    };
  }, [transactions, accounts, t]);

  const copyToClipboard = () => {
    const text = `
ANALISA KESEHATAN KEUANGAN - VYNANCE
-----------------------------------
Status: ${analysis.status} (${analysis.score}/100)
Total Saldo: ${formatDisplay(analysis.totalBalance)}
Pendapatan (30hr): ${formatDisplay(analysis.monthlyIncome)}
Pengeluaran (30hr): ${formatDisplay(analysis.monthlyExpense)}
Rasio Tabungan: ${analysis.savingsRatio.toFixed(1)}%
Dana Darurat: ${analysis.emergencyFundMonths.toFixed(1)} bulan
Rasio Utang: ${analysis.debtToIncomeRatio.toFixed(1)}%
Total Utang: ${formatDisplay(analysis.totalDebt)}

INSIGHTS:
${analysis.insights.map(i => `- ${i.text}`).join('\n')}
    `;
    navigator.clipboard.writeText(text);
    alert(t('Berhasil disalin ke clipboard!'));
  };

  const downloadAsText = () => {
    const text = `
ANALISA KESEHATAN KEUANGAN - VYNANCE
-----------------------------------
Status: ${analysis.status} (${analysis.score}/100)
Total Saldo: ${formatDisplay(analysis.totalBalance)}
Pendapatan (30hr): ${formatDisplay(analysis.monthlyIncome)}
Pengeluaran (30hr): ${formatDisplay(analysis.monthlyExpense)}
Rasio Tabungan: ${analysis.savingsRatio.toFixed(1)}%
Dana Darurat: ${analysis.emergencyFundMonths.toFixed(1)} bulan
Rasio Utang: ${analysis.debtToIncomeRatio.toFixed(1)}%
Total Utang: ${formatDisplay(analysis.totalDebt)}

INSIGHTS:
${analysis.insights.map(i => `- ${i.text}`).join('\n')}
    `;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Analisa_Keuangan_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 md:pb-8">
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center space-y-8"
          >
            <div className="relative w-24 h-24">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-4 border-blue-500/20 rounded-full"
              />
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-4 border-transparent border-t-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Activity className="text-blue-500 animate-pulse" size={36} />
              </div>
            </div>
            
            <div className="space-y-3 max-w-xs">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{t('Menganalisa Keuangan')}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{t('Mohon tunggu sejenak, kami sedang memproses seluruh data transaksi dan aset Anda.')}</p>
            </div>

            <div className="w-full max-w-xs space-y-3">
              <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-blue-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${loadingProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>{loadingProgress < 40 ? t('Memuat Data') : loadingProgress < 80 ? t('Menghitung Rasio') : t('Menyusun Laporan')}</span>
                <span className="text-blue-500">{Math.round(loadingProgress)}%</span>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto px-4 pt-6 space-y-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <button 
                onClick={() => navigate(-1)}
                className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('Detail Analisa Keuangan')}</h1>
              <div className="w-10" />
            </div>

            <div ref={reportRef} className="space-y-6">
              {/* Score Card */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm text-center relative overflow-hidden"
              >
                <div className={`absolute top-0 left-0 w-full h-2 ${analysis.bgColor}`} />
                <Activity className={`mx-auto mb-4 ${analysis.color}`} size={48} />
                <p className="text-slate-500 dark:text-slate-400 font-medium mb-1">{t('Skor Kesehatan Keuangan')}</p>
                <h2 className={`text-6xl font-black mb-2 ${analysis.color}`}>{analysis.score}</h2>
                <p className={`text-xl font-bold ${analysis.color}`}>{analysis.status}</p>
                
                <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-1 uppercase font-bold tracking-wider">{t('Rasio Tabungan')}</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{analysis.savingsRatio.toFixed(1)}%</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-1 uppercase font-bold tracking-wider">{t('Dana Darurat')}</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{analysis.emergencyFundMonths.toFixed(1)} bln</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-1 uppercase font-bold tracking-wider">{t('Rasio Utang')}</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{analysis.debtToIncomeRatio.toFixed(1)}%</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-1 uppercase font-bold tracking-wider">{t('Total Utang')}</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{formatDisplay(analysis.totalDebt)}</p>
                  </div>
                </div>
              </motion.div>

              {/* Monthly Flow */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
                      <TrendingUp size={20} />
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100">{t('Arus Masuk (30hr)')}</h3>
                  </div>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatDisplay(analysis.monthlyIncome)}</p>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg">
                      <TrendingDown size={20} />
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100">{t('Arus Keluar (30hr)')}</h3>
                  </div>
                  <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{formatDisplay(analysis.monthlyExpense)}</p>
                </motion.div>
              </div>

              {/* Top Categories */}
              {analysis.topCategories.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm"
                >
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                    <PieChart size={20} className="text-orange-500" />
                    {t('Alokasi Pengeluaran Terbesar')}
                  </h3>
                  <div className="space-y-3">
                    {analysis.topCategories.map(([catId, amount]) => (
                      <div key={catId} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-orange-500" />
                          <span className="text-sm text-slate-600 dark:text-slate-400 capitalize">{catId.replace(/_/g, ' ')}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{formatDisplay(amount)}</p>
                          <p className="text-[10px] text-slate-500">{((amount / analysis.monthlyExpense) * 100).toFixed(1)}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Insights */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm"
              >
                <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
                  <ShieldCheck size={20} className="text-blue-500" />
                  {t('Rekomendasi & Pertimbangan')}
                </h3>
                <div className="space-y-4">
                  {analysis.insights.map((insight, idx) => (
                    <div key={idx} className={`flex gap-3 p-4 rounded-2xl ${
                      insight.type === 'danger' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400' :
                      insight.type === 'warning' ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400' :
                      'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                    }`}>
                      {insight.type === 'danger' || insight.type === 'warning' ? <AlertCircle size={20} className="shrink-0" /> : <CheckCircle2 size={20} className="shrink-0" />}
                      <p className="text-sm font-medium leading-relaxed">{insight.text}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Export Actions */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <button 
                onClick={copyToClipboard}
                className="flex items-center justify-center gap-2 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-600 dark:text-slate-400 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                <Copy size={18} />
                {t('Salin Teks')}
              </button>
              <button 
                onClick={downloadAsText}
                className="flex items-center justify-center gap-2 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-600 dark:text-slate-400 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                <FileText size={18} />
                {t('Download TXT')}
              </button>
              <button 
                onClick={() => window.print()}
                className="col-span-2 md:col-span-1 flex items-center justify-center gap-2 p-4 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
              >
                <Download size={18} />
                {t('Cetak / PDF')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
