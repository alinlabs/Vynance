import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Info } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

interface AboutPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutPopup({ isOpen, onClose }: AboutPopupProps) {
  const { t } = useSettings();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const content = isMobile ? (
    <div 
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/50 dark:bg-slate-950/80 backdrop-blur-sm pointer-events-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: '100%' }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full bg-white dark:bg-slate-900 rounded-t-3xl p-6 pb-8 shadow-2xl relative border-t border-slate-100 dark:border-slate-800 transition-colors duration-200 pointer-events-auto max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6" />
        <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-blue-500/10 border border-slate-100 dark:border-slate-700">
          <img src="/image/logo-icon.png" alt="Vynance Logo" className="w-10 h-10 object-contain" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2 text-center tracking-tight">
          Vynance
        </h2>
        <p className="text-blue-600 dark:text-blue-400 mb-6 text-center text-sm font-semibold tracking-wide uppercase">
          Smart Finance for Live Balance
        </p>
        
        <div className="space-y-6 text-left">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              Inovasi Finansial Modern
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-3 text-justify">
              Vynance hadir sebagai solusi atas kompleksitas pengelolaan uang di era digital. Dikembangkan oleh AlinLabs, platform ini menggabungkan fleksibilitas tinggi dengan antarmuka yang intuitif untuk mewujudkan ekosistem finansial yang seimbang.
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed text-justify">
              Di bawah pimpinan Alvareza H. Pratama dan Mela Melati Aprilia, AlinLabs merancang Vynance dengan visi mendemokrasikan teknologi cerdas. Kami fokus menciptakan produk yang tidak hanya fungsional, tetapi juga memiliki empati mendalam terhadap kebutuhan finansial Anda.
            </p>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
              Mengenai AlinLabs
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed text-justify">
              Artificial Intelligence Laboratories Indonesia (AlinLabs) adalah pusat inovasi digital yang berdedikasi menghadirkan solusi berbasis AI untuk mempermudah kehidupan sehari-hari masyarakat Indonesia melalui teknologi yang tepat guna dan berkelanjutan.
            </p>
          </div>
        </div>
        
        <div className="mt-8">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="w-full px-4 py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl transition-colors"
          >
            {t('Tutup')}
          </button>
        </div>
      </motion.div>
    </div>
  ) : (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 dark:bg-slate-950/80 backdrop-blur-sm p-4 pointer-events-auto"
      onClick={onClose}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col w-full max-w-lg p-8 text-center transition-colors duration-200 pointer-events-auto max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-blue-500/10 border border-slate-100 dark:border-slate-700">
          <img src="/image/logo-icon.png" alt="Vynance Logo" className="w-10 h-10 object-contain" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2 text-center tracking-tight">
          Vynance
        </h2>
        <p className="text-blue-600 dark:text-blue-400 mb-8 text-center text-sm font-semibold tracking-wide uppercase">
          Smart Finance for Live Balance
        </p>
        
        <div className="space-y-6 text-left mb-8">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              Inovasi Finansial Modern
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-3 text-justify">
              Vynance hadir sebagai solusi atas kompleksitas pengelolaan uang di era digital. Dikembangkan oleh AlinLabs, platform ini menggabungkan fleksibilitas tinggi dengan antarmuka yang intuitif untuk mewujudkan ekosistem finansial yang seimbang.
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed text-justify">
              Di bawah pimpinan Alvareza H. Pratama dan Mela Melati Aprilia, AlinLabs merancang Vynance dengan visi mendemokrasikan teknologi cerdas. Kami fokus menciptakan produk yang tidak hanya fungsional, tetapi juga memiliki empati mendalam terhadap kebutuhan finansial Anda.
            </p>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
              Mengenai AlinLabs
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed text-justify">
              Artificial Intelligence Laboratories Indonesia (AlinLabs) adalah pusat inovasi digital yang berdedikasi menghadirkan solusi berbasis AI untuk mempermudah kehidupan sehari-hari masyarakat Indonesia melalui teknologi yang tepat guna dan berkelanjutan.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl transition-colors"
        >
          {t('Tutup')}
        </button>
      </motion.div>
    </div>
  );

  return createPortal(
    <AnimatePresence>
      {isOpen && content}
    </AnimatePresence>,
    document.body
  );
}
