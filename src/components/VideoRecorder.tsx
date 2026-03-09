import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, X, Video, Square, RefreshCw, Send, Check } from 'lucide-react';

interface VideoRecorderProps {
  isOpen: boolean;
  onClose: () => void;
  onPost: (videoBlob: Blob, description: string) => void;
}

export default function VideoRecorder({ isOpen, onClose, onPost }: VideoRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (isOpen && !recordedBlob) {
      startCamera();
    }
    return () => stopCamera();
  }, [isOpen, recordedBlob]);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const startRecording = () => {
    if (!stream) return;
    chunksRef.current = [];
    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setRecordedBlob(blob);
      setPreviewUrl(URL.createObjectURL(blob));
      stopCamera();
    };
    recorder.start();
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleReset = () => {
    setRecordedBlob(null);
    setPreviewUrl(null);
    setDescription('');
    startCamera();
  };

  const handlePost = () => {
    if (recordedBlob) {
      onPost(recordedBlob, description);
      handleReset();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-zinc-900 border border-white/10 w-full max-w-2xl rounded-[40px] overflow-hidden flex flex-col shadow-2xl"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center">
                <Video className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">Post Video</h2>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto">
            {/* Viewport */}
            <div className="relative aspect-video bg-black rounded-3xl overflow-hidden border border-white/10 shadow-inner">
              {!recordedBlob ? (
                <video 
                  ref={videoRef} 
                  autoPlay 
                  muted 
                  playsInline 
                  className="w-full h-full object-cover"
                />
              ) : (
                <video 
                  src={previewUrl!} 
                  controls 
                  className="w-full h-full object-cover"
                />
              )}

              {/* Recording Overlay */}
              {isRecording && (
                <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-red-500 rounded-full animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-white" />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Recording</span>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-6">
              {!recordedBlob ? (
                <div className="flex justify-center">
                  {!isRecording ? (
                    <button 
                      onClick={startRecording}
                      className="w-20 h-20 rounded-full bg-rose-500 flex items-center justify-center text-white shadow-[0_0_30px_rgba(244,63,94,0.4)] hover:scale-110 transition-transform"
                    >
                      <Video className="w-8 h-8" />
                    </button>
                  ) : (
                    <button 
                      onClick={stopRecording}
                      className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-black shadow-2xl hover:scale-110 transition-transform"
                    >
                      <Square className="w-8 h-8 fill-current" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Caption</label>
                    <textarea 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Tell the network what's happening..."
                      className="w-full h-24 bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-rose-500 transition-all resize-none text-sm"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={handleReset}
                      className="flex-1 bg-white/5 border border-white/10 py-4 rounded-2xl flex items-center justify-center gap-2 text-white/60 hover:text-white hover:bg-white/10 transition-all font-bold uppercase text-xs tracking-widest"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Retake
                    </button>
                    <button 
                      onClick={handlePost}
                      className="flex-[2] bg-rose-500 text-white py-4 rounded-2xl flex items-center justify-center gap-2 font-black uppercase text-xs tracking-widest hover:bg-rose-400 transition-all shadow-[0_0_30px_rgba(244,63,94,0.3)]"
                    >
                      <Send className="w-4 h-4" />
                      Post to Map
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Info */}
          <div className="p-4 bg-black/40 border-t border-white/5 text-center">
            <p className="text-[8px] text-white/20 uppercase tracking-[0.3em] font-bold">
              Astranov Social Engine • Encrypted Video Stream
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
