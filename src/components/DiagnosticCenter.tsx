import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, CheckCircle, AlertTriangle, XCircle, RefreshCw, Zap, ChevronRight, Activity, Terminal } from 'lucide-react';
import { diagnosticService, DiagnosticResult, DiagnosticStatus } from '../services/diagnostics';

export default function DiagnosticCenter({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isFixing, setIsFixing] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'logs' | 'signals'>('status');
  const [simResults, setSimResults] = useState<any[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  const runSimulation = async () => {
    setIsSimulating(true);
    try {
      const res = await fetch('/api/signals/simulation/run');
      const data = await res.json();
      setSimResults(data.results || []);
    } catch (e) {
      console.error("Simulation failed:", e);
    } finally {
      setIsSimulating(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'signals' && simResults.length === 0) {
      runSimulation();
    }
  }, [activeTab]);

  useEffect(() => {
    const unsubscribe = diagnosticService.subscribe(setResults);
    return () => { unsubscribe(); };
  }, []);

  const handleAutoFix = async () => {
    setIsFixing(true);
    await diagnosticService.autoFix();
    setTimeout(() => setIsFixing(false), 1000);
  };

  const getStatusIcon = (status: DiagnosticStatus) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'critical': return <XCircle className="w-4 h-4 text-rose-500" />;
      default: return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
    }
  };

  const overallStatus = results.every(r => r.status === 'healthy') ? 'healthy' : 
                        results.some(r => r.status === 'critical') ? 'critical' : 'warning';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 400 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 400 }}
          className="fixed top-0 right-0 w-96 h-full bg-black/95 border-l border-white/10 z-[3000] backdrop-blur-xl flex flex-col shadow-2xl"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${overallStatus === 'healthy' ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                <Activity className={`w-5 h-5 ${overallStatus === 'healthy' ? 'text-emerald-500' : 'text-rose-500'}`} />
              </div>
              <div>
                <h2 className="text-sm font-black text-white uppercase tracking-widest">Diagnostic Center</h2>
                <p className="text-[10px] text-white/40 uppercase font-bold">Astranov OS Health Monitor</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <XCircle className="w-5 h-5 text-white/40" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/10">
            <button 
              onClick={() => setActiveTab('status')}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${activeTab === 'status' ? 'text-white border-b-2 border-electric-blue bg-white/5' : 'text-white/40 hover:text-white/60'}`}
            >
              System Status
            </button>
            <button 
              onClick={() => setActiveTab('logs')}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${activeTab === 'logs' ? 'text-white border-b-2 border-electric-blue bg-white/5' : 'text-white/40 hover:text-white/60'}`}
            >
              Kernel Logs
            </button>
            <button 
              onClick={() => setActiveTab('signals')}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${activeTab === 'signals' ? 'text-white border-b-2 border-electric-blue bg-white/5' : 'text-white/40 hover:text-white/60'}`}
            >
              Signal Engine
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
            {activeTab === 'status' ? (
              <>
                {results.map((res) => (
                  <motion.div 
                    key={res.id}
                    layout
                    className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(res.status)}
                        <span className="text-[11px] font-black text-white uppercase tracking-tight">{res.name}</span>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        res.status === 'healthy' ? 'bg-emerald-500/10 text-emerald-500' : 
                        res.status === 'warning' ? 'bg-amber-500/10 text-amber-500' : 'bg-rose-500/10 text-rose-500'
                      }`}>
                        {res.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-white/60 mb-3 leading-relaxed">{res.message}</p>
                    
                    {res.onAction && (
                      <button 
                        onClick={res.onAction}
                        className="w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[9px] font-black uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2"
                      >
                        {res.actionLabel || 'Fix Component'}
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </motion.div>
                ))}
              </>
            ) : activeTab === 'logs' ? (
              <div className="font-mono text-[10px] text-emerald-500/80 space-y-1 bg-black/40 p-4 rounded-xl border border-white/5 h-full overflow-y-auto no-scrollbar">
                <p className="text-white/20">[06:15:02] ASTRANOV KERNEL INITIALIZED</p>
                <p>[06:15:03] Loading modules: maps, ai, socket, geo</p>
                <p>[06:15:04] GEMINI_CORE: OK</p>
                <p>[06:15:05] MAPS_ENGINE: OK</p>
                <p className="text-amber-500">[06:15:06] SOCKET_SYNC: RECONNECTING...</p>
                <p>[06:15:07] SOCKET_SYNC: CONNECTED</p>
                <p className="text-white/20">[06:15:10] Memory usage: 42.4MB / 512MB</p>
                <p className="text-white/20">[06:15:12] CPU load: 1.2%</p>
                <p className="text-white/20">[06:15:15] Diagnostic scan complete.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest">Simulation Results</h3>
                  <button 
                    onClick={runSimulation}
                    disabled={isSimulating}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all"
                  >
                    <RefreshCw className={`w-3 h-3 text-white/40 ${isSimulating ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {simResults.map((scenario, idx) => (
                  <div key={idx} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black text-electric-blue uppercase tracking-tight">{scenario.scenarioName}</h4>
                      {scenario.validationErrors.length > 0 ? (
                        <AlertTriangle className="w-3 h-3 text-rose-500" />
                      ) : (
                        <CheckCircle className="w-3 h-3 text-emerald-500" />
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                        <p className="text-[8px] text-white/40 uppercase font-bold">Candidates</p>
                        <p className="text-xs font-black text-white">{scenario.metrics.totalCandidates}</p>
                      </div>
                      <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                        <p className="text-[8px] text-white/40 uppercase font-bold">Rendered</p>
                        <p className="text-xs font-black text-white">{scenario.metrics.finalRenderedCount}</p>
                      </div>
                    </div>

                    {scenario.validationErrors.length > 0 && (
                      <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                        {scenario.validationErrors.map((err: string, i: number) => (
                          <p key={i} className="text-[9px] text-rose-400 font-bold leading-tight">! {err}</p>
                        ))}
                      </div>
                    )}

                    <div className="space-y-2">
                      {scenario.renderedSignals.map((sig: any, i: number) => (
                        <div key={i} className="p-2 bg-white/5 rounded-lg border border-white/5 flex items-center justify-between group">
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold text-white truncate">{sig.title}</p>
                            <p className="text-[8px] text-white/40 uppercase">{sig.type} • Score: {sig.priorityScore.toFixed(1)}</p>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                             <Terminal className="w-3 h-3 text-white/20" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer / Auto-Fix */}
          <div className="p-6 border-t border-white/10 bg-white/5">
            <button 
              onClick={handleAutoFix}
              disabled={isFixing || overallStatus === 'healthy'}
              className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all ${
                overallStatus === 'healthy' 
                  ? 'bg-emerald-500/20 text-emerald-500 cursor-default' 
                  : 'bg-electric-blue text-white hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-electric-blue/20'
              }`}
            >
              {isFixing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Repairing System...
                </>
              ) : overallStatus === 'healthy' ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  System Nominal
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Initiate Auto-Fix
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
