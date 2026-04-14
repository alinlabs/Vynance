import React, { useState, useEffect } from 'react';
import { Globe, Palette, Coins, Save, User, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import Combobox, { ComboboxRef } from '../components/Combobox';
import { useSettings } from '../contexts/SettingsContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { LANGUAGE_OPTIONS, CURRENCY_OPTIONS } from '../constants';

const COUNTRY_CODES = [
  { value: '+62', label: '+62', shortLabel: '+62', description: '(Indonesia)', icon: <img src="https://flagcdn.com/w40/id.png" alt="ID" className="w-5 h-5 rounded-sm object-cover" /> },
  { value: '+1', label: '+1', shortLabel: '+1', description: '(US/Canada)', icon: <img src="https://flagcdn.com/w40/us.png" alt="US" className="w-5 h-5 rounded-sm object-cover" /> },
  { value: '+44', label: '+44', shortLabel: '+44', description: '(UK)', icon: <img src="https://flagcdn.com/w40/gb.png" alt="UK" className="w-5 h-5 rounded-sm object-cover" /> },
  { value: '+81', label: '+81', shortLabel: '+81', description: '(Japan)', icon: <img src="https://flagcdn.com/w40/jp.png" alt="JP" className="w-5 h-5 rounded-sm object-cover" /> },
  { value: '+82', label: '+82', shortLabel: '+82', description: '(South Korea)', icon: <img src="https://flagcdn.com/w40/kr.png" alt="KR" className="w-5 h-5 rounded-sm object-cover" /> },
  { value: '+86', label: '+86', shortLabel: '+86', description: '(China)', icon: <img src="https://flagcdn.com/w40/cn.png" alt="CN" className="w-5 h-5 rounded-sm object-cover" /> },
  { value: '+60', label: '+60', shortLabel: '+60', description: '(Malaysia)', icon: <img src="https://flagcdn.com/w40/my.png" alt="MY" className="w-5 h-5 rounded-sm object-cover" /> },
  { value: '+65', label: '+65', shortLabel: '+65', description: '(Singapore)', icon: <img src="https://flagcdn.com/w40/sg.png" alt="SG" className="w-5 h-5 rounded-sm object-cover" /> },
  { value: '+61', label: '+61', shortLabel: '+61', description: '(Australia)', icon: <img src="https://flagcdn.com/w40/au.png" alt="AU" className="w-5 h-5 rounded-sm object-cover" /> },
];

const PROFESSION_OPTIONS = [
  { value: 'mahasiswa', label: 'Mahasiswa' },
  { value: 'karyawan', label: 'Karyawan Swasta' },
  { value: 'pns', label: 'PNS' },
  { value: 'wirausaha', label: 'Wirausaha' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'lainnya', label: 'Lainnya' },
];

const EMAIL_DOMAINS = ['@gmail.com', '@yahoo.com', '@outlook.com', '@icloud.com'];

interface SettingsProps {
  onResetAllData?: () => void;
}

export default function Settings({ onResetAllData }: SettingsProps) {
  const { 
    theme, setTheme,
    language, setLanguage, 
    currency, setCurrency, 
    numberFormatMode, setNumberFormatMode,
    numberFormatDecimals, setNumberFormatDecimals,
    numberFormatSystem, setNumberFormatSystem,
    t 
  } = useSettings();

  const [initialCurrency, setInitialCurrency] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  const handleConvertCurrency = async () => {
    if (!initialCurrency || initialCurrency === currency) return;
    setIsConverting(true);
    try {
      const res = await fetch(`https://open.er-api.com/v6/latest/${initialCurrency}`);
      const data = await res.json();
      if (data && data.rates && data.rates[currency]) {
        const rate = data.rates[currency];
        
        // Update transactions
        const txsStr = localStorage.getItem('vinance_transactions');
        if (txsStr) {
          const txs = JSON.parse(txsStr);
          const newTxs = txs.map((t: any) => ({ ...t, amount: t.amount * rate }));
          localStorage.setItem('vinance_transactions', JSON.stringify(newTxs));
        }

        // Update accounts
        const accsStr = localStorage.getItem('vinance_accounts');
        if (accsStr) {
          const accs = JSON.parse(accsStr);
          const newAccs = accs.map((a: any) => ({ ...a, balance: a.balance * rate }));
          localStorage.setItem('vinance_accounts', JSON.stringify(newAccs));
        }

        // Update savings plans
        const plansStr = localStorage.getItem('vinance_savings_plans');
        if (plansStr) {
          const plans = JSON.parse(plansStr);
          const newPlans = plans.map((p: any) => ({ 
            ...p, 
            targetAmount: p.targetAmount * rate,
            currentAmount: p.currentAmount * rate
          }));
          localStorage.setItem('vinance_savings_plans', JSON.stringify(newPlans));
        }

        setInitialCurrency(null);
        window.location.reload();
      }
    } catch (e) {
      console.error("Failed to convert currency", e);
    } finally {
      setIsConverting(false);
    }
  };
  
  // User Info State from localStorage
  const [countryCode, setCountryCode] = useState(() => localStorage.getItem('vinance_user_country_code') || '+62');
  const [phoneNumber, setPhoneNumber] = useState(() => localStorage.getItem('vinance_user_phone') || '');
  const [profession, setProfession] = useState(() => localStorage.getItem('vinance_user_profession') || 'karyawan');
  const [email, setEmail] = useState(() => {
    const fullEmail = localStorage.getItem('vinance_user_email') || '';
    if (fullEmail && fullEmail.includes('@')) {
      return fullEmail.split('@')[0];
    }
    return fullEmail;
  });
  const [emailDomain, setEmailDomain] = useState(() => {
    const fullEmail = localStorage.getItem('vinance_user_email') || '';
    if (fullEmail && fullEmail.includes('@')) {
      return '@' + fullEmail.split('@')[1];
    }
    return '@gmail.com';
  });
  const [name, setName] = useState(() => localStorage.getItem('vinance_user_name') || '');

  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'tampilan' | 'pengguna'>(() => {
    if (location.pathname.includes('/pengaturan/pengguna')) return 'pengguna';
    return 'tampilan';
  });

  useEffect(() => {
    if (location.pathname.includes('/pengaturan/pengguna')) {
      setActiveTab('pengguna');
    } else if (location.pathname.includes('/pengaturan/tampilan')) {
      setActiveTab('tampilan');
    } else {
      setActiveTab('tampilan');
    }
  }, [location.pathname]);

  const handleTabChange = (tab: 'tampilan' | 'pengguna') => {
    setActiveTab(tab);
    navigate(`/pengaturan/${tab}`, { replace: true });
  };

  const [resetInput, setResetInput] = useState('');
  const nameInputRef = React.useRef<HTMLInputElement>(null);
  const emailDomainRef = React.useRef<ComboboxRef>(null);

  // Auto-save user info
  React.useEffect(() => {
    localStorage.setItem('vinance_user_name', name);
    localStorage.setItem('vinance_user_email', `${email}${emailDomain}`);
    localStorage.setItem('vinance_user_phone', phoneNumber);
    localStorage.setItem('vinance_user_country_code', countryCode);
    localStorage.setItem('vinance_user_profession', profession);
  }, [name, email, emailDomain, phoneNumber, countryCode, profession]);

  // Listen for custom focus event
  React.useEffect(() => {
    const handleFocusName = () => {
      handleTabChange('pengguna');
      setTimeout(() => {
        if (nameInputRef.current) {
          nameInputRef.current.focus();
        }
      }, 100);
    };

    window.addEventListener('focus-profile-name', handleFocusName);
    return () => window.removeEventListener('focus-profile-name', handleFocusName);
  }, []);

  const [phoneError, setPhoneError] = useState('');

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    let formattedValue = '';
    for (let i = 0; i < rawValue.length; i++) {
      if (i > 0 && i % 4 === 0 && i < 12) {
        formattedValue += '-';
      }
      formattedValue += rawValue[i];
    }
    if (rawValue.length > 3) {
        formattedValue = rawValue.slice(0, 3) + '-' + rawValue.slice(3);
    }
    if (rawValue.length > 7) {
        formattedValue = rawValue.slice(0, 3) + '-' + rawValue.slice(3, 7) + '-' + rawValue.slice(7);
    }
    setPhoneNumber(formattedValue);

    // Validation
    if (rawValue.length > 0 && rawValue.length < 10) {
      setPhoneError(t('Minimal 10 digit'));
    } else if (/(.)\1{4}/.test(rawValue)) {
      setPhoneError(t('Angka berulang tidak valid'));
    } else {
      let isSequential = false;
      for (let i = 0; i <= rawValue.length - 5; i++) {
        const seq = rawValue.substring(i, i + 5);
        if ('0123456789'.includes(seq) || '9876543210'.includes(seq)) {
          isSequential = true;
          break;
        }
      }
      if (isSequential) {
        setPhoneError(t('Angka berurutan tidak valid'));
      } else {
        setPhoneError('');
      }
    }
  };

  return (
    <div className="w-full space-y-6 pb-24 md:pb-8">
      {/* Mobile Tabs */}
      <div className="md:hidden flex p-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl mb-4">
        <button
          onClick={() => handleTabChange('tampilan')}
          className={`relative flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
            activeTab === 'tampilan' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          {activeTab === 'tampilan' && (
            <motion.div layoutId="settings-tab" className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-sm border border-slate-200/50 dark:border-slate-600/50 -z-10" />
          )}
          {t('Tampilan')}
        </button>
        <button
          onClick={() => handleTabChange('pengguna')}
          className={`relative flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
            activeTab === 'pengguna' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          {activeTab === 'pengguna' && (
            <motion.div layoutId="settings-tab" className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-sm border border-slate-200/50 dark:border-slate-600/50 -z-10" />
          )}
          {t('Pengguna')}
        </button>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors duration-200"
      >
        <div className="p-4 md:p-8 space-y-6 md:space-y-8">
          
          {/* User Info */}
          <div className={`${activeTab === 'tampilan' ? 'hidden md:block' : 'block'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
                <User size={20} />
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">{t('Informasi Pengguna')}</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('Nama Lengkap')}</label>
                <input 
                  ref={nameInputRef}
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500" 
                  placeholder={t('Masukkan nama Anda')} 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('Nomor Telepon')}</label>
                  <div className="flex gap-2">
                    <div className="w-[110px] md:w-[140px] shrink-0">
                      <Combobox
                        className="px-3 md:px-4 py-3 rounded-xl"
                        options={COUNTRY_CODES}
                        value={countryCode}
                        onChange={setCountryCode}
                        placeholder={t('Kode')}
                      />
                    </div>
                    <input 
                      type="tel" 
                      className={`flex-1 min-w-0 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border ${phoneError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20'} rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:ring-2 outline-none transition-all text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500`} 
                      placeholder="XXX-XXXX-XXXX" 
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                    />
                  </div>
                  {phoneError && <p className="text-red-500 text-xs mt-1.5">{phoneError}</p>}
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('Email')}</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      className="flex-1 min-w-0 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500" 
                      placeholder={t('Masukkan email Anda')} 
                      value={email} 
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.includes('@')) {
                          const [namePart, domainPart] = val.split('@');
                          setEmail(namePart);
                          const fullDomain = '@' + domainPart;
                          if (EMAIL_DOMAINS.includes(fullDomain)) {
                            setEmailDomain(fullDomain);
                          } else if (domainPart === '') {
                            emailDomainRef.current?.open();
                          }
                        } else {
                          setEmail(val);
                        }
                      }} 
                    />
                    <div className="w-[130px] md:w-[140px] shrink-0">
                      <Combobox
                        ref={emailDomainRef}
                        className="px-3 md:px-4 py-3 rounded-xl"
                        options={EMAIL_DOMAINS.map(domain => ({ value: domain, label: domain }))}
                        value={emailDomain}
                        onChange={setEmailDomain}
                        placeholder={t('Domain')}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('Status/Profesi')}</label>
                <Combobox
                  options={PROFESSION_OPTIONS}
                  value={profession}
                  onChange={setProfession}
                  placeholder={t('Pilih Status/Profesi')}
                />
              </div>
            </div>
          </div>

          {/* Theme */}
          <div className={`${activeTab === 'pengguna' ? 'hidden md:block' : 'block'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg">
                <Palette size={20} />
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">{t('Tema')}</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setTheme('light')}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${theme === 'light' ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-700'}`}
              >
                <span className={`block font-semibold ${theme === 'light' ? 'text-blue-700 dark:text-blue-400' : 'text-slate-900 dark:text-slate-100'}`}>{t('Terang')}</span>
                <span className="text-sm text-slate-500 dark:text-slate-400 mt-1 block">{t('Tampilan default')}</span>
              </button>
              <button 
                onClick={() => setTheme('dark')}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${theme === 'dark' ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-700'}`}
              >
                <span className={`block font-semibold ${theme === 'dark' ? 'text-blue-700 dark:text-blue-400' : 'text-slate-900 dark:text-slate-100'}`}>{t('Gelap')}</span>
                <span className="text-sm text-slate-500 dark:text-slate-400 mt-1 block">{t('Nyaman di mata')}</span>
              </button>
            </div>
          </div>

          {/* Language & Currency */}
          <div className={`${activeTab === 'pengguna' ? 'hidden md:block' : 'block'}`}>
            <div className="flex flex-col md:flex-row gap-6 md:gap-8">
              {/* Language */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
                    <Globe size={20} />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">{t('Bahasa')}</h3>
                </div>
                <Combobox
                  options={LANGUAGE_OPTIONS}
                  value={language}
                  onChange={setLanguage}
                  placeholder={t('Pilih Bahasa')}
                />
              </div>

              {/* Currency */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
                    <Coins size={20} />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">{t('Mata Uang')}</h3>
                </div>
                <Combobox
                  options={CURRENCY_OPTIONS}
                  value={currency}
                  onChange={(val) => {
                    if (val && val !== currency) {
                      if (!initialCurrency) setInitialCurrency(currency);
                      setCurrency(val);
                    }
                  }}
                  placeholder={t('Pilih Mata Uang')}
                />
                {initialCurrency && initialCurrency !== currency && (
                  <button
                    onClick={handleConvertCurrency}
                    disabled={isConverting}
                    className="mt-3 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
                  >
                    {isConverting ? t('Mengonversi...') : `${t('Aktifkan Kurs')} (${initialCurrency} -> ${currency})`}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Number Format */}
          <div className={`${activeTab === 'pengguna' ? 'hidden md:block' : 'block'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
                <div className="font-bold text-sm">1k</div>
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">{t('Format Angka')}</h3>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">{t('Mode Format')}</label>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <button 
                    onClick={() => setNumberFormatMode('separator')}
                    className={`p-3 md:p-4 rounded-2xl border-2 text-left transition-all ${numberFormatMode === 'separator' ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-700'}`}
                  >
                    <span className={`block font-semibold text-sm md:text-base ${numberFormatMode === 'separator' ? 'text-blue-700 dark:text-blue-400' : 'text-slate-900 dark:text-slate-100'}`}>{t('Titik Pemisah')}</span>
                    <span className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 block">1.000.000</span>
                  </button>
                  <button 
                    onClick={() => setNumberFormatMode('compact')}
                    className={`p-3 md:p-4 rounded-2xl border-2 text-left transition-all ${numberFormatMode === 'compact' ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-700'}`}
                  >
                    <span className={`block font-semibold text-sm md:text-base ${numberFormatMode === 'compact' ? 'text-blue-700 dark:text-blue-400' : 'text-slate-900 dark:text-slate-100'}`}>{t('Di Persingkat')}</span>
                    <span className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 block">1jt / 1M</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">{t('Jumlah Desimal')}</label>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  {[1, 2].map((dec) => (
                    <button 
                      key={dec}
                      onClick={() => setNumberFormatDecimals(numberFormatDecimals === dec ? 0 : dec)}
                      className={`p-3 rounded-2xl border-2 text-center transition-all ${numberFormatDecimals === dec ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-700'}`}
                    >
                      <span className={`block font-semibold text-sm md:text-base ${numberFormatDecimals === dec ? 'text-blue-700 dark:text-blue-400' : 'text-slate-900 dark:text-slate-100'}`}>{dec} {t('Digit')}</span>
                    </button>
                  ))}
                </div>
              </div>

              {numberFormatMode === 'compact' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">{t('Sistem Satuan')}</label>
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <button 
                      onClick={() => setNumberFormatSystem('id')}
                      className={`p-3 md:p-4 rounded-2xl border-2 text-left transition-all ${numberFormatSystem === 'id' ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-700'}`}
                    >
                      <span className={`block font-semibold text-sm md:text-base ${numberFormatSystem === 'id' ? 'text-blue-700 dark:text-blue-400' : 'text-slate-900 dark:text-slate-100'}`}>{t('Indonesia')}</span>
                      <span className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 block">rb, jt, M, T</span>
                    </button>
                    <button 
                      onClick={() => setNumberFormatSystem('intl')}
                      className={`p-3 md:p-4 rounded-2xl border-2 text-left transition-all ${numberFormatSystem === 'intl' ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-700'}`}
                    >
                      <span className={`block font-semibold text-sm md:text-base ${numberFormatSystem === 'intl' ? 'text-blue-700 dark:text-blue-400' : 'text-slate-900 dark:text-slate-100'}`}>{t('Internasional')}</span>
                      <span className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 block">k, M, B</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 mt-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg">
                <AlertTriangle size={20} />
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">{t('Zona Berbahaya')}</h3>
            </div>
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl p-4 md:p-6">
              <h4 className="text-red-800 dark:text-red-400 font-semibold mb-2">{t('Reset Semua Data')}</h4>
              <p className="text-red-600 dark:text-red-400/80 text-sm mb-4">
                {t('Tindakan ini akan menghapus seluruh data transaksi, rekening, kontak, dan pengaturan Anda. Aplikasi akan kembali ke keadaan awal seperti baru diinstal. Tindakan ini tidak dapat dibatalkan.')}
              </p>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-red-800 dark:text-red-400">
                  {t('Ketik "reset" untuk mengonfirmasi:')}
                </label>
                <div className="flex flex-col md:flex-row gap-3">
                  <input
                    type="text"
                    value={resetInput}
                    onChange={(e) => setResetInput(e.target.value)}
                    placeholder="reset"
                    className="px-4 py-3 bg-white dark:bg-slate-900 border border-red-200 dark:border-red-500/30 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all text-slate-900 dark:text-slate-100 w-full md:w-64"
                  />
                  <button
                    onClick={() => {
                      if (resetInput.toLowerCase() === 'reset' && onResetAllData) {
                        onResetAllData();
                      }
                    }}
                    disabled={resetInput.toLowerCase() !== 'reset'}
                    className={`px-6 py-3 rounded-xl font-medium transition-colors w-full md:w-auto ${
                      resetInput.toLowerCase() === 'reset' 
                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                        : 'bg-red-200 dark:bg-red-500/20 text-red-400 dark:text-red-400/50 cursor-not-allowed'
                    }`}
                  >
                    {t('Reset Semua Data')}
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
