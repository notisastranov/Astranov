import { useState, KeyboardEvent, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Send, VolumeX, Maximize2, GripHorizontal, Mic } from 'lucide-react';

interface AIInputProps {
  onCommand: (command: string) => void;
  onVoiceClick?: () => void;
  isLoading: boolean;
  isListening?: boolean;
  lastReply?: string;
  externalInput?: string;
}

export default function AIInput({ onCommand, onVoiceClick, isLoading, isListening, lastReply, externalInput }: AIInputProps) {
  const [input, setInput] = useState('');
  const [isFlashing, setIsFlashing] = useState(false);
  const [width, setWidth] = useState(window.innerWidth < 640 ? window.innerWidth * 0.9 : 240);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setWidth(window.innerWidth * 0.9);
      } else {
        setWidth(240);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 200);
      textarea.style.height = `${newHeight}px`;
    }
  };

  useEffect(() => {
    if (externalInput !== undefined) {
      setInput(externalInput);
    }
  }, [externalInput]);

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <motion.div 
        drag
        dragMomentum={false}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-[95vw]"
        style={{ width: Math.min(width, window.innerWidth * 0.95) }}
      >
      <div className="relative group">
        {/* Resize Handle */}
        <div 
          className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-12 cursor-ew-resize hover:bg-electric-blue/20 rounded-full z-20"
          onMouseDown={(e) => {
            const startX = e.clientX;
            const startWidth = width;
            const onMouseMove = (moveEvent: MouseEvent) => {
              const newWidth = Math.max(300, Math.min(1200, startWidth + (moveEvent.clientX - startX) * 2));
              setWidth(newWidth);
            };
            const onMouseUp = () => {
              document.removeEventListener('mousemove', onMouseMove);
              document.removeEventListener('mouseup', onMouseUp);
            };
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
          }}
        />

        <motion.div 
          animate={{ 
            scale: isFlashing ? 1.02 : 1,
          }}
          className="relative flex flex-col gap-2"
        >
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute -top-8 left-0 right-0 text-center text-white/40 text-[10px] font-bold tracking-[0.2em] uppercase pointer-events-none"
            >
              <span className="animate-pulse">Analyzing System Data...</span>
            </motion.div>
          )}

          {lastReply && !isLoading && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-full mb-4 left-0 right-0 bg-black/90 backdrop-blur-md border border-electric-blue/30 rounded-2xl px-4 py-3 text-electric-blue text-sm font-bold tracking-tight text-glow-blue shadow-[0_10px_40px_rgba(0,210,255,0.3)] max-h-48 overflow-y-auto custom-scrollbar"
            >
              <div className="text-center">{lastReply}</div>
            </motion.div>
          )}
          
          <div className={`flex items-center bg-black hover:bg-black focus-within:bg-black border px-4 py-3 rounded-3xl shadow-2xl transition-all ${
            isFlashing ? 'border-electric-blue glow-blue' : 'border-white/10 group-focus-within:border-electric-blue/30 group-focus-within:glow-blue'
          }`}>
            <div className="mr-3 cursor-grab active:cursor-grabbing text-white/20 hover:text-white/40 transition-colors">
              <GripHorizontal className="w-4 h-4" />
            </div>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if ('speechSynthesis' in window) {
                  window.speechSynthesis.cancel();
                }
              }}
              placeholder="Tell Astranov..."
              className="flex-1 w-full min-w-0 bg-transparent border-none outline-none text-white placeholder:text-white/20 font-light tracking-wide text-sm sm:text-base resize-none overflow-y-auto py-1 no-scrollbar"
              style={{ minHeight: '24px', maxHeight: '200px' }}
              rows={1}
              disabled={isLoading}
            />

            <div className="flex items-center gap-2 ml-2">
              {onVoiceClick && (
                <button 
                  onClick={onVoiceClick}
                  disabled={isLoading}
                  className={`p-2 rounded-full transition-all ${
                    isListening 
                      ? 'bg-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]' 
                      : 'text-white/40 hover:text-white hover:bg-white/10'
                  }`}
                  title="Voice Command"
                >
                  <Mic className="w-5 h-5" />
                </button>
              )}

              {('speechSynthesis' in window && window.speechSynthesis.speaking) && (
                <button 
                  onClick={() => window.speechSynthesis.cancel()}
                  className="p-1.5 rounded-full bg-red-500/20 hover:bg-red-500/40 transition-colors border border-red-500/30"
                  title="Stop AI Voice"
                >
                  <VolumeX className="w-4 h-4 text-red-400" />
                </button>
              )}

              <button 
                onClick={() => handleSubmit()}
                disabled={isLoading || !input.trim()}
                className="p-2 shrink-0 rounded-full hover:bg-white/10 transition-colors disabled:opacity-20"
              >
                <Send className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
    </div>
  );
}
