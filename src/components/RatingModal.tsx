import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Star, X, ShieldCheck } from 'lucide-react';

interface RatingModalProps {
  targetId: string;
  targetName: string;
  targetType: 'user' | 'shop';
  raterId: string;
  onClose: () => void;
}

export default function RatingModal({ targetId, targetName, targetType, raterId, onClose }: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hover, setHover] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0 || isLoading) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: Math.random().toString(36).substr(2, 9),
          rater_id: raterId,
          target_id: targetId,
          target_type: targetType,
          rating,
          comment
        })
      });
      if (res.ok) onClose();
    } catch (err) {
      console.error("Failed to submit rating:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-[32px] overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center text-yellow-500">
              <Star className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-tight">Rate {targetType === 'shop' ? 'Establishment' : 'Operative'}</h3>
              <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Performance Evaluation</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all text-white/40 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 flex flex-col items-center gap-8">
          <div className="text-center">
            <p className="text-lg font-black text-white mb-1">{targetName}</p>
            <div className="flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest">Verified Target</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(star)}
                className="p-1 transition-all active:scale-90"
              >
                <Star 
                  className={`w-10 h-10 ${
                    (hover || rating) >= star 
                      ? 'fill-yellow-500 text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]' 
                      : 'text-white/10'
                  } transition-all duration-200`} 
                />
              </button>
            ))}
          </div>

          <div className="w-full">
            <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-2 ml-1">Comments (Optional)</p>
            <textarea 
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Provide detailed feedback..."
              className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-yellow-500/50 transition-all min-h-[100px] resize-none"
            />
          </div>

          <button 
            onClick={handleSubmit}
            disabled={rating === 0 || isLoading}
            className="w-full bg-yellow-500 text-black font-black py-4 rounded-2xl uppercase tracking-[0.2em] text-xs hover:bg-white transition-all active:scale-95 disabled:opacity-50"
          >
            Submit Evaluation
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
