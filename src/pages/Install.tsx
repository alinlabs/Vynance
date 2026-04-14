import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Download, CheckCircle, Smartphone, Monitor, ChevronRight } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useNavigate } from 'react-router-dom';

export default function Install() {
  const { t } = useSettings();
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 md:p-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
      >
        <div className="bg-blue-600 p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          <div className="relative z-10">
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <img src="/image/logo-icon.png" alt="Vynance Logo" className="w-12 h-12 object-contain" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{t('Install Vynance')}</h1>
            <p className="text-blue-100 text-lg">{t('Akses lebih cepat, bisa offline, dan pengalaman seperti aplikasi native.')}</p>
          </div>
        </div>

        <div className="p-8">
          {isInstalled ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={40} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t('Aplikasi Sudah Terinstall')}</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-8">{t('Anda sudah bisa menggunakan Vynance langsung dari layar utama perangkat Anda.')}</p>
              <button 
                onClick={() => window.location.href = 'https://vynance.vercel.app'}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors"
              >
                {t('Buka Vynance')}
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-4">
                    <Smartphone size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{t('Untuk Mobile')}</h3>
                  <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400 font-bold">1.</span>
                      {t('Buka Vynance di browser (Chrome/Safari)')}
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400 font-bold">2.</span>
                      {t('Ketuk ikon menu atau bagikan')}
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400 font-bold">3.</span>
                      {t('Pilih "Tambahkan ke Layar Utama"')}
                    </li>
                  </ul>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-4">
                    <Monitor size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{t('Untuk Desktop')}</h3>
                  <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400 font-bold">1.</span>
                      {t('Buka Vynance di Chrome/Edge')}
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400 font-bold">2.</span>
                      {t('Klik ikon install di address bar')}
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400 font-bold">3.</span>
                      {t('Atau klik tombol di bawah ini')}
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-col items-center pt-4 border-t border-slate-100 dark:border-slate-800">
                {isInstallable ? (
                  <button
                    onClick={handleInstallClick}
                    className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl"
                  >
                    <Download size={24} />
                    {t('Install Vynance Sekarang')}
                  </button>
                ) : (
                  <div className="text-center">
                    <p className="text-slate-500 dark:text-slate-400 mb-4 text-sm">
                      {t('Tombol install tidak tersedia di browser ini. Silakan ikuti panduan manual di atas.')}
                    </p>
                    <button 
                      onClick={() => window.location.href = 'https://vynance.vercel.app'}
                      className="text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 mx-auto hover:underline"
                    >
                      {t('Buka Vynance')} <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
