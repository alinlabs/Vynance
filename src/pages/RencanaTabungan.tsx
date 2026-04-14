import React, { useState } from 'react';
import { SavingsPlan, Account } from '../types';
import { formatCurrency } from '../utils';
import { Target, Plus, TrendingUp, Edit2, Trash2, WalletCards } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSettings } from '../contexts/SettingsContext';
import Combobox from '../components/Combobox';
import DatePicker from '../components/DatePicker';

interface RencanaTabunganProps {
  savingsPlans: SavingsPlan[];
  accounts: Account[];
  onAddPlan: (plan: Omit<SavingsPlan, 'id'>) => void;
  onUpdatePlan: (id: string, data: Partial<Omit<SavingsPlan, 'id'>>) => void;
  onDeletePlan: (id: string) => void;
}

export default function RencanaTabungan({ savingsPlans, accounts, onAddPlan, onUpdatePlan, onDeletePlan }: RencanaTabunganProps) {
  const { t } = useSettings();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [targetAmountDisplay, setTargetAmountDisplay] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [notes, setNotes] = useState('');
  const [accountId, setAccountId] = useState('');
  const [billingMethod, setBillingMethod] = useState<'daily' | '3days' | 'weekly' | 'monthly' | 'specific_date' | ''>('');
  const [billingDate, setBillingDate] = useState<number | ''>('');

  React.useEffect(() => {
    const handleAddRencana = () => {
      setIsAdding(true);
      setEditingId(null);
      setName('');
      setTargetAmountDisplay('');
      setCurrentAmount('');
      setTargetDate('');
      setNotes('');
      setAccountId(accounts.length > 0 ? accounts[0].id : '');
      setBillingMethod('');
      setBillingDate('');
    };
    window.addEventListener('vynance-add-rencana', handleAddRencana);
    return () => window.removeEventListener('vynance-add-rencana', handleAddRencana);
  }, [accounts]);

  const resetForm = () => {
    setName('');
    setTargetAmountDisplay('');
    setCurrentAmount('');
    setTargetDate('');
    setNotes('');
    setAccountId(accounts.length > 0 ? accounts[0].id : '');
    setBillingMethod('');
    setBillingDate('');
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (plan: SavingsPlan) => {
    setName(plan.name);
    setTargetAmountDisplay(new Intl.NumberFormat('id-ID').format(plan.targetAmount));
    setCurrentAmount(plan.currentAmount.toString());
    setTargetDate(plan.targetDate || '');
    setNotes(plan.notes || '');
    setAccountId(plan.accountId);
    setBillingMethod(plan.billingMethod || '');
    setBillingDate(plan.billingDate || '');
    setEditingId(plan.id);
    setIsAdding(true);
  };

  const handleTargetAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value === '') {
      setTargetAmountDisplay('');
      return;
    }
    const numericValue = parseInt(value, 10);
    setTargetAmountDisplay(new Intl.NumberFormat('id-ID').format(numericValue));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericTargetAmount = parseInt(targetAmountDisplay.replace(/\D/g, ''), 10) || 0;
    if (!name || !numericTargetAmount || !accountId) return;

    const planData = {
      name,
      targetAmount: numericTargetAmount,
      currentAmount: editingId ? Number(currentAmount) : 0,
      targetDate: targetDate || undefined,
      notes: notes || undefined,
      accountId,
      billingMethod: billingMethod || undefined,
      billingDate: billingDate ? Number(billingDate) : undefined,
    };

    if (editingId) {
      onUpdatePlan(editingId, planData);
    } else {
      onAddPlan(planData);
    }
    resetForm();
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      <AnimatePresence mode="wait">
        {isAdding ? (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 md:p-6"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('Nama Rencana')}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                  placeholder={t('Contoh: Beli Mobil, Liburan')}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('Rekening Induk')}</label>
                  <Combobox
                    options={accounts.map(acc => ({ value: acc.id, label: acc.name }))}
                    value={accountId}
                    onChange={setAccountId}
                    placeholder={t("Pilih Rekening")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('Target Jumlah')}</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-medium">Rp</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={targetAmountDisplay}
                      onChange={handleTargetAmountChange}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                      placeholder="0"
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('Target Tanggal (Opsional)')}</label>
                  <DatePicker value={targetDate} onChange={setTargetDate} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('Catatan (Opsional)')}</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                    placeholder={t('Catatan tambahan')}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('Metode Tagihan (Opsional)')}</label>
                  <select
                    value={billingMethod}
                    onChange={(e) => setBillingMethod(e.target.value as any)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                  >
                    <option value="">{t('Tidak ada tagihan')}</option>
                    <option value="daily">{t('Setiap Hari')}</option>
                    <option value="3days">{t('Setiap 3 Hari')}</option>
                    <option value="weekly">{t('Setiap Minggu')}</option>
                    <option value="monthly">{t('Setiap Bulan')}</option>
                    <option value="specific_date">{t('Tanggal Tertentu')}</option>
                  </select>
                </div>
                {billingMethod === 'specific_date' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('Tanggal Tagihan (1-31)')}</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={billingDate}
                      onChange={(e) => setBillingDate(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                      placeholder="1-31"
                    />
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 rounded-xl font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  {t('Batal')}
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  {t('Simpan')}
                </button>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
          >
            {savingsPlans.length === 0 ? (
              <div className="col-span-full bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 text-center">
                <Target className="mx-auto text-slate-400 mb-3" size={48} />
                <p className="text-slate-500 dark:text-slate-400">{t('Belum ada rencana tabungan.')}</p>
                <button
                  onClick={() => setIsAdding(true)}
                  className="mt-4 text-blue-600 dark:text-blue-400 font-medium hover:underline"
                >
                  {t('Buat Rencana Pertama')}
                </button>
              </div>
            ) : (
              savingsPlans.map((plan) => {
                const progress = plan.targetAmount > 0 ? Math.min(100, Math.round((plan.currentAmount / plan.targetAmount) * 100)) : 0;
                
                return (
                  <div key={plan.id} className="bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 md:p-6 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white text-lg">{plan.name}</h3>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                          <WalletCards size={14} />
                          <span>{accounts.find(a => a.id === plan.accountId)?.name || t('Unknown Account')}</span>
                        </div>
                        {plan.targetDate && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {t('Target:')} {new Date(plan.targetDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(plan)} className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => onDeletePlan(plan.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-center my-4">
                      <div className="flex justify-between items-end mb-2">
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{t('Terkumpul')}</p>
                          <p className="font-semibold text-slate-900 dark:text-white">{formatCurrency(plan.currentAmount)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500 dark:text-slate-400">{t('Target')}</p>
                          <p className="font-semibold text-blue-600 dark:text-blue-400">{formatCurrency(plan.targetAmount)}</p>
                        </div>
                      </div>
                      
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 mb-1 overflow-hidden">
                        <div 
                          className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <p className="text-right text-xs font-medium text-slate-600 dark:text-slate-300">{progress}%</p>
                    </div>
                    
                    {plan.notes && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                        {plan.notes}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
