import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, Circle, ChevronDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSettings } from '../contexts/SettingsContext';

export interface ComboboxOption {
  value: string;
  label: string;
  shortLabel?: string;
  description?: string;
  icon?: React.ReactNode;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export interface ComboboxRef {
  open: () => void;
}

const Combobox = forwardRef<ComboboxRef, ComboboxProps>(({ options, value, onChange, placeholder, disabled = false, className = 'px-4 py-3 rounded-2xl' }, ref) => {
  const { t } = useSettings();
  const defaultPlaceholder = placeholder || t('Pilih...');
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useImperativeHandle(ref, () => ({
    open: () => {
      if (!disabled) {
        setIsOpen(true);
        setSearchTerm('');
      }
    }
  }));

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const selectedOption = options.find(o => o.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        // Only close if it's not mobile, because mobile uses a portal which is outside containerRef
        if (!isMobile) {
          setIsOpen(false);
          setSearchTerm('');
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile]);

  const filteredOptions = (options || []).filter(o => 
    o.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (optionValue: string) => {
    if (value === optionValue) {
      onChange(''); // Deselect if clicked again
    } else {
      onChange(optionValue);
    }
    setIsOpen(false);
    setSearchTerm('');
  };

  const searchInputRef = useRef<HTMLInputElement>(null);

  const popupContent = (
    <div className="py-2 sm:py-0">
      {isMobile && (
        <div className="px-4 pb-3 mb-2 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-3 sticky top-0 bg-white dark:bg-slate-900 z-10 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">{defaultPlaceholder}</h3>
            <button onClick={() => setIsOpen(false)} className="p-2 -mr-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 bg-slate-50 dark:bg-slate-800 rounded-full transition-colors">
              <X size={18} />
            </button>
          </div>
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-base outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
              placeholder={t("Cari...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      )}
      <div className="max-h-[50vh] sm:max-h-60 overflow-y-auto overscroll-contain">
        {filteredOptions.length === 0 ? (
          <div className="px-4 py-6 sm:py-3 text-sm text-slate-500 dark:text-slate-400 text-center">{t('Tidak ada pilihan ditemukan')}</div>
        ) : (
          filteredOptions.map((option) => {
            const isSelected = value === option.value;
            return (
              <div
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`flex items-center px-4 py-3.5 sm:py-3 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${isSelected ? 'bg-blue-50/50 dark:bg-blue-500/10' : ''}`}
              >
                <div className="flex-shrink-0 mr-3 text-blue-600 dark:text-blue-400">
                  {isSelected ? <CheckCircle2 size={20} /> : <Circle size={20} className="text-slate-300 dark:text-slate-600" />}
                </div>
                {option.icon && <span className="mr-2 shrink-0">{option.icon}</span>}
                <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 min-w-0 flex-1">
                  <span className={`text-sm sm:text-base whitespace-nowrap ${isSelected ? 'font-medium text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300'}`}>
                    {option.label}
                  </span>
                  {option.description && (
                    <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                      {option.description}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <div className="relative w-full" ref={containerRef}>
      <div 
        className={`flex items-center w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 transition-all ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-text focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500'}`}
        onClick={() => {
          if (!disabled) {
            setIsOpen(true);
            setSearchTerm('');
          }
        }}
      >
        {selectedOption && !isOpen && selectedOption.icon && (
          <span className="mr-2 shrink-0">{selectedOption.icon}</span>
        )}
        <input
          type="text"
          className="w-full bg-transparent outline-none text-base text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 truncate min-w-0"
          placeholder={selectedOption && !isOpen ? (selectedOption.shortLabel || selectedOption.label) : defaultPlaceholder}
          value={isOpen ? searchTerm : (selectedOption ? (selectedOption.shortLabel || selectedOption.label) : '')}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            setSearchTerm('');
          }}
          disabled={disabled}
          readOnly={!isOpen && !!selectedOption}
        />
        <ChevronDown size={20} className={`text-slate-400 dark:text-slate-500 transition-transform shrink-0 ml-1 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      <AnimatePresence>
        {isOpen && !disabled && !isMobile && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 min-w-full w-max max-w-[300px] mt-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-none overflow-hidden transition-colors duration-200"
          >
            {popupContent}
          </motion.div>
        )}
      </AnimatePresence>

      {isMobile && isOpen && !disabled && createPortal(
        <div className="fixed inset-0 z-[100] flex flex-col justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl overflow-hidden pb-safe transition-colors duration-200"
          >
            <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto my-3" />
            {popupContent}
          </motion.div>
        </div>,
        document.body
      )}
    </div>
  );
});

export default Combobox;
