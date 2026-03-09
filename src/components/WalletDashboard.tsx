import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Wallet, ArrowUpRight, ArrowDownLeft, History, Plus, Minus, CreditCard } from 'lucide-react';

interface Transaction {
  id: string;
  amount: number;
  type: 'deposit' | 'withdrawal';
  description: string;
  timestamp: string;
}

interface WalletDashboardProps {
  userId: string;
  balance: number;
  onUpdateBalance: () => void;
}

export default function WalletDashboard({ userId, balance, onUpdateBalance }: WalletDashboardProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, [userId]);

  const fetchTransactions = async () => {
    try {
      const res = await fetch(`/api/transactions/${userId}`);
      const data = await res.json();
      if (Array.isArray(data)) setTransactions(data);
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    }
  };

  const handleTransaction = async (type: 'deposit' | 'withdrawal') => {
    if (!amount || isNaN(Number(amount))) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: Math.random().toString(36).substr(2, 9),
          user_id: userId,
          amount: Number(amount),
          type,
          description: `${type.charAt(0).toUpperCase() + type.slice(1)} via Digital Wallet`
        })
      });
      if (res.ok) {
        setAmount('');
        fetchTransactions();
        onUpdateBalance();
      }
    } catch (err) {
      console.error("Transaction failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      drag
      dragMomentum={false}
      className="flex flex-col gap-6 p-6 bg-black/40 backdrop-blur-xl rounded-[32px] border border-white/10 h-full overflow-hidden cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white uppercase tracking-tight">Digital Wallet</h2>
            <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Secure Asset Management</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest mb-1">Available Balance</p>
          <p className="text-3xl font-black text-emerald-500 tracking-tighter">€{(balance ?? 0).toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
          <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest mb-3">Quick Actions</p>
          <div className="flex flex-col gap-2">
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white font-black focus:outline-none focus:border-emerald-500/50 transition-all"
            />
            <div className="flex gap-2">
              <button 
                onClick={() => handleTransaction('deposit')}
                disabled={isLoading}
                className="flex-1 bg-emerald-500 text-black font-black py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-white transition-all active:scale-95 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" /> Deposit
              </button>
              <button 
                onClick={() => handleTransaction('withdrawal')}
                disabled={isLoading}
                className="flex-1 bg-white/5 text-white border border-white/10 font-black py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 transition-all active:scale-95 disabled:opacity-50"
              >
                <Minus className="w-4 h-4" /> Withdraw
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex flex-col justify-between">
          <div>
            <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest mb-1">Linked Card</p>
            <div className="flex items-center gap-3 text-white/60">
              <CreditCard className="w-5 h-5" />
              <span className="font-mono text-sm">•••• 4421</span>
            </div>
          </div>
          <button className="w-full py-2 border border-white/10 rounded-xl text-[10px] text-white/40 uppercase font-black hover:bg-white/5 transition-all">Manage Methods</button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-4 h-4 text-white/40" />
          <h3 className="text-xs font-black text-white/60 uppercase tracking-widest">Transaction History</h3>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-2">
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-white/20">
              <History className="w-12 h-12 mb-2 opacity-10" />
              <p className="text-xs uppercase font-black tracking-widest">No transactions found</p>
            </div>
          ) : (
            transactions.map(tx => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                key={tx.id} 
                className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tx.type === 'deposit' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                    {tx.type === 'deposit' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-xs font-black text-white">{tx.description}</p>
                    <p className="text-[9px] text-white/40 font-bold uppercase">{new Date(tx.timestamp).toLocaleString()}</p>
                  </div>
                </div>
                <p className={`text-sm font-black ${tx.type === 'deposit' ? 'text-emerald-500' : 'text-red-500'}`}>
                  {tx.type === 'deposit' ? '+' : '-'}€{(tx.amount ?? 0).toFixed(2)}
                </p>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}
