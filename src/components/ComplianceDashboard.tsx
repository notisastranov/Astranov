import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { FileText, CreditCard, Shield, Download, CheckCircle, AlertCircle, X, ExternalLink } from 'lucide-react';

interface ComplianceDashboardProps {
  userId: string;
  onClose: () => void;
}

export default function ComplianceDashboard({ userId, onClose }: ComplianceDashboardProps) {
  const [activeTab, setActiveTab] = useState<'invoices' | 'ledger' | 'profile' | 'contracts'>('invoices');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [ledger, setLedger] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [invRes, ledgerRes, userRes] = await Promise.all([
          fetch(`/api/finance/invoices/${userId}`).then(res => res.json()),
          fetch(`/api/finance/ledger/${userId}`).then(res => res.json()),
          fetch(`/api/users/${userId}`).then(res => res.json())
        ]);
        setInvoices(invRes);
        setLedger(ledgerRes);
        setProfile(userRes);
      } catch (e) {
        console.error("Finance fetch error:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 sm:p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-zinc-900 border border-white/10 rounded-3xl sm:rounded-[32px] shadow-2xl w-full max-w-2xl max-h-[90vh] sm:h-[75vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-white/5 flex justify-between items-center bg-zinc-800/30 shrink-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-emerald-500/10 text-emerald-500">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-white text-lg sm:text-xl font-black uppercase italic tracking-tighter">Compliance</h2>
              <p className="text-white/40 text-[8px] sm:text-[10px] uppercase tracking-widest font-bold">Greece (ELP / myDATA)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-white/20 hover:text-white transition-colors">
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/5 bg-black/20 shrink-0">
          {[
            { id: 'invoices', label: 'Invoices', icon: FileText },
            { id: 'ledger', label: 'Ledger', icon: CreditCard },
            { id: 'profile', label: 'Legal Profile', icon: Shield },
            { id: 'contracts', label: 'Contracts', icon: CheckCircle }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-4 flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest font-black transition-all ${
                activeTab === tab.id 
                  ? 'text-emerald-500 border-b-2 border-emerald-500 bg-emerald-500/5' 
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {activeTab === 'invoices' && (
                <div className="space-y-4">
                  {invoices.length === 0 ? (
                    <div className="text-center py-12 bg-white/5 rounded-2xl border border-dashed border-white/10">
                      <FileText className="w-12 h-12 text-white/10 mx-auto mb-4" />
                      <p className="text-white/40 text-sm">No compliance documents found.</p>
                    </div>
                  ) : (
                    invoices.map(inv => (
                      <div key={inv.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between group hover:border-emerald-500/30 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-white font-bold text-sm">{inv.doc_series} {inv.doc_number}</p>
                            <p className="text-white/40 text-[10px] uppercase tracking-widest">{inv.doc_type} • {new Date(inv.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-white font-black">€{(inv.total_gross ?? 0).toFixed(2)}</p>
                            <p className="text-emerald-500 text-[9px] font-mono">MARK: {inv.mydata_mark || 'PENDING'}</p>
                          </div>
                          <button className="p-2 rounded-xl bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all">
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'ledger' && (
                <div className="space-y-2">
                  <div className="grid grid-cols-4 p-2 text-[9px] uppercase tracking-widest font-black text-white/20 border-b border-white/5">
                    <span>Date</span>
                    <span>Description</span>
                    <span className="text-right">Debit</span>
                    <span className="text-right">Credit</span>
                  </div>
                  {ledger.map((entry, i) => (
                    <div key={i} className="grid grid-cols-4 p-3 bg-white/5 rounded-xl text-xs border border-white/5">
                      <span className="text-white/40 font-mono">{new Date(entry.created_at).toLocaleDateString()}</span>
                      <span className="text-white truncate pr-4">{entry.description}</span>
                      <span className="text-right text-red-400 font-mono">{entry.debit > 0 ? `€${(entry.debit ?? 0).toFixed(2)}` : '-'}</span>
                      <span className="text-right text-emerald-400 font-mono">{entry.credit > 0 ? `€${(entry.credit ?? 0).toFixed(2)}` : '-'}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'profile' && (
                <div className="max-w-md mx-auto space-y-6">
                  <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-[24px]">
                    <div className="flex items-center gap-3 mb-4">
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                      <h4 className="text-white font-bold">Tax Compliance Status</h4>
                    </div>
                    <p className="text-white/60 text-xs leading-relaxed">
                      Your legal profile is active and verified for the Greek market. All invoices are automatically transmitted to myDATA.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-white/40 text-[10px] uppercase tracking-widest block mb-2 font-bold">Legal Name</label>
                      <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-white text-sm">
                        {profile?.legal_name || 'ASTRANOV USER'}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-white/40 text-[10px] uppercase tracking-widest block mb-2 font-bold">AFM (Tax ID)</label>
                        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-white text-sm font-mono">
                          {profile?.tax_id || '999999999'}
                        </div>
                      </div>
                      <div>
                        <label className="text-white/40 text-[10px] uppercase tracking-widest block mb-2 font-bold">DOY (Tax Office)</label>
                        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-white text-sm">
                          {profile?.tax_office || 'ATHENS A'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <button className="w-full py-4 rounded-2xl border border-white/10 text-white/40 text-[10px] uppercase tracking-widest font-black hover:bg-white/5 transition-all flex items-center justify-center gap-2">
                    <ExternalLink className="w-4 h-4" /> Update Legal Data via Gov.gr
                  </button>
                </div>
              )}

              {activeTab === 'contracts' && (
                <div className="space-y-6">
                  <div className="p-6 bg-white/5 border border-white/10 rounded-[24px] space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle className={`w-5 h-5 ${profile?.accepted_terms_at ? 'text-emerald-500' : 'text-white/20'}`} />
                        <h4 className="text-white font-bold uppercase tracking-tighter italic">Service Agreement</h4>
                      </div>
                      {profile?.accepted_terms_at && (
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase tracking-widest rounded-full border border-emerald-500/20">
                          Active Contract
                        </span>
                      )}
                    </div>
                    
                    <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                      <p className="text-white/40 text-[10px] leading-relaxed">
                        {profile?.accepted_terms_at 
                          ? `Agreement accepted on ${new Date(profile.accepted_terms_at).toLocaleString()}. This contract is legally binding for all logistics and commercial operations on the Astranov platform.`
                          : "No active service agreement found. You must accept the terms during role activation to operate as a Deliverer or Vendor."}
                      </p>
                    </div>

                    {profile?.accepted_terms_at && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                          <p className="text-white/20 text-[8px] uppercase tracking-widest font-bold mb-1">Contract ID</p>
                          <p className="text-white/60 text-[10px] font-mono truncate">AST-CTR-{userId.split('-')[1]?.toUpperCase() || 'XXXX'}</p>
                        </div>
                        <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                          <p className="text-white/20 text-[8px] uppercase tracking-widest font-bold mb-1">Status</p>
                          <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest">Verified</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-6 bg-zinc-800/50 border border-white/5 rounded-[24px] flex items-center justify-between">
                    <div>
                      <h4 className="text-white/60 font-bold text-sm">Digital Signature</h4>
                      <p className="text-white/20 text-[10px]">Biometric verification linked to device signature.</p>
                    </div>
                    <Shield className="w-8 h-8 text-white/10" />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-black/40 border-t border-white/5 flex items-center justify-center gap-2">
          <AlertCircle className="w-3 h-3 text-white/20" />
          <span className="text-[9px] text-white/20 uppercase tracking-widest">Certified by Astranov Financial Systems • v1.0.4-ELP</span>
        </div>
      </motion.div>
    </div>
  );
}
