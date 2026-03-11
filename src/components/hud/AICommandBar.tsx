import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Send, Camera, MessageSquare, Volume2, VolumeX, Search, Sparkles } from 'lucide-react';

interface AICommandBarProps {
  onCommand: (command: string) => void;
  isListening: boolean;
  onVoiceToggle: () => void;
  onCameraClick: () => void;
  isVoiceChatActive: boolean;
  onVoiceChatToggle: () => void;
  transcript: string;
  isLoading: boolean;
}

export const AICommandBar: React.FC<AICommandBarProps> = ({
  onCommand,
  isListening,
  onVoiceToggle,
  onCameraClick,
  isVoiceChatActive,
  onVoiceChatToggle,
  transcript,
  isLoading
}) => {
  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (input.trim()) {
      onCommand(input.trim());
      setInput('');
      setIsExpanded(false);
    }
  };

  return (
    <div className="w-full max-w-2xl px-4 pointer-events-auto">
      <motion.div
        layout
        className={`bg-zinc-900/95 backdrop-blur-3xl border border-blue-500/20 rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-300 flex flex-col-reverse`}
      >
        {/* Shield Accent Line */}
        <div className="h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

        <div className="flex items-center h-14 px-2 gap-2">
          {/* LEFT INSIDE: Voice Chat & Camera */}
          <div className="flex items-center gap-1">
            <button
              onClick={onVoiceChatToggle}
              className={`p-2 rounded-xl transition-all ${isVoiceChatActive ? 'bg-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'}`}
              title="Voice Chat Mode"
            >
              {isVoiceChatActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={onCameraClick}
              className="p-2 bg-white/5 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-all"
              title="Camera Search"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          {/* CENTER: Input */}
          <div className="flex-1 relative flex items-center">
            <div className="absolute left-3 pointer-events-none">
              <Sparkles className={`w-3.5 h-3.5 ${isLoading ? 'text-blue-400 animate-pulse' : 'text-white/10'}`} />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setIsExpanded(true)}
              onBlur={() => !input && setIsExpanded(false)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder={isListening ? "Listening..." : "Command AI..."}
              className="w-full bg-white/5 border-none outline-none text-white text-sm font-medium placeholder:text-white/10 pl-9 pr-4 py-2 rounded-xl focus:bg-white/10 transition-all"
            />
          </div>

          {/* RIGHT INSIDE: Send & Mic */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleSubmit()}
              disabled={!input.trim() || isLoading}
              className={`p-2 rounded-xl transition-all ${input.trim() ? 'bg-blue-600 text-white shadow-lg hover:bg-blue-500' : 'bg-white/5 text-white/10 cursor-not-allowed'}`}
            >
              <Send className="w-4 h-4" />
            </button>
            <button
              onClick={onVoiceToggle}
              className={`p-2 rounded-xl transition-all ${isListening ? 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.5)] animate-pulse' : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'}`}
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* EXPANDED AREA: Live Text / AI Response Previews (Expands Upward) */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 py-3 bg-black/20"
            >
              <div className="flex flex-col gap-1">
                <p className="text-[7px] font-black text-blue-400/40 uppercase tracking-widest">STT_UPLINK</p>
                <div className="text-xs text-white/60 min-h-[24px] font-medium italic leading-relaxed">
                  {input || "Awaiting input stream..."}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
