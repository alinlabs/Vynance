import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, User, Mail, Phone, AlertCircle } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import Combobox, { ComboboxRef } from '../components/Combobox';

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

const EMAIL_DOMAINS = ['@gmail.com', '@yahoo.com', '@outlook.com', '@icloud.com'];

interface SplashProps {
  onComplete: () => void;
}

export default function Splash({ onComplete }: SplashProps) {
  const { t } = useSettings();
  const [step, setStep] = useState(1);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  // Hover states for desktop navigation
  const [hoverLeft, setHoverLeft] = useState(false);
  const [hoverRight, setHoverRight] = useState(false);

  // Registration Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [emailDomain, setEmailDomain] = useState('@gmail.com');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+62');
  const [error, setError] = useState('');
  const emailDomainRef = useRef<ComboboxRef>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const desktopOrder = [1, 2, 3, 4];
  
  const handleNext = () => {
    if (step < 4) {
      setStepProgrammatically(step + 1);
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStepProgrammatically(step - 1);
    }
  };

  const setStepProgrammatically = (newStep: number) => {
    if (newStep === step) return;
    setStep(newStep);
  };

  const validateForm = () => {
    if (!name.trim()) return t('Nama lengkap wajib diisi');
    const fullEmail = `${email}${emailDomain}`;
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fullEmail)) return t('Email tidak valid');
    
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) return t('Nomor telepon minimal 10 digit');
    
    // Check for 5 identical digits
    if (/(.)\1{4}/.test(digits)) return t('Nomor telepon tidak valid (terlalu banyak angka berulang)');
    
    // Check for 5 sequential digits
    for (let i = 0; i <= digits.length - 5; i++) {
      const seq = digits.substring(i, i + 5);
      if ('0123456789'.includes(seq) || '9876543210'.includes(seq)) {
        return t('Nomor telepon tidak valid (angka berurutan tidak diizinkan)');
      }
    }
    
    return '';
  };

  const handleComplete = () => {
    if (step === 4) {
      const validationError = validateForm();
      if (validationError) {
        setError(validationError);
        return;
      }
      
      // Save user data
      localStorage.setItem('vinance_user_name', name);
      localStorage.setItem('vinance_user_email', `${email}${emailDomain}`);
      localStorage.setItem('vinance_user_phone', phone);
      localStorage.setItem('vinance_user_country_code', countryCode);
    }
    
    localStorage.setItem('vinance_onboarding_complete', 'true');
    onComplete();
  };

  return (
    <div className="fixed inset-0 w-screen h-screen bg-gradient-to-b from-blue-700 to-blue-300 overflow-hidden">
      <motion.div
        className="flex w-[400%] h-full"
        animate={{ x: `-${(step - 1) * 25}%` }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {[1, 2, 3, 4].map((i) => {
          const desktopIndex = desktopOrder[i - 1];
          return (
            <div key={i} className="w-1/4 h-full relative">
              <picture className="absolute inset-0 w-full h-full pointer-events-none">
                <source media="(min-width: 768px)" srcSet={`/image/splash-desktop${desktopIndex}.png`} />
                <img 
                  src={`/image/splash-mobile${i}.png`} 
                  alt={`Splash ${i}`} 
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => e.currentTarget.style.display = 'none'}
                />
              </picture>
            </div>
          );
        })}
      </motion.div>

      {/* Mobile Logo */}
      {!isDesktop && (
        <div className="absolute top-8 inset-x-0 flex justify-center z-20 pointer-events-none">
          <img src="/image/logo-full-text-white.png" alt="Logo" className="h-8 object-contain drop-shadow-md" />
        </div>
      )}

      {/* Registration Form Overlay for Step 4 */}
      <AnimatePresence>
        {step === 4 && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute inset-0 z-30 flex items-center justify-center p-4 md:p-8 pointer-events-none"
          >
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-6 md:p-8 rounded-3xl shadow-2xl max-w-md w-full pointer-events-auto border border-white/20">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 text-center">{t('Mulai Perjalanan Anda')}</h2>
              <p className="text-slate-600 dark:text-slate-300 text-center mb-6 text-sm">{t('Lengkapi data diri untuk pengalaman yang lebih personal.')}</p>
              
              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl flex items-start gap-2 text-red-600 dark:text-red-400 text-sm">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('Nama Lengkap')}</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User size={18} className="text-slate-400" />
                    </div>
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => { setName(e.target.value); setError(''); }}
                      className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                      placeholder="John Doe"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('Email')}</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail size={18} className="text-slate-400" />
                      </div>
                      <input 
                        type="text" 
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
                          setError('');
                        }}
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                        placeholder="john"
                      />
                    </div>
                    <div className="w-[130px] md:w-[140px] shrink-0">
                      <Combobox
                        ref={emailDomainRef}
                        className="px-3 md:px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                        options={EMAIL_DOMAINS.map(domain => ({ value: domain, label: domain }))}
                        value={emailDomain}
                        onChange={setEmailDomain}
                        placeholder={t('Domain')}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('Nomor Telepon')}</label>
                  <div className="flex gap-2">
                    <div className="w-[110px] md:w-[140px] shrink-0">
                      <Combobox
                        className="px-3 md:px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                        options={COUNTRY_CODES}
                        value={countryCode}
                        onChange={setCountryCode}
                        placeholder={t('Kode')}
                      />
                    </div>
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone size={18} className="text-slate-400" />
                      </div>
                      <input 
                        type="tel" 
                        value={phone}
                        onChange={(e) => { setPhone(e.target.value.replace(/[^\d\-\+]/g, '')); setError(''); }}
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                        placeholder="81234567890"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {!isDesktop && (
                <button
                  onClick={handleComplete}
                  className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 py-4 text-lg font-semibold flex items-center justify-center gap-2 transition-all shadow-lg"
                >
                  {t('Daftar & Mulai')}
                  <ChevronRight size={20} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click Navigation Areas (Desktop & Mobile) */}
      <>
        {/* Left Area */}
        <div 
          className={`absolute inset-y-0 left-0 w-1/3 z-10 cursor-pointer flex items-center ${isDesktop ? 'pl-12' : 'pl-4'}`}
          onMouseEnter={() => setHoverLeft(true)}
          onMouseLeave={() => setHoverLeft(false)}
          onClick={handlePrev}
        >
          {isDesktop && (
            <AnimatePresence>
              {hoverLeft && step > 1 && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="w-14 h-14 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center text-white border border-white/20 shadow-lg"
                >
                  <ChevronLeft size={32} />
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* Right Area */}
        {step < 4 && (
          <div 
            className={`absolute inset-y-0 right-0 w-1/3 z-10 cursor-pointer flex items-center justify-end ${isDesktop ? 'pr-12' : 'pr-4'}`}
            onMouseEnter={() => setHoverRight(true)}
            onMouseLeave={() => setHoverRight(false)}
            onClick={handleNext}
          >
            {isDesktop && (
              <AnimatePresence>
                {hoverRight && (
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="w-14 h-14 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center text-white border border-white/20 shadow-lg"
                  >
                    <ChevronRight size={32} />
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        )}
      </>

      {/* Controls */}
      {isDesktop ? (
        /* Desktop Controls - Bottom Right */
        <div className="absolute bottom-16 right-32 z-20 flex items-center gap-8">
          {/* Indicators */}
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <button 
                key={i} 
                onClick={() => setStepProgrammatically(i)}
                className={`h-2 rounded-full transition-all duration-300 drop-shadow-md ${step === i ? 'w-8 bg-white' : 'w-2 bg-white/60 hover:bg-white'}`}
                aria-label={`Go to slide ${i}`}
              />
            ))}
          </div>

          {/* Next / Start Button */}
          {step < 4 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 text-white font-medium hover:text-white/80 transition-colors text-lg drop-shadow-md"
            >
              {t('Selanjutnya')}
              <ChevronRight size={20} />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="flex items-center gap-2 text-white font-medium bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl transition-all shadow-lg text-lg z-40 relative"
            >
              {t('Daftar & Mulai')}
              <ChevronRight size={20} />
            </button>
          )}
        </div>
      ) : (
        /* Mobile Overlay Controls */
        <div className="absolute bottom-0 inset-x-0 p-6 pb-10 md:pb-6 flex flex-col items-center z-40 pointer-events-none">
          
          {/* Progress Indicators with Prev/Next Icons */}
          {step < 4 && (
            <div className="flex items-center gap-4 mb-2 pointer-events-auto">
              <button 
                onClick={handlePrev} 
                disabled={step === 1}
                className={`p-2 rounded-full transition-colors ${step === 1 ? 'text-white/30' : 'text-white hover:bg-white/10'}`}
              >
                <ChevronLeft size={24} />
              </button>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <button 
                    key={i} 
                    onClick={() => setStepProgrammatically(i)}
                    className={`h-2 rounded-full transition-all duration-300 drop-shadow-md ${step === i ? 'w-8 bg-white' : 'w-2 bg-white/60 hover:bg-white'}`}
                    aria-label={`Go to slide ${i}`}
                  />
                ))}
              </div>
              <button 
                onClick={handleNext} 
                disabled={step === 4}
                className={`p-2 rounded-full transition-colors ${step === 4 ? 'text-white/30' : 'text-white hover:bg-white/10'}`}
              >
                <ChevronRight size={24} />
              </button>
            </div>
          )}

          <div className="h-[60px] w-full max-w-md flex items-center justify-center pointer-events-auto">
            {/* Mobile button moved inside the form for step 4 */}
          </div>
        </div>
      )}
    </div>
  );
}
