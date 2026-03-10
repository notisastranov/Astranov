import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Youtube, ExternalLink } from 'lucide-react';

interface YouTubePlayerProps {
  videoId: string;
  onClose: () => void;
  title?: string;
}

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ videoId, onClose, title }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
    >
      <div className="relative w-full max-w-4xl aspect-video bg-black rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <button
            onClick={() => window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank')}
            className="p-2 bg-black/50 hover:bg-black/80 text-white/70 hover:text-white rounded-full backdrop-blur-md transition-all border border-white/10"
          >
            <ExternalLink className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="p-2 bg-black/50 hover:bg-black/80 text-white/70 hover:text-white rounded-full backdrop-blur-md transition-all border border-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          title={title || "YouTube video player"}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="w-full h-full"
        />

        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-600">
              <Youtube className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">{title || "Global Broadcast"}</h3>
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Astranov Media Stream</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
