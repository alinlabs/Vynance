import React, { useState, useMemo } from 'react';
import { Calculator, Tag, Percent, ArrowRight, Info, TrendingUp, DollarSign, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSettings } from '../contexts/SettingsContext';
import { formatCurrency } from '../utils';

type ToolTab = 'cicilan' | 'pricing';

interface ToolsProps {
  activeTab: ToolTab;
  setActiveTab: (tab: ToolTab) => void;
}

export default function Tools({ activeTab, setActiveTab }: ToolsProps) {
  const { t, currency: baseCurrency } = useSettings();

  // Cicilan State
  const [principal, setPrincipal] = useState<number>(10000000);
  const [interestRate, setInterestRate] = useState<number>(10);
  const [tenor, setTenor] = useState<number>(12);
  const [interestType, setInterestType] = useState<'flat' | 'effective'>('flat');

  // Pricing State
  const [basePrice, setBasePrice] = useState<number>(100000);
  const [costPrice, setCostPrice] = useState<number>(70000);
  const [tiers, setTiers] = useState<{ qty: number; discount: number }[]>([
    { qty: 1, discount: 0 },
    { qty: 2, discount: 5 },
    { qty: 5, discount: 10 },
  ]);

  // Cicilan Calculation
  const cicilanResult = useMemo(() => {
    const monthlyRate = interestRate / 100 / 12;
    let monthlyPayment = 0;
    let totalInterest = 0;
    const schedule = [];

    if (interestType === 'flat') {
      const interestPerMonth = (principal * (interestRate / 100)) / 12;
      const principalPerMonth = principal / tenor;
      monthlyPayment = principalPerMonth + interestPerMonth;
      totalInterest = interestPerMonth * tenor;
      
      for (let i = 1; i <= tenor; i++) {
        schedule.push({
          month: i,
          principal: principalPerMonth,
          interest: interestPerMonth,
          total: monthlyPayment,
          remaining: principal - (principalPerMonth * i)
        });
      }
    } else {
      // Effective / Annuity
      monthlyPayment = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenor)) / (Math.pow(1 + monthlyRate, tenor) - 1);
      totalInterest = (monthlyPayment * tenor) - principal;
      
      let remainingBalance = principal;
      for (let i = 1; i <= tenor; i++) {
        const interestThisMonth = remainingBalance * monthlyRate;
        const principalThisMonth = monthlyPayment - interestThisMonth;
        remainingBalance -= principalThisMonth;
        schedule.push({
          month: i,
          principal: principalThisMonth,
          interest: interestThisMonth,
          total: monthlyPayment,
          remaining: Math.max(0, remainingBalance)
        });
      }
    }

    return {
      monthlyPayment,
      totalInterest,
      totalPayment: principal + totalInterest,
      schedule
    };
  }, [principal, interestRate, tenor, interestType]);

  const formatDisplay = (amount: number) => {
    return formatCurrency(amount, baseCurrency);
  };

  const [principalInput, setPrincipalInput] = useState(principal.toString());
  const [basePriceInput, setBasePriceInput] = useState(basePrice.toString());
  const [costPriceInput, setCostPriceInput] = useState(costPrice.toString());

  const handleNumberInput = (val: string, setter: (n: number) => void, inputSetter: (s: string) => void) => {
    const cleanValue = val.replace(/\D/g, '');
    if (cleanValue === '') {
      setter(0);
      inputSetter('');
    } else {
      const num = parseInt(cleanValue, 10);
      setter(num);
      inputSetter(num.toLocaleString('id-ID'));
    }
  };

  // Sync initial values
  useMemo(() => {
    setPrincipalInput(principal.toLocaleString('id-ID'));
    setBasePriceInput(basePrice.toLocaleString('id-ID'));
    setCostPriceInput(costPrice.toLocaleString('id-ID'));
  }, []);

  // Pricing Calculation
  const pricingResults = useMemo(() => {
    return tiers.map(tier => {
      const discountAmount = basePrice * (tier.discount / 100);
      const finalPrice = basePrice - discountAmount;
      const profitPerUnit = finalPrice - costPrice;
      const totalRevenue = finalPrice * tier.qty;
      const totalProfit = profitPerUnit * tier.qty;
      const margin = (profitPerUnit / finalPrice) * 100;

      return {
        ...tier,
        finalPrice,
        profitPerUnit,
        totalRevenue,
        totalProfit,
        margin
      };
    });
  }, [basePrice, costPrice, tiers]);

  const addTier = () => {
    setTiers([...tiers, { qty: tiers[tiers.length - 1].qty + 1, discount: 0 }]);
  };

  const removeTier = (index: number) => {
    if (tiers.length > 1) {
      setTiers(tiers.filter((_, i) => i !== index));
    }
  };

  const updateTier = (index: number, field: 'qty' | 'discount', value: number) => {
    const newTiers = [...tiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setTiers(newTiers);
  };

  return (
    <div className="w-full space-y-6 pb-24 md:pb-8">
      {/* Header Tabs - Only visible on mobile */}
      <div className="flex p-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-2xl w-fit mx-auto md:hidden">
        <button
          onClick={() => setActiveTab('cicilan')}
          className={`relative flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl transition-colors ${
            activeTab === 'cicilan' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          {activeTab === 'cicilan' && (
            <motion.div layoutId="tool-tab" className="absolute inset-0 bg-white dark:bg-slate-700 rounded-xl shadow-sm border border-slate-200/50 dark:border-slate-600/50 -z-10" />
          )}
          <Calculator size={18} />
          {t('Kalkulator Cicilan')}
        </button>
        <button
          onClick={() => setActiveTab('pricing')}
          className={`relative flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl transition-colors ${
            activeTab === 'pricing' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          {activeTab === 'pricing' && (
            <motion.div layoutId="tool-tab" className="absolute inset-0 bg-white dark:bg-slate-700 rounded-xl shadow-sm border border-slate-200/50 dark:border-slate-600/50 -z-10" />
          )}
          <Tag size={18} />
          {t('Analisis Harga')}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'cicilan' ? (
          <motion.div
            key="cicilan"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Inputs */}
            <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-5 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Info size={20} className="text-blue-500" />
                {t('Parameter Pinjaman')}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('Jumlah Pinjaman')}</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">{baseCurrency}</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={principalInput}
                      onChange={(e) => handleNumberInput(e.target.value, setPrincipal, setPrincipalInput)}
                      className="w-full pl-14 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('Bunga per Tahun (%)')}</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={interestRate}
                      onChange={(e) => setInterestRate(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    />
                    <Percent size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('Tenor (Bulan)')}</label>
                  <input
                    type="number"
                    value={tenor}
                    onChange={(e) => setTenor(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('Jenis Bunga')}</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setInterestType('flat')}
                      className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                        interestType === 'flat' 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600' 
                          : 'border-slate-100 dark:border-slate-800 text-slate-500'
                      }`}
                    >
                      Flat
                    </button>
                    <button
                      onClick={() => setInterestType('effective')}
                      className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                        interestType === 'effective' 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600' 
                          : 'border-slate-100 dark:border-slate-800 text-slate-500'
                      }`}
                    >
                      Efektif
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-lg shadow-blue-500/20">
                <p className="text-blue-100 text-sm font-medium mb-1">{t('Cicilan per Bulan')}</p>
                <h2 className="text-4xl font-bold mb-6">{formatDisplay(cicilanResult.monthlyPayment)}</h2>
                
                <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/10">
                  <div>
                    <p className="text-blue-100 text-xs mb-1">{t('Total Bunga')}</p>
                    <p className="text-xl font-bold">{formatDisplay(cicilanResult.totalInterest)}</p>
                  </div>
                  <div>
                    <p className="text-blue-100 text-xs mb-1">{t('Total Pembayaran')}</p>
                    <p className="text-xl font-bold">{formatDisplay(cicilanResult.totalPayment)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <TrendingUp size={18} className="text-emerald-500" />
                  {t('Ringkasan Analisis')}
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <span className="text-sm text-slate-600 dark:text-slate-400">{t('Persentase Bunga dari Pokok')}</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {((cicilanResult.totalInterest / principal) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <span className="text-sm text-slate-600 dark:text-slate-400">{t('Rasio Cicilan terhadap Pokok')}</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {(cicilanResult.monthlyPayment / principal * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100">{t('Jadwal Pembayaran')}</h4>
                </div>
                <div className="overflow-x-auto max-h-[400px]">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 z-10">
                      <tr>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('Bulan')}</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('Pokok')}</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('Bunga')}</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('Sisa')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {cicilanResult.schedule.map((row) => (
                        <tr key={row.month} className="text-xs">
                          <td className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400">{row.month}</td>
                          <td className="px-4 py-3 text-slate-900 dark:text-slate-100">{formatDisplay(row.principal)}</td>
                          <td className="px-4 py-3 text-rose-500">{formatDisplay(row.interest)}</td>
                          <td className="px-4 py-3 text-slate-500">{formatDisplay(row.remaining)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="pricing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('Harga Jual Dasar')}</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">{baseCurrency}</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={basePriceInput}
                    onChange={(e) => handleNumberInput(e.target.value, setBasePrice, setBasePriceInput)}
                    className="w-full pl-14 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('Modal per Unit (COGS)')}</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">{baseCurrency}</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={costPriceInput}
                    onChange={(e) => handleNumberInput(e.target.value, setCostPrice, setCostPriceInput)}
                    className="w-full pl-14 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <DollarSign size={20} className="text-blue-500" />
                  {t('Skema Diskon & Keuntungan')}
                </h3>
                <button
                  onClick={addTier}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl text-sm font-bold hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all"
                >
                  <Plus size={16} />
                  {t('Tambah Skema')}
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50">
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('Jumlah (Qty)')}</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('Diskon (%)')}</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('Harga Akhir')}</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('Profit/Unit')}</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('Total Profit')}</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('Margin')}</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {pricingResults.map((result, index) => (
                      <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={result.qty}
                            onChange={(e) => updateTier(index, 'qty', Number(e.target.value))}
                            className="w-20 px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="relative w-24">
                            <input
                              type="number"
                              value={result.discount}
                              onChange={(e) => updateTier(index, 'discount', Number(e.target.value))}
                              className="w-full pr-8 pl-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                            />
                            <Percent size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{formatDisplay(result.finalPrice)}</td>
                        <td className="px-6 py-4 font-medium text-emerald-600 dark:text-emerald-400">{formatDisplay(result.profitPerUnit)}</td>
                        <td className="px-6 py-4 font-bold text-blue-600 dark:text-blue-400">{formatDisplay(result.totalProfit)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${result.margin > 20 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400'}`}>
                            {result.margin.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => removeTier(index)}
                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
