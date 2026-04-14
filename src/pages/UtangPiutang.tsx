import React, { useState, useMemo } from 'react';
import { Contact, Transaction, Category, Account } from '../types';
import { formatCurrency, formatDate } from '../utils';
import { ArrowUpRight, ArrowDownRight, Calendar, Filter, User } from 'lucide-react';
import { motion } from 'motion/react';
import DetailTransaksi from './DetailTransaksi';
import { useSettings } from '../contexts/SettingsContext';
import Combobox from '../components/Combobox';

interface DebtListProps {
  contacts: Contact[];
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
}

export default function DebtList({ contacts, transactions, categories, accounts }: DebtListProps) {
  const { t } = useSettings();
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'utang' | 'piutang'>('utang');
  const [selectedContactId, setSelectedContactId] = useState<string>('all');

  const utangTransactions = useMemo(() => 
    (transactions || []).filter(trx => 
      (trx.categoryId === 'inc_terima_pinjaman' || trx.categoryId === 'exp_bayar_utang') &&
      (selectedContactId === 'all' || trx.contactId === selectedContactId)
    )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  [transactions, selectedContactId]);

  const piutangTransactions = useMemo(() => 
    (transactions || []).filter(trx => 
      (trx.categoryId === 'exp_kasih_pinjaman' || trx.categoryId === 'inc_bayar_utang') &&
      (selectedContactId === 'all' || trx.contactId === selectedContactId)
    )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  [transactions, selectedContactId]);

  const totalUtang = useMemo(() => {
    return utangTransactions.reduce((acc, trx) => {
      if (trx.categoryId === 'inc_terima_pinjaman') return acc + trx.amount;
      if (trx.categoryId === 'exp_bayar_utang') return acc - trx.amount;
      return acc;
    }, 0);
  }, [utangTransactions]);

  const totalPiutang = useMemo(() => {
    return piutangTransactions.reduce((acc, trx) => {
      if (trx.categoryId === 'exp_kasih_pinjaman') return acc + trx.amount;
      if (trx.categoryId === 'inc_bayar_utang') return acc - trx.amount;
      return acc;
    }, 0);
  }, [piutangTransactions]);

  const getContactName = (id?: string) => contacts.find(c => c.id === id)?.name || t('Unknown');

  const selectedTransaction = useMemo(() => 
    (transactions || []).find(trx => trx.id === selectedTransactionId),
  [transactions, selectedTransactionId]);

  if (selectedTransaction) {
    return (
      <DetailTransaksi
        transaction={selectedTransaction}
        category={categories.find(c => c.id === selectedTransaction.categoryId)}
        account={accounts.find(a => a.id === selectedTransaction.accountId)}
        toAccount={accounts.find(a => a.id === selectedTransaction.toAccountId)}
        contact={contacts.find(c => c.id === selectedTransaction.contactId)}
        onClose={() => setSelectedTransactionId(null)}
      />
    );
  }

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* Mobile Tabs */}
      <div className="md:hidden flex p-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl mb-4 transition-colors duration-200">
        <button
          onClick={() => setActiveTab('utang')}
          className={`relative flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
            activeTab === 'utang' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          {activeTab === 'utang' && (
            <motion.div layoutId="debt-tab" className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-sm border border-slate-200/50 dark:border-slate-600/50 -z-10" />
          )}
          {t('Utang')}
        </button>
        <button
          onClick={() => setActiveTab('piutang')}
          className={`relative flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
            activeTab === 'piutang' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          {activeTab === 'piutang' && (
            <motion.div layoutId="debt-tab" className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-sm border border-slate-200/50 dark:border-slate-600/50 -z-10" />
          )}
          {t('Piutang')}
        </button>
      </div>

      {/* Filter by Contact */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3">
        <Filter className="text-slate-400" size={20} />
        <div className="flex-1">
          <Combobox
            options={[
              { value: 'all', label: t('Semua Peminjam / Terpinjam'), icon: <User size={16} /> },
              ...contacts.map(contact => ({ value: contact.id, label: contact.name, icon: <User size={16} /> }))
            ]}
            value={selectedContactId}
            onChange={setSelectedContactId}
            placeholder={t('Cari Peminjam / Terpinjam...')}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Card Utang */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex-col transition-colors duration-200 ${activeTab === 'utang' ? 'flex' : 'hidden md:flex'}`}
        >
          <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 bg-rose-50/30 dark:bg-rose-500/5 transition-colors duration-200">
            <h3 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ArrowDownRight className="text-rose-500 dark:text-rose-400" size={18} />
              {t('Daftar Utang')}
            </h3>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">{t('Uang yang harus Anda bayar')}</p>
            <div className="mt-3 md:mt-4">
              <p className="text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400">{t('Total Utang')}</p>
              <p className="text-2xl md:text-3xl font-bold text-rose-600 dark:text-rose-400 tracking-tight">
                {formatCurrency(totalUtang)}
              </p>
            </div>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 flex-1 overflow-y-auto max-h-[500px]">
            {(utangTransactions || []).length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">{t('Belum ada catatan utang.')}</div>
            ) : (
              utangTransactions.map(trx => (
                <div 
                  key={trx.id} 
                  onClick={() => setSelectedTransactionId(trx.id)}
                  className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{getContactName(trx.contactId)}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                      <Calendar size={12} /> {formatDate(trx.date)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{trx.description}</p>
                    {trx.dueDate && (
                      <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 font-medium">
                        {t('Tempo:')} {formatDate(trx.dueDate)}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${trx.categoryId === 'inc_terima_pinjaman' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {trx.categoryId === 'inc_terima_pinjaman' ? '+' : '-'} {formatCurrency(trx.amount)}
                    </p>
                    <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-1">
                      {trx.categoryId === 'inc_terima_pinjaman' ? t('Pinjam') : t('Bayar')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Card Piutang */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex-col transition-colors duration-200 ${activeTab === 'piutang' ? 'flex' : 'hidden md:flex'}`}
        >
          <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 bg-emerald-50/30 dark:bg-emerald-500/5 transition-colors duration-200">
            <h3 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ArrowUpRight className="text-emerald-500 dark:text-emerald-400" size={18} />
              {t('Daftar Piutang')}
            </h3>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">{t('Uang yang harus Anda terima')}</p>
            <div className="mt-3 md:mt-4">
              <p className="text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400">{t('Total Piutang')}</p>
              <p className="text-2xl md:text-3xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
                {formatCurrency(totalPiutang)}
              </p>
            </div>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 flex-1 overflow-y-auto max-h-[500px]">
            {(piutangTransactions || []).length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">{t('Belum ada catatan piutang.')}</div>
            ) : (
              piutangTransactions.map(trx => (
                <div 
                  key={trx.id} 
                  onClick={() => setSelectedTransactionId(trx.id)}
                  className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{getContactName(trx.contactId)}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                      <Calendar size={12} /> {formatDate(trx.date)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{trx.description}</p>
                    {trx.dueDate && (
                      <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 font-medium">
                        {t('Tempo:')} {formatDate(trx.dueDate)}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${trx.categoryId === 'exp_kasih_pinjaman' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {trx.categoryId === 'exp_kasih_pinjaman' ? '+' : '-'} {formatCurrency(trx.amount)}
                    </p>
                    <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-1">
                      {trx.categoryId === 'exp_kasih_pinjaman' ? t('Beri Pinjaman') : t('Diterima')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
