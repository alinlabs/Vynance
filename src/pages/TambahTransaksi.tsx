import React, { useState, useEffect } from 'react';
import { Account, Category, TransactionType, AccountType, Contact, Transaction, SavingsPlan } from '../types';
import { X, Plus, Image as ImageIcon, Camera, FileText, ArrowRight, ArrowLeft, UserPlus, SwitchCamera } from 'lucide-react';
import TambahRekening from './TambahRekening';
import { motion, AnimatePresence } from 'motion/react';
import Combobox from '../components/Combobox';
import { useSettings } from '../contexts/SettingsContext';
import { formatCurrency, getBankCode, getBankLogoFromCode } from '../utils';

import DatePicker from '../components/DatePicker';

interface TransactionFormProps {
  accounts: Account[];
  categories: Category[];
  contacts: Contact[];
  transactions: Transaction[];
  savingsPlans: SavingsPlan[];
  initialData?: Transaction;
  onSubmit: (data: {
    date: string;
    description: string;
    amount: number;
    type: TransactionType;
    categoryId: string;
    accountId: string;
    toAccountId?: string;
    receiptUrl?: string;
    contactId?: string;
    savingsPlanId?: string;
    dueDate?: string;
    installmentType?: 'weekly' | 'monthly' | 'yearly';
    installmentCount?: number;
  }) => void;
  onAddAccount: (data: {
    name: string;
    type: AccountType;
    provider?: string;
    accountName?: string;
    accountNumber?: string;
  }) => string;
  onAddContact: (name: string) => string;
  onClose: () => void;
  onNavigateToSettings?: () => void;
}

