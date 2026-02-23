import { useState, KeyboardEvent, useEffect } from 'react';
import { motion } from 'motion/react';
import { Send, Sparkles } from 'lucide-react';

interface AIInputProps {
  onCommand: (command: string) => void;
  isLoading: boolean;
  lastReply?: string;
  inline?: boolean;
}

const CHIPS = [
  "Find 13 users", "List 13 shops", "Show 13 offers", "Team members", "Issue invoice", "Improve code"
];

export default function AIInput({ onCommand, isLoading, lastReply, inline }: AIInputProps) {
  const [input, setInput] = useState('');
  const [isFlashing, setIsFlashing] = useState(false);

  useEffect(() => {
    if (lastReply) {
      setIsFlashing(true);
      const timer = setTimeout(() => setIsFlashing(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [lastReply]);

  const handleSubmit = (val?: string) => {
    const command = val || input;
    if (command.trim() && !isLoading) {
      onCommand(command);
      setInput('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  const containerClasses = inline 
    ? "w-full" 
    : "fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-50";

  return (
    <div className={containerClasses}>
      <div className="flex flex-col gap-2">
        <motion.div 
          initial={{ y: inline ? 0 : 20, opacity: 0 }}
          animate={{ 
            y: 0, 
            opacity: 1,
            scale: isFlashing ? 1.05 : 1,
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 10 }}
          className="relative group"
        >
          {lastReply && !inline && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute -top-12 left-0 right-0 text-center text-electric-blue text-sm font-bold tracking-tight text-glow-blue"
            >
              {lastReply}
            </motion.div>
          )}
          
          <div className={`flex items-center ${inline ? 'bg-transparent border-none px-2 py-1' : 'bg-black/80 backdrop-blur-xl border px-6 py-4 shadow-2xl'} rounded-full transition-all ${
            !inline && (isFlashing ? 'border-electric-blue glow-blue' : 'border-white/10 group-focus-within:border-electric-blue/30 group-focus-within:glow-blue')
          }`}>
            <Sparkles className={`w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-4 shrink-0 ${isLoading || isFlashing ? 'animate-pulse text-electric-blue' : 'text-white/40'}`} />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tell Astranov what you need..."
              className="flex-1 w-full min-w-0 bg-transparent border-none outline-none text-white placeholder:text-white/20 font-light tracking-wide text-sm sm:text-base"
              disabled={isLoading}
            />
            <button 
              onClick={() => handleSubmit()}
              disabled={isLoading || !input.trim()}
              className="ml-2 sm:ml-4 p-1 shrink-0 rounded-full hover:bg-white/10 transition-colors disabled:opacity-20"
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>
          </div>
        </motion.div>
      </div>
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
