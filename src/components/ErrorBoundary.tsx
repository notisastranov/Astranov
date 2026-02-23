import React, { ErrorInfo } from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    (this as any).state = { hasError: false };
  }

  static getDerivedStateFromError(_: any): any {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('System Error:', error, errorInfo);
  }

  render() {
    if ((this as any).state.hasError) {
      return (
        <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-6 text-center z-[9999]">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
            <span className="text-4xl">⚠️</span>
          </div>
          <h1 className="text-white text-2xl font-black uppercase tracking-tighter italic mb-4">System Anomaly Detected</h1>
          <p className="text-white/40 text-sm max-w-md mb-8">
            Astranov has encountered a critical sequence error. Self-correction protocols initiated.
          </p>
          <button 
            onClick={() => {
              localStorage.clear();
              sessionStorage.clear();
              window.location.href = '/';
            }}
            className="px-8 py-4 bg-[#00d2ff] text-black font-black uppercase tracking-widest rounded-2xl hover:scale-105 transition-all shadow-[0_0_30px_rgba(0,210,255,0.4)]"
          >
            Hard Reboot System
          </button>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