export default function TransactionForm({ accounts, categories, contacts, transactions, savingsPlans, initialData, onSubmit, onAddAccount, onAddContact, onClose, onNavigateToSettings }: TransactionFormProps) {
  const { t, currency: baseCurrency } = useSettings();
  const userName = localStorage.getItem('vinance_user_name') || '';
  const isRegistered = userName.trim() !== '';

  const [type, setType] = useState<TransactionType>(initialData?.type || 'expense');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [amountDisplay, setAmountDisplay] = useState(initialData ? new Intl.NumberFormat('id-ID').format(initialData.amount) : '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || '');
  const [accountId, setAccountId] = useState(initialData?.accountId || accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState(initialData?.toAccountId || '');
  const [receiptUrl, setReceiptUrl] = useState<string | undefined>(initialData?.receiptUrl);
  const [contactId, setContactId] = useState(initialData?.contactId || '');
  const [savingsPlanId, setSavingsPlanId] = useState(initialData?.savingsPlanId || '');
  const [dueDate, setDueDate] = useState(initialData?.dueDate || '');
  const [installmentType, setInstallmentType] = useState<'weekly' | 'monthly' | 'yearly' | undefined>(initialData?.installmentType);
  const [installmentCount, setInstallmentCount] = useState<number | ''>(initialData?.installmentCount || '');
  const [newContactName, setNewContactName] = useState('');
  const [isAddingAccount, setIsAddingAccount] = useState((accounts || []).length === 0);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [vynanceFast, setVynanceFast] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [isRequestingCamera, setIsRequestingCamera] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  // Handle back button when adding account inline
  useEffect(() => {
    if (isAddingAccount && (accounts || []).length > 0) {
      const handlePopState = () => {
        // If we are in "adding account" mode, just close it instead of navigating back
        setIsAddingAccount(false);
      };

      // Push a dummy state so we can intercept the back button
      window.history.pushState({ isAddingAccount: true }, '');
      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('popstate', handlePopState);
        // If we are unmounting or closing adding account manually (not via back button), 
        // and we still have our dummy state, pop it to clean up history
        if (window.history.state?.isAddingAccount) {
          window.history.back();
        }
      };
    }
  }, [isAddingAccount, accounts]);

  useEffect(() => {
    if (!isRegistered) {
      if (onNavigateToSettings) {
        onNavigateToSettings();
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('focus-profile-name'));
        }, 100);
      }
    }
  }, [isRegistered, onNavigateToSettings]);

  const startCamera = async () => {
    setShowCamera(true);
    setIsRequestingCamera(true);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert(t("Gagal mengakses kamera. Pastikan Anda telah memberikan izin di pengaturan browser."));
      setShowCamera(false);
    } finally {
      setIsRequestingCamera(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  useEffect(() => {
    if (showCamera) {
      startCamera();
    }
  }, [facingMode]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setReceiptUrl(dataUrl);
        stopCamera();
      }
    }
  };

  const handleVynanceFastChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setVynanceFast(val);
    
    let workingText = val;

    // 1. Parse Date
    let parsedDate = null;
    const months = ['januari', 'februari', 'maret', 'april', 'mei', 'juni', 'juli', 'agustus', 'september', 'oktober', 'november', 'desember', 'jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'agu', 'sep', 'okt', 'nov', 'des'];
    const monthRegex = months.join('|');
    const monthPattern = `(?:${monthRegex})[a-z]*`;
    
    const dateRegex1 = /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/i;
    const dateRegex2 = new RegExp(`\\b(\\d{1,4})\\s+(${monthPattern})\\s+(\\d{1,4})\\b`, 'i');
    const dateRegex3 = new RegExp(`\\b(${monthPattern})\\s+(\\d{1,2})\\s+(\\d{4})\\b`, 'i');
    const dateRegex4 = new RegExp(`\\b(\\d{4})\\s+(\\d{1,2})\\s+(${monthPattern})\\b`, 'i');
    const dateRegex5 = new RegExp(`\\b(\\d{1,2})\\s+(${monthPattern})\\b`, 'i');
    
    workingText = workingText.replace(/\b(tgl|tanggal)\b/gi, '').trim();

    const getMonthIndex = (mStr: string) => {
      const idx = months.findIndex(m => mStr.toLowerCase().startsWith(m));
      return idx !== -1 ? (idx % 12) + 1 : 1;
    };

    let match = workingText.match(dateRegex1);
    if (match) {
      let [full, d, m, y] = match;
      if (y.length === 2) y = '20' + y;
      parsedDate = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
      workingText = workingText.replace(full, '');
    } else if ((match = workingText.match(dateRegex2))) {
      let [full, p1, mStr, p2] = match;
      let d = p1.length <= 2 ? p1 : p2;
      let y = p1.length === 4 ? p1 : p2;
      let m = getMonthIndex(mStr);
      parsedDate = new Date(`${y}-${m.toString().padStart(2, '0')}-${d.padStart(2, '0')}`);
      workingText = workingText.replace(full, '');
    } else if ((match = workingText.match(dateRegex3))) {
      let [full, mStr, d, y] = match;
      let m = getMonthIndex(mStr);
      parsedDate = new Date(`${y}-${m.toString().padStart(2, '0')}-${d.padStart(2, '0')}`);
      workingText = workingText.replace(full, '');
    } else if ((match = workingText.match(dateRegex4))) {
      let [full, y, d, mStr] = match;
      let m = getMonthIndex(mStr);
      parsedDate = new Date(`${y}-${m.toString().padStart(2, '0')}-${d.padStart(2, '0')}`);
      workingText = workingText.replace(full, '');
    } else if ((match = workingText.match(dateRegex5))) {
      let [full, d, mStr] = match;
      let m = getMonthIndex(mStr);
      let y = new Date().getFullYear();
      parsedDate = new Date(`${y}-${m.toString().padStart(2, '0')}-${d.padStart(2, '0')}`);
      workingText = workingText.replace(full, '');
    }

    if (parsedDate && !isNaN(parsedDate.getTime())) {
      setDate(parsedDate.toISOString().split('T')[0]);
    }

    // 2. Parse Amount
    let maxAmount = 0;
    const amountRegex = /\b(\d+(?:\.\d+)*)\s*(rb|ribu|jt|juta|k|m)?\b/gi;
    let amountMatch;
    let amountStrToRemove = '';
    
    while ((amountMatch = amountRegex.exec(workingText)) !== null) {
      let numStr = amountMatch[1].replace(/\./g, '');
      let num = Number(numStr);
      let multiplier = amountMatch[2]?.toLowerCase();
      if (multiplier === 'rb' || multiplier === 'ribu' || multiplier === 'k') num *= 1000;
      if (multiplier === 'jt' || multiplier === 'juta' || multiplier === 'm') num *= 1000000;
      
      if (num >= 100 || multiplier) {
        if (num > maxAmount) {
          maxAmount = num;
          amountStrToRemove = amountMatch[0];
        }
      }
    }

    if (maxAmount > 0) {
      setAmountDisplay(new Intl.NumberFormat('id-ID').format(maxAmount));
      workingText = workingText.replace(amountStrToRemove, '');
    } else {
      setAmountDisplay('');
    }

    // 3. Parse Account
    let foundAccountId = '';
    const sortedAccounts = [...accounts].sort((a, b) => b.name.length - a.name.length);
    for (const acc of sortedAccounts) {
      const accNameLower = acc.name.toLowerCase();
      const accNameNoSpace = accNameLower.replace(/\s+/g, '');
      const workingNoSpace = workingText.toLowerCase().replace(/\s+/g, '');
      
      if (workingText.toLowerCase().includes(accNameLower)) {
        foundAccountId = acc.id;
        const regex = new RegExp(accNameLower, 'i');
        workingText = workingText.replace(regex, '');
        break;
      } else if (workingNoSpace.includes(accNameNoSpace)) {
        foundAccountId = acc.id;
        let charsToRemove = accNameNoSpace.split('');
        let newWorkingText = '';
        for (let char of workingText) {
          if (char !== ' ' && charsToRemove.length > 0 && char.toLowerCase() === charsToRemove[0]) {
            charsToRemove.shift();
          } else {
            newWorkingText += char;
          }
        }
        workingText = newWorkingText;
        break;
      }
    }
    
    if (foundAccountId) {
      setAccountId(foundAccountId);
    } else {
      setAccountId('');
    }

    // 4. Parse Category & Type
    workingText = workingText.replace(/\s+/g, ' ').trim();
    if (workingText) {
      setDescription(workingText.charAt(0).toUpperCase() + workingText.slice(1));
      
      const lowerText = workingText.toLowerCase();
      if (lowerText.includes('makan') || lowerText.includes('minum') || lowerText.includes('kopi') || lowerText.includes('sarapan')) {
        setType('expense');
        setCategoryId('exp_makan');
      } else if (lowerText.includes('jajan') || lowerText.includes('snack')) {
        setType('expense');
        setCategoryId('exp_jajan');
      } else if (lowerText.includes('belanja') || lowerText.includes('beli')) {
        setType('expense');
        setCategoryId('exp_belanja');
      } else if (lowerText.includes('gaji')) {
        setType('income');
        setCategoryId('inc_gaji');
      } else if (lowerText.includes('utang') || lowerText.includes('hutang')) {
        if (lowerText.includes('bayar')) {
          setType('expense');
          setCategoryId('exp_bayar_utang');
        } else {
          setType('income');
          setCategoryId('inc_terima_pinjaman');
        }
      }
    } else {
      setDescription('');
    }
  };

  // If accounts become available (e.g. after adding one), select it if none selected
  useEffect(() => {
    if ((accounts || []).length > 0 && !accountId) {
      setAccountId(accounts[(accounts || []).length - 1].id);
    }
  }, [accounts, accountId]);

  const filteredCategories = (categories || []).filter((c) => c.type === type);
  const isDebtCategory = ['inc_terima_pinjaman', 'inc_bayar_utang', 'exp_bayar_utang', 'exp_kasih_pinjaman'].includes(categoryId);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value === '') {
      setAmountDisplay('');
      return;
    }
    const formatted = new Intl.NumberFormat('id-ID').format(Number(value));
    setAmountDisplay(formatted);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const numericAmount = Number(amountDisplay.replace(/\./g, ''));
    if (!numericAmount || !description || !accountId) return;
    
    let finalCategoryId = categoryId;
    if (type !== 'transfer') {
      if (isAddingCategory && newCategoryName) {
        finalCategoryId = newCategoryName.trim();
      } else if (!categoryId) {
        alert(t('Mohon pilih kategori'));
        return;
      }
    }
    
    if (type === 'transfer' && (!toAccountId || accountId === toAccountId)) {
      alert(t('Mohon pilih rekening tujuan yang berbeda'));
      return;
    }

    if (type !== 'transfer' && isDebtCategory && !contactId && !newContactName) {
      alert(t('Mohon pilih atau tambah kontak'));
      return;
    }

    let finalContactId = contactId;
    if (type !== 'transfer' && isDebtCategory && isAddingContact && newContactName) {
      finalContactId = onAddContact(newContactName);
    }

    const isSavingsCategory = finalCategoryId === 'inc_tabung' || finalCategoryId === 'exp_ambil_tabungan';
    if (isSavingsCategory && !savingsPlanId) {
      alert(t('Mohon pilih rencana tabungan'));
      return;
    }

    onSubmit({
      type,
      date,
      amount: numericAmount,
      description,
      categoryId: type === 'transfer' ? 'transfer' : finalCategoryId,
      accountId,
      toAccountId: type === 'transfer' ? toAccountId : undefined,
      receiptUrl,
      contactId: type !== 'transfer' && isDebtCategory ? finalContactId : undefined,
      savingsPlanId: isSavingsCategory ? savingsPlanId : undefined,
      dueDate: type !== 'transfer' && isDebtCategory ? dueDate : undefined,
      installmentType: type !== 'transfer' && isDebtCategory ? installmentType : undefined,
      installmentCount: type !== 'transfer' && isDebtCategory && installmentCount !== '' ? Number(installmentCount) : undefined,
    });
  };

  const handleAddAccountSubmit = (data: any) => {
    const newId = onAddAccount(data);
    setAccountId(newId);
    setIsAddingAccount(false);
  };

  if (isAddingAccount) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
      >
        <TambahRekening
          onSubmit={handleAddAccountSubmit}
          onClose={() => {
            if ((accounts || []).length > 0) setIsAddingAccount(false);
            else onClose(); // Close everything if they cancel adding the first account
          }}
        />
      </motion.div>
    );
  }

  const formVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.2 } }
  };

  const accountOptions = (accounts || []).map(a => {
    const bankCode = a.provider ? getBankCode(a.provider) : '';
    const logoUrl = bankCode ? getBankLogoFromCode(bankCode) : undefined;
    
    return {
      value: a.id,
      label: a.name,
      description: formatCurrency(a.balance, baseCurrency),
      icon: logoUrl ? (
        <img src={logoUrl} alt={a.name} className="w-5 h-5 rounded-full object-cover" referrerPolicy="no-referrer" />
      ) : undefined
    };
  });

  return (
    <div className="relative">
      <div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-900 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col w-full transition-colors duration-200"
        >
        <div className="overflow-y-auto p-6 md:p-8">
          <form id="transaction-form" onSubmit={handleSubmit} className="space-y-6">
            <motion.div variants={formVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
              {/* VynanceFast */}
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-4 rounded-2xl border border-blue-500/20">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-2">
                    <span className="text-lg">⚡</span> VynanceFast
                  </label>
                  <button 
                    type="button"
                    onClick={startCamera}
                    className="p-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm flex items-center gap-1.5"
                    title={t('Ambil Foto Struk')}
                  >
                    <Camera size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">{t('Kamera')}</span>
                  </button>
                </div>
                <textarea
                  value={vynanceFast}
                  onChange={handleVynanceFastChange}
                  placeholder={t("Ketik 'makan siang 50000'...")}
                  rows={3}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-500/30 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none"
                />
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                  {t('Otomatis mengisi nominal, keterangan, dan kategori.')}
                </p>
              </div>

              {/* Type Toggle */}
              <div className="flex p-1 md:p-1.5 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl md:rounded-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setType('expense');
                    setCategoryId('');
                  }}
                  className={`relative flex-1 py-2 md:py-2.5 text-xs md:text-sm font-semibold rounded-lg md:rounded-xl transition-colors ${
                    type === 'expense' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {type === 'expense' && (
                    <motion.div layoutId="type-active" className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg md:rounded-xl shadow-sm border border-slate-200/50 dark:border-slate-600/50 -z-10" />
                  )}
                  {t('Pengeluaran')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setType('income');
                    setCategoryId('');
                  }}
                  className={`relative flex-1 py-2 md:py-2.5 text-xs md:text-sm font-semibold rounded-lg md:rounded-xl transition-colors ${
                    type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {type === 'income' && (
                    <motion.div layoutId="type-active" className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg md:rounded-xl shadow-sm border border-slate-200/50 dark:border-slate-600/50 -z-10" />
                  )}
                  {t('Pemasukan')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setType('transfer');
                    setCategoryId('');
                  }}
                  className={`relative flex-1 py-2 md:py-2.5 text-xs md:text-sm font-semibold rounded-lg md:rounded-xl transition-colors ${
                    type === 'transfer' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {type === 'transfer' && (
                    <motion.div layoutId="type-active" className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg md:rounded-xl shadow-sm border border-slate-200/50 dark:border-slate-600/50 -z-10" />
                  )}
                  {t('Mutasi')}
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('Nominal (Rp)')}</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-medium">Rp</span>
                  <input
                    type="text"
                    required
                    value={amountDisplay}
                    onChange={handleAmountChange}
                    placeholder="0"
                    className={`w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold text-lg placeholder:text-slate-300 dark:placeholder:text-slate-600 ${
                      type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : type === 'expense' ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('Keterangan')}</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={type === 'transfer' ? t('Transfer ke tabungan...') : categoryId === 'exp_kasih_pinjaman' ? t('Pinjaman untuk modal...') : t('Makan siang, Gaji bulanan...')}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

              {type !== 'transfer' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('Kategori')}</label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      {isAddingCategory ? (
                        <input
                          type="text"
                          required
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          placeholder={t("Nama Kategori Baru")}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        />
                      ) : (
                        <Combobox
                          options={filteredCategories.map(c => ({ value: c.id, label: c.name }))}
                          value={categoryId}
                          onChange={setCategoryId}
                          placeholder={t("Pilih Kategori")}
                        />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (isAddingCategory) {
                          setIsAddingCategory(false);
                          setNewCategoryName('');
                        } else {
                          setIsAddingCategory(true);
                          setCategoryId('');
                        }
                      }}
                      className="w-12 h-12 flex-shrink-0 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-xl flex items-center justify-center transition-colors"
                      title={isAddingCategory ? t("Batal Tambah") : t("Tambah Kategori Baru")}
                    >
                      {isAddingCategory ? <X size={20} /> : <Plus size={20} />}
                    </button>
                  </div>
                  {categoryId && !filteredCategories.find(c => c.id === categoryId) && categoryId !== 'new_category' && !isAddingCategory && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 font-medium">
                      {t('Kategori kustom:')} {categoryId}
                    </p>
                  )}
                </motion.div>
              )}

              {type !== 'transfer' && (categoryId === 'inc_tabung' || categoryId === 'exp_ambil_tabungan') && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('Rencana Tabungan')}</label>
                  <Combobox
                    options={savingsPlans.filter(p => p.accountId === accountId).map(p => ({ value: p.id, label: p.name }))}
                    value={savingsPlanId}
                    onChange={setSavingsPlanId}
                    placeholder={t("Pilih Rencana Tabungan")}
                  />
                  {savingsPlans.filter(p => p.accountId === accountId).length === 0 && (
                    <p className="text-xs text-rose-500 mt-2">
                      {t('Belum ada rencana tabungan untuk rekening ini.')}
                    </p>
                  )}
                </motion.div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('Tanggal')}</label>
                <DatePicker value={date} onChange={setDate} />
              </div>

              {type !== 'transfer' && isDebtCategory && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      {t('Orang Tertuju (Kontak)')}
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        {isAddingContact ? (
                          <input
                            type="text"
                            required
                            value={newContactName}
                            onChange={(e) => setNewContactName(e.target.value)}
                            placeholder={t("Nama Kontak Baru")}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                          />
                        ) : (
                          <Combobox
                            options={contacts.map(c => ({ value: c.id, label: c.name }))}
                            value={contactId}
                            onChange={setContactId}
                            placeholder={t("Pilih Kontak")}
                          />
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (isAddingContact) {
                            setIsAddingContact(false);
                            setNewContactName('');
                          } else {
                            setIsAddingContact(true);
                            setContactId('');
                          }
                        }}
                        className="w-12 h-12 flex-shrink-0 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-xl flex items-center justify-center transition-colors"
                        title={isAddingContact ? t("Batal Tambah") : t("Tambah Kontak Baru")}
                      >
                        {isAddingContact ? <X size={20} /> : <Plus size={20} />}
                      </button>
                    </div>
                  </div>

                  {(categoryId === 'exp_kasih_pinjaman' || categoryId === 'inc_terima_pinjaman') && (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          {t('Tanggal Rencana Bayar (Opsional)')}
                        </label>
                        <DatePicker value={dueDate} onChange={setDueDate} />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          {t('Tempo Cicilan (Opsional)')}
                        </label>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <select
                              value={installmentType || ''}
                              onChange={(e) => setInstallmentType(e.target.value as any || undefined)}
                              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-900 dark:text-slate-100"
                            >
                              <option value="">{t('Tidak ada cicilan')}</option>
                              <option value="weekly">{t('Per Minggu')}</option>
                              <option value="monthly">{t('Per Bulan')}</option>
                              <option value="yearly">{t('Per Tahun')}</option>
                            </select>
                          </div>
                          {installmentType && (
                            <div className="w-24">
                              <input
                                type="number"
                                min="1"
                                value={installmentCount}
                                onChange={(e) => setInstallmentCount(e.target.value ? Number(e.target.value) : '')}
                                placeholder={t("Kali")}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {type === 'transfer' ? t('Rekening Asal') : t('Rekening')}
                </label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Combobox
                      options={accountOptions}
                      value={accountId}
                      onChange={setAccountId}
                      placeholder={(accounts || []).length === 0 ? t("Belum ada rekening") : t("Pilih Rekening")}
                      disabled={(accounts || []).length === 0}
                    />
                  </div>
                  {type !== 'transfer' && (
                    <button
                      type="button"
                      onClick={() => setIsAddingAccount(true)}
                      className="w-12 h-12 flex-shrink-0 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-xl flex items-center justify-center transition-colors"
                      title={t("Tambah Rekening Baru")}
                    >
                      <Plus size={20} />
                    </button>
                  )}
                </div>
              </div>

              {type === 'transfer' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('Rekening Tujuan')}</label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Combobox
                        options={accountOptions}
                        value={toAccountId}
                        onChange={setToAccountId}
                        placeholder={t("Pilih Rekening Tujuan")}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAddingAccount(true)}
                      className="w-12 h-12 flex-shrink-0 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-xl flex items-center justify-center transition-colors"
                      title={t("Tambah Rekening Baru")}
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Receipt Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('Bukti Transaksi (Opsional)')}</label>
                <div className="mt-1 flex flex-col items-center justify-center px-6 pt-5 pb-6 border-2 border-slate-200 dark:border-slate-700 border-dashed rounded-2xl hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-500/5 transition-colors bg-slate-50 dark:bg-slate-800/30">
                  {receiptUrl ? (
                    <div className="relative inline-block">
                      {receiptUrl.startsWith('data:application/pdf') ? (
                        <div className="flex flex-col items-center p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                          <FileText size={48} className="text-blue-500 dark:text-blue-400 mb-3" />
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('Dokumen PDF')}</span>
                        </div>
                      ) : (
                        <img src={receiptUrl} alt={t("Receipt preview")} className="max-h-40 rounded-xl mx-auto shadow-sm border border-slate-100 dark:border-slate-700" />
                      )}
                      <button
                        type="button"
                        onClick={() => setReceiptUrl(undefined)}
                        className="absolute -top-3 -right-3 bg-white dark:bg-slate-800 text-rose-500 dark:text-rose-400 rounded-full p-1.5 shadow-md hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-300 transition-colors border border-slate-100 dark:border-slate-700"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-5 w-full">
                      <div className="flex justify-center gap-4">
                        <button type="button" onClick={startCamera} className="flex flex-col items-center justify-center w-24 h-24 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-300 dark:hover:border-blue-500/50 hover:text-blue-600 dark:hover:text-blue-400 transition-all group shadow-sm dark:shadow-none">
                          <Camera className="text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 mb-2 transition-colors" size={28} />
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400">{t('Kamera')}</span>
                        </button>
                        
                        <label className="flex flex-col items-center justify-center w-24 h-24 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-300 dark:hover:border-blue-500/50 hover:text-blue-600 dark:hover:text-blue-400 transition-all group shadow-sm dark:shadow-none">
                          <ImageIcon className="text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 mb-2 transition-colors" size={28} />
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400">{t('Galeri')}</span>
                          <input type="file" accept="image/*" className="sr-only" onChange={handleFileChange} />
                        </label>

                        <label className="flex flex-col items-center justify-center w-24 h-24 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-300 dark:hover:border-blue-500/50 hover:text-blue-600 dark:hover:text-blue-400 transition-all group shadow-sm dark:shadow-none">
                          <FileText className="text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 mb-2 transition-colors" size={28} />
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400">{t('Dokumen')}</span>
                          <input type="file" accept=".pdf,.doc,.docx" className="sr-only" onChange={handleFileChange} />
                        </label>
                      </div>
                      <p className="text-xs text-center text-slate-500 dark:text-slate-400 font-medium">{t('Maksimal 5MB (JPG, PNG, PDF). Foto disimpan aman secara lokal.')}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </form>
        </div>
        
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 shrink-0 flex gap-3 bg-slate-50/50 dark:bg-slate-800/30 transition-colors duration-200">
          <motion.button
            whileHover={{ scale: (accounts || []).length > 0 ? 1.02 : 1 }}
            whileTap={{ scale: (accounts || []).length > 0 ? 0.98 : 1 }}
            type="submit"
            form="transaction-form"
            disabled={(accounts || []).length === 0}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium py-3.5 rounded-xl transition-colors shadow-[0_4px_12px_rgba(37,99,235,0.2)] dark:shadow-none disabled:shadow-none"
          >
            {(accounts || []).length === 0 ? t('Tambah Rekening Dahulu') : t('Simpan Transaksi')}
          </motion.button>
        </div>
      </motion.div>
      </div>

      {/* Camera Modal */}
      <AnimatePresence>
        {showCamera && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col"
          >
            <div className="flex justify-between items-center p-4 bg-black/50 text-white absolute top-0 left-0 right-0 z-10">
              <button type="button" onClick={stopCamera} className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
                <X size={24} />
              </button>
              <button type="button" onClick={toggleCamera} className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
                <SwitchCamera size={24} />
              </button>
            </div>
            <div className="flex-1 relative flex items-center justify-center bg-black">
              {isRequestingCamera && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/90 text-white p-6 text-center">
                  <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                  <p className="font-bold text-lg mb-2">{t('Meminta Izin Kamera')}</p>
                  <p className="text-sm text-slate-300 mb-4">{t('Pilih "Allow" atau "Izinkan" pada popup browser Anda.')}</p>
                  <p className="text-xs text-slate-500 bg-slate-900/50 p-3 rounded-lg border border-slate-800">{t('Privasi Terjamin: Foto tidak diunggah ke server mana pun dan hanya disimpan di perangkat Anda (Lokal).')}</p>
                </div>
              )}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <div className="p-6 bg-black/50 absolute bottom-0 left-0 right-0 flex justify-center z-10">
              <button
                type="button"
                onClick={capturePhoto}
                className="w-16 h-16 rounded-full bg-white border-4 border-slate-300 flex items-center justify-center hover:bg-slate-200 transition-colors"
              >
                <div className="w-12 h-12 rounded-full border-2 border-slate-800" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
