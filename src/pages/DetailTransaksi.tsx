import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { Transaction, Category, Account, Contact } from '../types';
import { formatCurrency, formatDate } from '../utils';
import { ArrowLeft, FileText, Image as ImageIcon, File as FilePdf, MoreVertical, CheckCircle2, Download, Share2, Image } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSettings } from '../contexts/SettingsContext';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface DetailTransaksiProps {
  transaction: Transaction;
  category?: Category;
  account?: Account;
  toAccount?: Account;
  contact?: Contact;
  onClose: () => void;
}

export default function DetailTransaksi({ transaction, category, account, toAccount, contact, onClose }: DetailTransaksiProps) {
  const { t } = useSettings();
  const [showExportMenu, setShowExportMenu] = React.useState(false);
  const exportMenuRef = React.useRef<HTMLDivElement>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = async () => {
    if (!receiptRef.current) return;
    try {
      const canvas = await html2canvas(receiptRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Transaksi_${transaction.id}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      window.print(); // Fallback
    }
  };

  const handleExportText = () => {
    const text = `
${t('Detail Transaksi')}
----------------
${t('Tanggal')}: ${formatDate(transaction.date)}
${t('Jenis')}: ${transaction.type === 'income' ? t('Pemasukan') : transaction.type === 'expense' ? t('Pengeluaran') : t('Mutasi')}
${t('Nominal')}: ${formatCurrency(transaction.amount)}
${t('Keterangan')}: ${transaction.description}
${transaction.type !== 'transfer' ? `${t('Kategori')}: ${category ? category.name : transaction.categoryId}` : ''}
${account ? `${t('Rekening')}: ${account.name}` : ''}
${toAccount ? `${t('Rekening Tujuan')}: ${toAccount.name}` : ''}
${contact ? `${t('Kontak')}: ${contact.name}` : ''}
    `.trim();
    
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Transaksi_${transaction.id}.txt`;
    link.click();
  };

  const handleExportImage = async () => {
    if (!receiptRef.current) return;
    try {
      const canvas = await html2canvas(receiptRef.current, { scale: 2, useCORS: true });
      const link = document.createElement('a');
      link.download = `Transaksi_${transaction.id}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error generating image:', error);
    }
  };

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const receiptId = `VYN-${transaction.id.substring(0, 8).toUpperCase()}`;

  const headerLeftActionsMobile = document.getElementById('header-left-actions-mobile');
  const headerLeftActionsDesktop = document.getElementById('header-left-actions-desktop');
  const headerActionsContainerMobile = document.getElementById('header-actions-container-mobile');
  const headerActionsContainerDesktop = document.getElementById('header-actions-container');

  const backButton = (
    <div className="flex items-center gap-2">
      <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 -ml-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
        <ArrowLeft size={20} className="md:w-6 md:h-6" />
      </button>
      <img src="/image/logo-icon.png" alt="Logo" className="h-6 w-6 object-contain md:hidden" />
    </div>
  );

  const exportMenu = (
    <div className="relative" ref={exportMenuRef}>
      <button 
        onClick={() => setShowExportMenu(!showExportMenu)}
        className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
      >
        <MoreVertical size={20} />
      </button>
      
      <AnimatePresence>
        {showExportMenu && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-lg dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden z-50 transition-colors duration-200"
          >
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 mb-1">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('Download Riwayat')}</span>
            </div>
            <button onClick={() => { handleExportPDF(); setShowExportMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2">
              <Download size={16} /> {t('Eksport PDF')}
            </button>
            <button onClick={() => { handleExportImage(); setShowExportMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2">
              <Image size={16} /> {t('Eksport Gambar')}
            </button>
            <button onClick={() => { handleExportText(); setShowExportMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2">
              <FileText size={16} /> {t('Salin Teks')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // Update the header title when this component is mounted
  React.useEffect(() => {
    const mobileTitle = document.getElementById('header-title-mobile');
    const desktopTitle = document.getElementById('header-title-desktop');
    const originalMobileTitle = mobileTitle?.innerText;
    const originalDesktopTitle = desktopTitle?.innerText;

    if (mobileTitle) mobileTitle.innerText = t('Detail Transaksi');
    if (desktopTitle) desktopTitle.innerText = t('Detail Transaksi');

    // Hide the logo on mobile when showing detail
    const mobileLogo = mobileTitle?.parentElement?.parentElement?.previousElementSibling as HTMLElement;
    if (mobileLogo && mobileLogo.tagName === 'IMG') {
      mobileLogo.style.display = 'none';
    }

    return () => {
      if (mobileTitle && originalMobileTitle) mobileTitle.innerText = originalMobileTitle;
      if (desktopTitle && originalDesktopTitle) desktopTitle.innerText = originalDesktopTitle;
      if (mobileLogo) {
        mobileLogo.style.display = '';
      }
    };
  }, [t]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-100 dark:bg-slate-950 md:bg-transparent md:dark:bg-transparent rounded-2xl md:rounded-none overflow-hidden w-full pb-24 md:pb-0 flex flex-col items-center md:items-stretch transition-colors duration-200"
    >
      {headerLeftActionsMobile && createPortal(backButton, headerLeftActionsMobile)}
      {headerLeftActionsDesktop && createPortal(backButton, headerLeftActionsDesktop)}
      {headerActionsContainerMobile && createPortal(exportMenu, headerActionsContainerMobile)}
      {headerActionsContainerDesktop && createPortal(exportMenu, headerActionsContainerDesktop)}

      <div className="p-4 md:p-0 w-full md:max-w-3xl mx-auto print:max-w-none print:p-0">
        {/* Receipt Card */}
        <div ref={receiptRef} className="bg-white dark:bg-slate-900 md:bg-white md:dark:bg-slate-900 rounded-2xl md:rounded-3xl shadow-sm md:shadow-xl border border-slate-200 dark:border-slate-800 md:border-slate-100 md:dark:border-slate-800 overflow-hidden relative print:border-none print:shadow-none transition-colors duration-200">
          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] dark:opacity-[0.02]">
            <img src="/image/logo-icon.png" alt="Watermark" className="w-64 h-64 object-contain grayscale" />
          </div>
          
          {/* Receipt Top Decoration */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-blue-600 md:h-3 md:bg-gradient-to-r md:from-blue-600 md:to-indigo-600" />
          
          <div className="p-6 md:p-10 relative z-10">
            {/* Header */}
            <div className="text-center md:text-left mb-6 md:mb-10 flex flex-col md:flex-row md:items-center md:justify-between md:border-b md:border-slate-100 md:dark:border-slate-800/60 md:pb-8">
              <div className="flex flex-col md:flex-row md:items-center md:gap-4">
                {/* Mobile Logo */}
                <div className="md:hidden flex justify-center">
                  <img src="/image/logo-full-text-color.png" alt="Vynance" className="h-8 object-contain dark:hidden" />
                  <img src="/image/logo-full-text-white.png" alt="Vynance" className="h-8 object-contain hidden dark:block" />
                </div>
                
                {/* Desktop Logo & Text */}
                <div className="hidden md:flex items-center justify-center w-14 h-14 shrink-0 bg-blue-50 dark:bg-blue-500/10 rounded-2xl p-2">
                  <img src="/image/logo-icon.png" alt="Vynance Logo" className="w-full h-full object-contain" />
                </div>
                <div className="hidden md:block">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Vynance</h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t('Catatan Keuangan Pribadi')}</p>
                </div>
              </div>
              
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{t('ID Transaksi')}</p>
                <p className="text-lg font-mono font-semibold text-slate-700 dark:text-slate-300">{receiptId}</p>
              </div>
            </div>

            {/* Status & Amount */}
            <div className="text-center md:text-left mb-8 md:mb-10 flex flex-col md:flex-row md:items-end md:justify-between bg-slate-50 dark:bg-slate-800/30 p-6 rounded-2xl md:rounded-3xl border border-slate-100 dark:border-slate-800/50">
              <div className="order-2 md:order-1">
                <p className="text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">{t('Total Nominal')}</p>
                <h3 className={`text-3xl md:text-5xl font-bold tracking-tight ${transaction.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : transaction.type === 'expense' ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400'}`}>
                  {transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : ''} {formatCurrency(transaction.amount)}
                </h3>
              </div>
              <div className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-full text-sm font-bold mb-4 md:mb-0 order-1 md:order-2 h-fit mx-auto md:mx-0 shadow-sm">
                <CheckCircle2 size={18} />
                {t('Transaksi Berhasil')}
              </div>
            </div>

            {/* Dashed Divider */}
            <div className="relative h-px w-full my-6 md:my-8">
              <div className="absolute inset-0 border-t-2 border-dashed border-slate-200 dark:border-slate-700" />
              <div className="absolute -left-8 md:-left-12 -top-3 w-6 h-6 bg-slate-100 dark:bg-slate-950 rounded-full print:hidden transition-colors duration-200 shadow-inner" />
              <div className="absolute -right-8 md:-right-12 -top-3 w-6 h-6 bg-slate-100 dark:bg-slate-950 rounded-full print:hidden transition-colors duration-200 shadow-inner" />
            </div>

            {/* Details */}
            <div className="space-y-4 text-sm md:grid md:grid-cols-2 md:gap-x-12 md:gap-y-8 md:space-y-0">
              <div className="flex justify-between md:flex-col md:justify-start items-start gap-4 md:gap-1.5 md:hidden">
                <span className="text-slate-500 dark:text-slate-400 shrink-0">{t('ID Transaksi')}</span>
                <span className="font-medium text-slate-900 dark:text-slate-100 text-right md:text-left font-mono text-xs md:text-sm">{receiptId}</span>
              </div>
              <div className="flex justify-between md:flex-col md:justify-start items-start gap-4 md:gap-1.5">
                <span className="text-slate-500 dark:text-slate-400 shrink-0">{t('Tanggal')}</span>
                <span className="font-medium text-slate-900 dark:text-slate-100 text-right md:text-left md:text-base">{formatDate(transaction.date)}</span>
              </div>
              <div className="flex justify-between md:flex-col md:justify-start items-start gap-4 md:gap-1.5">
                <span className="text-slate-500 dark:text-slate-400 shrink-0">{t('Jenis')}</span>
                <span className="font-medium text-slate-900 dark:text-slate-100 text-right md:text-left md:text-base">
                  {transaction.type === 'income' ? t('Pemasukan') : transaction.type === 'expense' ? t('Pengeluaran') : t('Mutasi')}
                </span>
              </div>
              <div className="flex justify-between md:flex-col md:justify-start items-start gap-4 md:gap-1.5 md:col-span-2">
                <span className="text-slate-500 dark:text-slate-400 shrink-0">{t('Keterangan')}</span>
                <span className="font-medium text-slate-900 dark:text-slate-100 text-right md:text-left md:text-base">{transaction.description}</span>
              </div>
              
              {transaction.type !== 'transfer' && (category || transaction.categoryId) && (
                <div className="flex justify-between md:flex-col md:justify-start items-start gap-4 md:gap-1.5">
                  <span className="text-slate-500 dark:text-slate-400 shrink-0">{t('Kategori')}</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100 text-right md:text-left md:text-base">{category ? category.name : transaction.categoryId}</span>
                </div>
              )}
              {account && (
                <>
                  <div className="flex justify-between md:flex-col md:justify-start items-start gap-4 md:gap-1.5">
                    <span className="text-slate-500 dark:text-slate-400 shrink-0">{transaction.type === 'transfer' ? t('Rekening Asal') : t('Rekening')}</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100 text-right md:text-left md:text-base">{account.name}</span>
                  </div>
                  {account.accountName && (
                    <div className="flex justify-between md:flex-col md:justify-start items-start gap-4 md:gap-1.5">
                      <span className="text-slate-500 dark:text-slate-400 shrink-0">{t('Atas Nama')}</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100 text-right md:text-left md:text-base">{account.accountName}</span>
                    </div>
                  )}
                  {account.accountNumber && (
                    <div className="flex justify-between md:flex-col md:justify-start items-start gap-4 md:gap-1.5">
                      <span className="text-slate-500 dark:text-slate-400 shrink-0">{t('Nomor Rekening')}</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100 text-right md:text-left md:text-base">{account.accountNumber}</span>
                    </div>
                  )}
                </>
              )}
              {toAccount && (
                <>
                  <div className="flex justify-between md:flex-col md:justify-start items-start gap-4 md:gap-1.5">
                    <span className="text-slate-500 dark:text-slate-400 shrink-0">{t('Rekening Tujuan')}</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100 text-right md:text-left md:text-base">{toAccount.name}</span>
                  </div>
                  {toAccount.accountName && (
                    <div className="flex justify-between md:flex-col md:justify-start items-start gap-4 md:gap-1.5">
                      <span className="text-slate-500 dark:text-slate-400 shrink-0">{t('Atas Nama Tujuan')}</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100 text-right md:text-left md:text-base">{toAccount.accountName}</span>
                    </div>
                  )}
                  {toAccount.accountNumber && (
                    <div className="flex justify-between md:flex-col md:justify-start items-start gap-4 md:gap-1.5">
                      <span className="text-slate-500 dark:text-slate-400 shrink-0">{t('Nomor Rekening Tujuan')}</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100 text-right md:text-left md:text-base">{toAccount.accountNumber}</span>
                    </div>
                  )}
                </>
              )}
              {contact && (
                <div className="flex justify-between md:flex-col md:justify-start items-start gap-4 md:gap-1.5">
                  <span className="text-slate-500 dark:text-slate-400 shrink-0">{t('Kontak')}</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100 text-right md:text-left md:text-base">{contact.name}</span>
                </div>
              )}
              {transaction.dueDate && (
                <div className="flex justify-between md:flex-col md:justify-start items-start gap-4 md:gap-1.5">
                  <span className="text-slate-500 dark:text-slate-400 shrink-0">{t('Tanggal Rencana Bayar')}</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100 text-right md:text-left md:text-base">{formatDate(transaction.dueDate)}</span>
                </div>
              )}
              {transaction.installmentType && transaction.installmentCount && (
                <div className="flex justify-between md:flex-col md:justify-start items-start gap-4 md:gap-1.5">
                  <span className="text-slate-500 dark:text-slate-400 shrink-0">{t('Tempo Cicilan')}</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100 text-right md:text-left md:text-base">
                    {transaction.installmentCount}x {transaction.installmentType === 'weekly' ? t('Per Minggu') : transaction.installmentType === 'monthly' ? t('Per Bulan') : t('Per Tahun')}
                  </span>
                </div>
              )}
            </div>

            {/* Receipt Footer */}
            <div className="mt-8 md:mt-12 pt-6 border-t border-slate-100 dark:border-slate-800/60 text-center md:text-left flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex flex-col gap-3">
                <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm leading-relaxed">{t('Resi ini merupakan bukti transaksi yang sah yang diterbitkan oleh Vynance.')}</p>
                {/* Barcode Placeholder */}
                <div className="hidden md:flex flex-col gap-1 mt-2 opacity-60">
                  <div className="h-8 w-48 bg-[repeating-linear-gradient(90deg,var(--color-slate-800)_0,var(--color-slate-800)_2px,transparent_2px,transparent_4px,var(--color-slate-800)_4px,var(--color-slate-800)_5px,transparent_5px,transparent_8px,var(--color-slate-800)_8px,var(--color-slate-800)_12px,transparent_12px,transparent_14px)] dark:bg-[repeating-linear-gradient(90deg,var(--color-slate-300)_0,var(--color-slate-300)_2px,transparent_2px,transparent_4px,var(--color-slate-300)_4px,var(--color-slate-300)_5px,transparent_5px,transparent_8px,var(--color-slate-300)_8px,var(--color-slate-300)_12px,transparent_12px,transparent_14px)]"></div>
                  <span className="text-[10px] font-mono tracking-[0.2em] text-slate-500">{receiptId}</span>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <button onClick={handleExportPDF} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors" title={t('Download PDF')}>
                  <Download size={20} />
                </button>
                <button onClick={handleExportImage} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors" title={t('Download Gambar')}>
                  <Image size={20} />
                </button>
                <button onClick={handleExportText} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors" title={t('Salin Teks')}>
                  <FileText size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Attachments */}
        {transaction.receiptUrl && (
          <div className="mt-6 md:mt-8 print:hidden">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 ml-1 md:ml-0">{t('Lampiran')}</h4>
            {transaction.receiptUrl.startsWith('data:application/pdf') ? (
              <div className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 md:bg-slate-50 md:dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm md:shadow-none transition-colors duration-200">
                <FilePdf size={24} className="text-rose-500 shrink-0" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{t('Dokumen PDF Terlampir')}</span>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 md:bg-slate-50 md:dark:bg-slate-800/50 p-2 md:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm md:shadow-none transition-colors duration-200">
                <img src={transaction.receiptUrl} alt={t("Bukti Transaksi")} className="w-full md:max-w-2xl rounded-xl object-cover" />
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
