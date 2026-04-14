import React, { useState, useEffect } from 'react';
import { AccountType, Account } from '../types';
import { Building2, Wallet, Coins, Check, ArrowLeft, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSettings } from '../contexts/SettingsContext';

interface TambahRekeningProps {
  initialData?: Account;
  onSubmit: (data: {
    name: string;
    type: AccountType;
    provider?: string;
    accountName?: string;
    accountNumber?: string;
  }) => void;
  onClose: () => void;
  onNavigateToSettings?: () => void;
}

const BANK_PROVIDERS = [
  { id: 'Allo Bank', name: 'Allo Bank', logo: 'https://play-lh.googleusercontent.com/0gw4GVJoKuQCDIz8DOXt5fQDEy-RD0BDnQge-BsbnBaBTmXWgqjydABvetmCqTXE1Gm2=w48-h48-rw' },
  { id: 'SeaBank', name: 'SeaBank', logo: 'https://play-lh.googleusercontent.com/ZGLrjk0PKIj2L4DaWiKmhAf0f6cBXml6eHgjRpJhQ4XQpGvw4T5d4hjl_EQF5jY9Vked=s48-rw' },
  { id: 'Bank Jago', name: 'Bank Jago', logo: 'https://www.jago.com/favicon/og-image.png' },
  { id: 'Bank Neo', name: 'Bank Neo', logo: 'https://play-lh.googleusercontent.com/29-fa8r-aNxlmlyijeoxWbA41ak5wwB5sX8R1o50pIYEwjSDQb-d6GrApVeyJn3ddw=s48-rw' },
  { id: 'Bank Central Asia', name: 'Bank Central Asia', logo: 'https://i.pinimg.com/736x/29/61/0b/29610b7dbf7e4ea5070626923a12cba8.jpg' },
  { id: 'Bank Mandiri', name: 'Bank Mandiri', logo: 'https://ui-avatars.com/api/?name=BM&background=1e3a8a&color=fff' },
  { id: 'Bank Negara Indonesia', name: 'Bank Negara Indonesia', logo: 'https://i0.wp.com/amanahfurniture.com/wp-content/uploads/2022/10/logo-bni-46.png' },
  { id: 'Bank Rakyat Indonesia', name: 'Bank Rakyat Indonesia', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Logo_Bank_Rakyat_Indonesia.svg/250px-Logo_Bank_Rakyat_Indonesia.svg.png' },
  { id: 'Bank Tabungan Negara', name: 'Bank Tabungan Negara', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/BTN_2024.svg/250px-BTN_2024.svg.png' },
];

const EWALLET_PROVIDERS = [
  { id: 'DANA', name: 'DANA', logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTRhvs9h_tTVvV-4g-BE7r4ALtNl5wvkuNwAg&s' },
  { id: 'OVO', name: 'OVO', logo: 'https://iconlogovector.com/uploads/images/2024/03/lg-65e38949ad9b9-OVO.webp' },
  { id: 'GoPay', name: 'GoPay', logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTU1_u4kBagPaDWERIyFFmDI8VxkzZEd4YFWQ&s' },
  { id: 'ShopeePay', name: 'ShopeePay', logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTnQ54gdjaHKfhtVWT3C1n-gLZljKqucGLOeg&s' },
];

export default function TambahRekening({ initialData, onSubmit, onClose, onNavigateToSettings }: TambahRekeningProps) {
  const { t } = useSettings();
  const userName = localStorage.getItem('vinance_user_name') || '';
  const isRegistered = userName.trim() !== '';

  const [name, setName] = useState(initialData?.name || '');
  const [type, setType] = useState<AccountType | ''>(initialData?.type || '');
  const [provider, setProvider] = useState(initialData?.provider || '');
  const [accountName, setAccountName] = useState(initialData?.accountName || '');
  const [accountNumber, setAccountNumber] = useState(initialData?.accountNumber || '');
  
  const providers = type === 'bank' ? BANK_PROVIDERS : type === 'ewallet' ? EWALLET_PROVIDERS : [];

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

  useEffect(() => {
    if (!initialData) {
      setProvider('');
    }
  }, [type, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!type) {
      alert(t('Silakan pilih jenis rekening'));
      return;
    }
    if (type !== 'cash' && !provider) {
      alert(t('Silakan pilih penyedia (Bank/E-Wallet)'));
      return;
    }
    onSubmit({
      name,
      type,
      ...(type !== 'cash' && { provider, accountName, accountNumber }),
    });
  };

  const isFormValid = () => {
    if (!type) return false;
    if (type === 'cash') return name.trim().length > 0;
    return name.trim().length > 0 && provider !== '' && accountName.trim().length > 0 && accountNumber.trim().length > 0;
  };

  return (
    <div className="w-full relative">
      <div className={`bg-white dark:bg-slate-900 rounded-3xl shadow-sm dark:shadow-none border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors duration-200`}>
        <div className="p-6 md:p-8">
          <form id="account-form" onSubmit={handleSubmit} className="space-y-8">
            {/* Type Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">{t('Jenis Rekening')}</label>
              <div className="grid grid-cols-3 gap-3 md:gap-4">
                <button
                  type="button"
                  onClick={() => setType('bank')}
                  className={`relative flex flex-col items-center justify-center p-4 md:p-6 rounded-2xl border-2 transition-all ${
                    type === 'bank' ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:border-slate-200 dark:hover:border-slate-700'
                  }`}
                >
                  <Building2 size={28} className="mb-3" />
                  <span className="text-sm font-semibold">{t('Bank')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setType('ewallet')}
                  className={`relative flex flex-col items-center justify-center p-4 md:p-6 rounded-2xl border-2 transition-all ${
                    type === 'ewallet' ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:border-slate-200 dark:hover:border-slate-700'
                  }`}
                >
                  <Wallet size={28} className="mb-3" />
                  <span className="text-sm font-semibold">{t('E-Wallet')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setType('cash')}
                  className={`relative flex flex-col items-center justify-center p-4 md:p-6 rounded-2xl border-2 transition-all ${
                    type === 'cash' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:border-slate-200 dark:hover:border-slate-700'
                  }`}
                >
                  <img src="/image/logo-coin.png" alt="Tunai" className="w-7 h-7 object-contain mb-3" />
                  <span className="text-sm font-semibold">{t('Tunai')}</span>
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {type !== 'cash' && type !== '' && (
                <motion.div 
                  key="provider"
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    {type === 'bank' ? t('Pilih Bank') : t('Pilih E-Wallet')}
                  </label>
                  <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 md:gap-4">
                    {providers.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setProvider(p.id)}
                        className={`relative flex items-center justify-center p-3 rounded-2xl border-2 transition-all aspect-square ${
                          provider === p.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10'
                            : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-700'
                        }`}
                        title={p.name}
                      >
                        <img src={p.logo} alt={p.name} className="w-12 h-12 object-contain bg-white rounded-lg" referrerPolicy="no-referrer" />
                        {provider === p.id && (
                          <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-2 -right-2 bg-blue-500 rounded-full p-1 shadow-sm border-2 border-white dark:border-slate-900"
                          >
                            <Check size={12} className="text-white" />
                          </motion.div>
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {type !== '' && (
                <motion.div 
                  key="details"
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('Nama Penyimpanan (Alias)')}</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={type === 'bank' ? t('Misal: Tabungan BCA') : type === 'ewallet' ? t('Misal: GoPay Pribadi') : t('Misal: Dompet Utama')}
                      className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                  </div>

                  {type !== 'cash' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('Atas Nama')}</label>
                        <input
                          type="text"
                          required
                          value={accountName}
                          onChange={(e) => setAccountName(e.target.value)}
                          placeholder={t("Sesuai KTP/Identitas")}
                          className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          {type === 'bank' ? t('Nomor Rekening') : t('Nomor Telepon')}
                        </label>
                        <input
                          type="text"
                          required
                          value={accountNumber}
                          onChange={(e) => {
                            const rawValue = e.target.value.replace(/[^0-9]/g, '');
                            const formattedValue = rawValue.replace(/(\d{4})(?=\d)/g, '$1-');
                            setAccountNumber(formattedValue);
                          }}
                          placeholder={type === 'bank' ? '1234-5678-90' : '0812-3456-7890'}
                          className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>
        
        <div className="p-6 md:p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-end gap-4 transition-colors duration-200">
          <AnimatePresence>
            {isFormValid() && (
              <motion.button
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                form="account-form"
                className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-[0_4px_12px_rgba(37,99,235,0.2)] dark:shadow-none w-full md:w-auto"
              >
                {t('Simpan Rekening')}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
