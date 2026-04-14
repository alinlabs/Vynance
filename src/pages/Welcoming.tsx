import React from 'react';
import { motion } from 'motion/react';
import { useSettings } from '../contexts/SettingsContext';

export default function Welcoming() {
  const { t } = useSettings();

  return (
    <div className="fixed inset-0 w-screen h-screen bg-white dark:bg-slate-950 flex flex-col items-center justify-center z-[100] overflow-hidden transition-colors duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex flex-col items-center"
      >
        {/* Logo */}
        <div className="w-24 h-24 bg-blue-50 dark:bg-blue-500/10 rounded-[2rem] flex items-center justify-center mb-6 shadow-xl shadow-blue-100/50 dark:shadow-none border border-blue-100/50 dark:border-blue-500/20">
          <img 
            src="/image/logo-icon.png" 
            alt="Vynance Logo" 
            className="w-14 h-14 object-contain" 
            onError={(e) => {
              // Fallback if image doesn't exist
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement!.innerHTML = '<div class="text-blue-600 dark:text-blue-400 font-bold text-4xl">V</div>';
            }} 
          />
        </div>

        {/* App Name */}
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-slate-100 mb-3 tracking-tight">
          Vynance
        </h1>

        {/* Slogan */}
        <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg font-medium mb-12 text-center max-w-xs">
          Smart Finance For Live Balance
        </p>
        
        {/* Loading Animation (Modern Pill Indicators) */}
        <div className="flex items-center justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-2 bg-blue-600 dark:bg-blue-400 rounded-full"
              animate={{ 
                width: ["8px", "24px", "8px"],
                opacity: [0.4, 1, 0.4]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
