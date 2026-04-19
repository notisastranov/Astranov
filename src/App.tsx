import React, { useState, useEffect, useRef } from 'react';
import { 
    User, Truck, Store, Wallet, Zap, Globe, Map as MapIcon, 
    Settings, Radio, CreditCard, X, Image as ImageIcon, 
    Upload, Trash2, Package, Search, Thermometer, Droplets, 
    Hourglass, Send, Plus, ChevronUp, Database, FileSpreadsheet,
    Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { sendMessage } from './aiService';
import { Product, ChatMessage, UserState } from './types';
import MapDisplay from './components/MapDisplay';
import HUDCanvas from './components/HUDCanvas';
import VendorCatalog from './components/VendorCatalog';

// Mock/Init Data
const INITIAL_DEMO_PRODUCTS: Product[] = [
    { id: 1, name: "NEURAL PROCESSOR X1", price: "450.00", volume: 0.5, temp: -10, life: 365, image: "https://picsum.photos/seed/nx1/200/200" },
    { id: 2, name: "KRYPTOS COOLANT", price: "25.00", volume: 10, temp: 4, life: 90, image: "https://picsum.photos/seed/coolant/200/200" }
];

export default function App() {
    // --- STATE ---
    const [user, setUser] = useState<UserState>({
        name: "NOTIS ASTRANOV",
        credits: 1024,
        roles: { client: true, driver: false, vendor: false }
    });
    const [catalog, setCatalog] = useState<Product[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: 1, text: "ASTRANOV OS v5.0 INITIALIZED. NEURAL LINK SECURE. STANDING BY.", isUser: false, timestamp: new Date() }
    ]);
    const [activeModal, setActiveModal] = useState<string | null>(null);
    const [isNightMode, setIsNightMode] = useState(false);
    const [chatInput, setChatInput] = useState("");
    const [isComposerExpanded, setIsComposerExpanded] = useState(false);

    // --- REFS ---
    const chatEndRef = useRef<HTMLDivElement>(null);

    // --- EFFECTS ---
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // --- HANDLERS ---
    const handleSendMessage = async () => {
        if (!chatInput.trim()) return;
        
        const newUserMsg: ChatMessage = {
            id: Date.now(),
            text: chatInput,
            isUser: true,
            timestamp: new Date()
        };
        
        setMessages(prev => [...prev, newUserMsg]);
        setChatInput("");
        
        // AI Response
        const response = await sendMessage(chatInput, messages.map(m => ({
            role: m.isUser ? "user" : "assistant",
            parts: [{ text: m.text }]
        })));
        
        const botMsg: ChatMessage = {
            id: Date.now() + 1,
            text: response || "ERROR: NEURAL LINK INTERRUPTED.",
            isUser: false,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, botMsg]);
    };

    const loadDemoData = () => {
        setCatalog(INITIAL_DEMO_PRODUCTS);
        setUser(prev => ({
            ...prev,
            roles: { client: true, driver: true, vendor: true },
            driverDetails: { callsign: "STORM-1", registryId: "ASTR-99" }
        }));
        setMessages(prev => [...prev, {
            id: Date.now(),
            text: "DEMO PROTOCOL ACTIVE. ASSETS REGISTERED. CREDENTIALS SYNCED. SYSTEM MAP RECALIBRATED.",
            isUser: false,
            timestamp: new Date()
        }]);
        setActiveModal(null);
    };

    return (
        <div className={`relative h-screen w-screen bg-space selection:bg-hud-blue/30 ${isNightMode ? 'night-mode' : ''}`}>
            {/* Background Grid & FX */}
            <div className="absolute inset-0 scanline pointer-events-none" />
            
            {/* TOP BAR / LOGO */}
            <header className="absolute top-8 left-8 z-50 pointer-events-auto">
                <div className="flex flex-col">
                    <h1 className="text-4xl font-orbitron font-bold text-white tracking-widest leading-none">
                        ASTRA<span className="text-hud-blue drop-shadow-[0_0_10px_#00f2ff]">NOV</span>
                    </h1>
                    <div className="flex items-center gap-2 mt-2">
                        <div className="w-8 h-[2px] bg-hud-blue" />
                        <span className="text-xs font-mono text-hud-blue uppercase tracking-tighter opacity-70">Orbital Logistics Hub</span>
                    </div>
                    
                    <button 
                        onClick={() => setActiveModal('profile')}
                        className="mt-6 flex items-center gap-3 p-1 pr-4 bg-black/40 border border-white/10 rounded-full hover:border-hud-blue/50 transition-all group"
                    >
                        <img src="https://picsum.photos/seed/astranov-user/200/200" alt="Profile" className="w-10 h-10 rounded-full border border-hud-blue/50" />
                        <div className="text-left">
                            <div className="text-[10px] font-mono text-gray-500 uppercase tracking-tighter">Command Unit</div>
                            <div className="text-xs font-bold text-white group-hover:text-hud-blue transition-colors">NOTIS ASTRANOV</div>
                        </div>
                    </button>
                </div>
            </header>

            {/* MAIN MAP AREA */}
            <main className="h-full w-full">
                <MapDisplay />
            </main>

            {/* HUD / CLOCK overlay */}
            <HUDCanvas />

            {/* GADGETS */}
            <div className="absolute top-1/2 right-4 -translate-y-1/2 z-40 flex flex-col gap-4">
                <button 
                    title="Night Mode"
                    className="hud-button h-12 w-12 flex items-center justify-center rounded-lg" 
                    onClick={() => setIsNightMode(!isNightMode)}
                >
                    {isNightMode ? <Settings className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                </button>
                <button 
                    title="Demo Protocol"
                    className="hud-button h-12 w-12 flex items-center justify-center rounded-lg border-hud-blue group" 
                    onClick={loadDemoData}
                >
                    <Database className="w-5 h-5 text-hud-blue group-hover:text-space" />
                </button>
            </div>

            {/* COMPOSER / CHAT */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-2xl z-[60] px-4">
                <motion.div 
                    initial={false}
                    animate={{ height: isComposerExpanded ? '400px' : '65px' }}
                    className="hud-glass hud-border rounded-2xl overflow-hidden flex flex-col"
                >
                    <div 
                        className="h-2 w-full flex items-center justify-center cursor-pointer group pt-1"
                        onClick={() => setIsComposerExpanded(!isComposerExpanded)}
                    >
                        <div className="h-1 w-12 bg-white/20 rounded-full group-hover:bg-hud-blue/50 transition-colors" />
                    </div>
                    
                    <div className="flex flex-col h-full px-4 pb-4 overflow-hidden mt-1">
                        <div className="flex-1 overflow-y-auto mb-4 hide-scrollbar space-y-3 pt-2">
                            {messages.map(msg => (
                                <div key={msg.id} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-3 rounded-xl text-xs font-mono tracking-tight shadow-lg ${
                                        msg.isUser 
                                        ? 'bg-hud-blue/15 border border-hud-blue/30 text-hud-blue' 
                                        : 'bg-white/5 border border-white/10 text-gray-300'
                                    }`}>
                                        {!msg.isUser && <span className="block text-[8px] opacity-40 mb-1 uppercase tracking-widest">Neural Response</span>}
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>
                        
                        <div className="flex gap-3 items-center bg-black/60 p-2.5 rounded-xl border border-white/10 focus-within:border-hud-blue/50 transition-colors">
                            <input 
                                value={chatInput}
                                onChange={e => setChatInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                                className="flex-1 bg-transparent border-none outline-none text-sm font-mono text-white placeholder:text-gray-600 px-2"
                                placeholder="ISSUE COMMAND OR TYPE VECTOR..."
                            />
                            <button onClick={handleSendMessage} className="hud-button rounded-lg px-3 py-1.5 flex items-center justify-center">
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* MODALS */}
            <AnimatePresence>
                {activeModal === 'profile' && (
                    <div id="overlay" className="active" onClick={() => setActiveModal(null)}>
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="modal active" 
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="w-full max-w-sm hud-glass hud-border rounded-2xl overflow-hidden flex flex-col shadow-2xl">
                                <div className="p-6 border-b border-white/10 bg-gradient-to-br from-hud-blue/10 to-transparent">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-16 h-16 rounded-full border-2 border-hud-blue shadow-[0_0_20px_#00f2ff] overflow-hidden">
                                            <img src="https://picsum.photos/seed/astranov-user/200/200" alt="Profile" className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <h2 className="font-orbitron font-bold text-xl text-white tracking-widest">NOTIS ASTRANOV</h2>
                                            <span className="text-xs font-mono text-hud-blue tracking-tighter opacity-70 uppercase mt-0.5 block font-bold">Satellite Commander</span>
                                        </div>
                                    </div>
                                    <div className="bg-hud-blue/5 rounded-xl p-4 border border-hud-blue/20 flex justify-between items-center shadow-inner">
                                        <div className="flex items-center gap-2">
                                            <Wallet className="w-4 h-4 text-hud-blue/60" />
                                            <span className="text-xs font-mono text-hud-blue/60 uppercase font-bold tracking-widest">Credits</span>
                                        </div>
                                        <span className="font-orbitron font-bold text-hud-blue text-lg">{user.credits} ASTR</span>
                                    </div>
                                </div>

                                <div className="p-6 space-y-6">
                                    <div className="space-y-4">
                                        <h3 className="text-[10px] font-mono text-gray-500 tracking-[.35em] mb-4 uppercase font-bold">Neural Link Profiles</h3>
                                        
                                        <RoleToggle 
                                            icon={<User className="w-4 h-4" />} 
                                            label="CLIENT PROTOCOL" 
                                            checked={user.roles.client}
                                            onChange={val => setUser({...user, roles: {...user.roles, client: val}})}
                                        />
                                        <RoleToggle 
                                            icon={<Truck className="w-4 h-4" />} 
                                            label="LOGISTICS UNIT" 
                                            checked={user.roles.driver}
                                            onChange={val => setUser({...user, roles: {...user.roles, driver: val}})}
                                        />
                                        <RoleToggle 
                                            icon={<Store className="w-4 h-4" />} 
                                            label="MERCHANT NODE" 
                                            checked={user.roles.vendor}
                                            onChange={val => setUser({...user, roles: {...user.roles, vendor: val}})}
                                        />
                                    </div>

                                    {user.roles.vendor && (
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="space-y-3 bg-hud-blue/5 p-4 rounded-xl border border-hud-blue/20"
                                        >
                                            <h4 className="text-[9px] font-mono text-hud-blue uppercase font-bold tracking-widest">Vendor Data Sync</h4>
                                            <div className="grid grid-cols-2 gap-3">
                                                <button className="hud-button flex items-center justify-center gap-2 py-2.5 text-[10px]">
                                                    <FileSpreadsheet className="w-4 h-4" /> SHEETS
                                                </button>
                                                <button className="hud-button flex items-center justify-center gap-2 py-2.5 text-[10px]" onClick={() => setActiveModal('catalog')}>
                                                    <Package className="w-4 h-4" /> CATALOG
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>

                                <div className="p-5 bg-black/40 border-t border-white/5 text-center">
                                    <button className="hud-button w-full py-3.5 text-sm" onClick={() => setActiveModal(null)}>INITIALIZE SYNC</button>
                                    <p className="text-[8px] text-gray-700 font-mono mt-4 uppercase tracking-[.5em] font-bold">&copy; 2026 NOTIS ASTRANOV - ALL RIGHTS RESERVED.</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {activeModal === 'catalog' && (
                    <VendorCatalog 
                        catalog={catalog}
                        onSave={p => setCatalog([...catalog, p])}
                        onRemove={id => setCatalog(catalog.filter(p => p.id !== id))}
                        onClose={() => setActiveModal(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function RoleToggle({ icon, label, checked, onChange }: { icon: React.ReactNode, label: string, checked: boolean, onChange: (v: boolean) => void }) {
    return (
        <div className="flex items-center justify-between group cursor-pointer" onClick={() => onChange(!checked)}>
            <div className={`flex items-center gap-4 transition-colors ${checked ? 'text-hud-blue' : 'text-gray-500'}`}>
                <div className={`p-2 rounded-lg border transition-all ${checked ? 'bg-hud-blue/20 border-hud-blue shadow-[0_0_10px_rgba(0,242,255,0.2)]' : 'bg-white/5 border-white/10'}`}>
                    {icon}
                </div>
                <span className="text-xs font-mono font-bold tracking-widest uppercase">{label}</span>
            </div>
            <div className={`w-10 h-5 rounded-full relative transition-colors ${checked ? 'bg-hud-blue/40' : 'bg-white/10'}`}>
                <motion.div 
                    animate={{ left: checked ? '22px' : '2px' }}
                    className={`absolute top-1 w-3 h-3 rounded-full shadow-md ${checked ? 'bg-hud-blue' : 'bg-gray-600'}`}
                />
            </div>
        </div>
    );
}

