import React from 'react';
import { motion } from 'motion/react';
import { Mic, Send, Sparkles, X } from 'lucide-react';

interface BottomCenterAIBarProps {
  onCommand: (command: string) => void;
  isLoading: boolean;
  lastReply: string | null;
  onClearReply: () => void;
  isListening: boolean;
  onToggleListening: () => void;
  transcript: string;
}

export const BottomCenterAIBar: React.FC<BottomCenterAIBarProps> = ({
  onCommand,
  isLoading,
  lastReply,
  onClearReply,
  isListening,
  onToggleListening,
  transcript,
}) => {
  const [inputValue, setInputValue] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onCommand(inputValue);
      setInputValue('');
    }
  };

  React.useEffect(() => {
    if (transcript) {
      setInputValue(transcript);
    }
  }, [transcript]);

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* AI Reply Bubble */}
      {lastReply && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="relative self-center max-w-lg bg-black/80 backdrop-blur-2xl border border-white/10 p-4 rounded-2xl shadow-2xl"
        >
          <button 
            onClick={onClearReply}
            className="absolute -top-2 -right-2 w-6 h-6 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center border border-white/10 transition-colors"
          >
            <X className="w-3 h-3 text-white/60" />
          </button>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-electric-blue/20 border border-electric-blue/30">
              <Sparkles className="w-4 h-4 text-electric-blue" />
            </div>
            <p className="text-sm text-white/90 leading-relaxed font-medium">
              {lastReply}
            </p>
          </div>
        </motion.div>
      )}

      {/* AI Input Bar */}
      <form 
        onSubmit={handleSubmit}
        className="relative flex items-center gap-2 bg-black/60 backdrop-blur-2xl border border-white/10 p-2 rounded-2xl shadow-2xl group focus-within:border-electric-blue/50 transition-all"
      >
        <div className="flex items-center gap-3 pl-3">
          <Sparkles className={`w-5 h-5 ${isLoading ? 'text-electric-blue animate-pulse' : 'text-white/40'}`} />
        </div>
        
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={isLoading ? "Astranov is processing..." : "Command the platform..."}
          disabled={isLoading}
          className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-white/20 text-sm font-medium py-2"
        />

        <div className="flex items-center gap-1 pr-1">
          <button
            type="button"
            onClick={onToggleListening}
            className={`p-2 rounded-xl transition-all ${isListening ? 'bg-red-500/20 text-red-400 animate-pulse' : 'hover:bg-white/5 text-white/40 hover:text-white'}`}
          >
            <Mic className="w-5 h-5" />
          </button>
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="p-2 rounded-xl bg-electric-blue text-black hover:bg-electric-blue/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(0,210,255,0.3)]"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};
