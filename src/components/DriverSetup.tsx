import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Truck, Shield, FileText, X, CheckCircle2 } from 'lucide-react';

interface DriverSetupProps {
  onComplete: (details: { vehicle: string; insurance: string }) => void;
  onCancel: () => void;
}

export default function DriverSetup({ onComplete, onCancel }: DriverSetupProps) {
  const [step, setStep] = useState(1);
  const [agreed, setAgreed] = useState(false);
  const [details, setDetails] = useState({ vehicle: '', insurance: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) setStep(2);
    else onComplete(details);
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-zinc-900 border border-white/10 rounded-[40px] w-full max-w-xl overflow-hidden shadow-2xl"
      >
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-zinc-800/30">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-electric-blue/10 text-electric-blue">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-white text-xl font-black uppercase italic tracking-tighter">Driver Activation</h2>
              <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Step {step} of 2</p>
            </div>
          </div>
          <button onClick={onCancel} className="p-2 text-white/20 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {step === 1 ? (
            <div className="space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
                <div className="flex items-center gap-3 text-white/60">
                  <FileText className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">Service Agreement</span>
                </div>
                <div className="h-40 overflow-y-auto text-white/40 text-xs leading-relaxed font-light pr-4 scrollbar-thin scrollbar-thumb-white/10">
                  By activating the Driver role, you agree to comply with all local transportation laws and regulations. You must maintain valid insurance and a clean driving record. Astranov takes a 30% commission on all delivery fees. You are responsible for the safety and integrity of all packages handled.
                </div>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div 
                    onClick={() => setAgreed(!agreed)}
                    className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                      agreed ? 'bg-electric-blue border-electric-blue' : 'border-white/20 group-hover:border-white/40'
                    }`}
                  >
                    {agreed && <CheckCircle2 className="w-4 h-4 text-black" />}
                  </div>
                  <span className="text-white/60 text-xs font-medium">I agree to the terms and conditions</span>
                </label>
              </div>
              <button 
                disabled={!agreed}
                className="w-full bg-electric-blue text-black font-black py-4 rounded-2xl uppercase tracking-widest text-sm disabled:opacity-20 transition-all glow-blue"
              >
                Continue
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-white/40 text-[10px] uppercase tracking-widest block mb-2 font-bold">Vehicle Details (Model, Plate)</label>
                  <input 
                    required 
                    value={details.vehicle}
                    onChange={e => setDetails({...details, vehicle: e.target.value})}
                    className="w-full bg-black hover:bg-black focus:bg-black border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-electric-blue/50 transition-all"
                    placeholder="e.g. Tesla Model 3 - ABC 123"
                  />
                </div>
                <div>
                  <label className="text-white/40 text-[10px] uppercase tracking-widest block mb-2 font-bold">Insurance Policy Number</label>
                  <input 
                    required 
                    value={details.insurance}
                    onChange={e => setDetails({...details, insurance: e.target.value})}
                    className="w-full bg-black hover:bg-black focus:bg-black border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-electric-blue/50 transition-all"
                    placeholder="e.g. POL-99887766"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 bg-white/5 text-white font-bold py-4 rounded-2xl uppercase tracking-widest text-xs hover:bg-white/10 transition-all"
                >
                  Back
                </button>
                <button 
                  className="flex-2 bg-electric-blue text-black font-black py-4 rounded-2xl uppercase tracking-widest text-sm transition-all glow-blue"
                >
                  Complete Activation
                </button>
              </div>
            </div>
          )}
        </form>
      </motion.div>
    </div>
  );
}
