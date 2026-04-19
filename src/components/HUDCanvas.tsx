import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function HUDCanvas() {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (date: Date, isUTC: boolean) => {
        const options: Intl.DateTimeFormatOptions = {
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: false,
            timeZone: isUTC ? 'UTC' : undefined
        };
        return new Intl.DateTimeFormat('en-US', options).format(date);
    };

    const utcSeconds = (time.getUTCHours() * 3600) + (time.getUTCMinutes() * 60) + time.getUTCSeconds();
    const rotation = ((utcSeconds / 86400) * 360) + 180;
    const radius = 82; // Outer bezel radius

    return (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 hidden md:block">
            {/* Main Celestial Bezel */}
            <div className="relative w-[500px] h-[500px] rounded-full border border-hud-blue/10 flex items-center justify-center">
                
                {/* Rotational Layer for Sun/Moon */}
                <div 
                    className="absolute inset-0 transition-transform duration-1000 ease-linear"
                    style={{ transform: `rotate(${rotation}deg)` }}
                >
                    {/* Sun */}
                    <div 
                        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full pb-4"
                        style={{ transform: `rotate(${-rotation}deg)` }}
                    >
                        <Sun className="w-8 h-8 text-hud-blue animate-pulse drop-shadow-[0_0_15px_#00f2ff]" />
                    </div>
                    
                    {/* Moon */}
                    <div 
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full pt-4"
                        style={{ transform: `rotate(${-rotation}deg)` }}
                    >
                        <Moon className="w-8 h-8 text-hud-blue/40 drop-shadow-[0_0_10px_rgba(0,242,255,0.2)]" />
                    </div>
                </div>

                {/* Clock Center */}
                <div className="flex flex-col items-center">
                    <div className="text-2xl font-orbitron font-bold text-white tracking-[.3em] drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                        {formatTime(time, true)} <span className="text-[10px] opacity-40">UTC</span>
                    </div>
                    <div className="text-sm font-mono text-hud-blue tracking-widest opacity-80 mt-1">
                        {formatTime(time, false)} <span className="text-[10px] opacity-40">LOC</span>
                    </div>
                </div>

                {/* Decorative Rings */}
                <div className="absolute inset-10 rounded-full border-t border-hud-blue/20 animate-[spin_20s_linear_infinite]" />
                <div className="absolute inset-12 rounded-full border-b border-hud-blue/10 animate-[spin_30s_linear_infinite_reverse]" />
            </div>
        </div>
    );
}
