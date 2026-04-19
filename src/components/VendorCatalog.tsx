import React, { useState } from 'react';
import { PackageSearch, X, Image as ImageIcon, Upload, Package, Database, Trash2, Droplets, Thermometer, Hourglass } from 'lucide-react';
import { Product } from '../types';

interface Props {
    catalog: Product[];
    onSave: (p: Product) => void;
    onRemove: (id: number) => void;
    onClose: () => void;
}

export default function VendorCatalog({ catalog, onSave, onRemove, onClose }: Props) {
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [volume, setVolume] = useState("");
    const [temp, setTemp] = useState("");
    const [life, setLife] = useState("");
    const [image, setImage] = useState<string | null>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => setImage(event.target?.result as string);
        reader.readAsDataURL(file);
    };

    const handleRegister = () => {
        if (!name || !price) return;
        onSave({
            id: Date.now(),
            name,
            price,
            volume: Number(volume) || 0,
            temp: Number(temp) || 20,
            life: Number(life) || 30,
            image: image || `https://picsum.photos/seed/${name}/200/200`
        });
        
        // Reset
        setName(""); setPrice(""); setVolume(""); setTemp(""); setLife(""); setImage(null);
    };

    return (
        <div id="overlay" className="active" onClick={onClose}>
            <div className="modal active max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="w-full hud-glass hud-border rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-hud-blue/20 to-transparent flex justify-between items-center">
                        <h3 className="font-orbitron tracking-widest text-hud-blue flex items-center gap-2 text-sm uppercase">
                            <PackageSearch className="w-4 h-4" /> Vendor Product Catalog
                        </h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6 space-y-8 hide-scrollbar">
                        <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
                            <h4 className="text-[10px] font-mono text-gray-400 uppercase tracking-widest border-b border-white/10 pb-2">Initialize New Asset</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <input placeholder="Product Name" value={name} onChange={e => setName(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-hud-blue/50" />
                                <input placeholder="Valuation (ASTR)" type="number" value={price} onChange={e => setPrice(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-hud-blue/50" />
                            </div>
                            
                            <div className="grid grid-cols-3 gap-3">
                                <input placeholder="Vol (L)" type="number" value={volume} onChange={e => setVolume(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-hud-blue/50" />
                                <input placeholder="Temp (℃)" type="number" value={temp} onChange={e => setTemp(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-hud-blue/50" />
                                <input placeholder="Life (D)" type="number" value={life} onChange={e => setLife(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-hud-blue/50" />
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-lg bg-black/60 border border-dashed border-white/20 flex items-center justify-center overflow-hidden">
                                    {image ? <img src={image} className="w-full h-full object-cover" /> : <ImageIcon className="w-5 h-5 text-gray-600" />}
                                </div>
                                <label className="flex-1">
                                    <span className="bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-[10px] text-gray-300 px-4 py-2 rounded-lg cursor-pointer flex items-center justify-center gap-2 uppercase tracking-widest">
                                        <Upload className="w-3 h-3" /> Select File
                                    </span>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                </label>
                            </div>

                            <button onClick={handleRegister} className="hud-button w-full py-2.5">REGISTER PRODUCT DATA</button>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-[10px] font-mono text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Database className="w-3 h-3" /> Current Asset Registry
                            </h4>
                            <div className="space-y-3">
                                {catalog.length === 0 ? (
                                    <div className="text-center py-8 opacity-40">
                                         <Package className="w-8 h-8 mx-auto mb-2" />
                                         <p className="text-[10px] font-mono tracking-widest uppercase">Registry Empty</p>
                                    </div>
                                ) : (
                                    catalog.map(p => (
                                        <div key={p.id} className="bg-black/30 border border-white/5 rounded-xl p-3 flex gap-4 hover:border-hud-blue/30 transition-all group">
                                            <img src={p.image} className="w-16 h-16 rounded-lg bg-black/60 border border-white/10 object-cover" alt={p.name} />
                                            <div className="flex-1 flex flex-col justify-between">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h5 className="text-xs font-bold text-white uppercase tracking-wider">{p.name}</h5>
                                                        <p className="text-[10px] font-orbitron text-hud-blue">{p.price} ASTR</p>
                                                    </div>
                                                    <button onClick={() => onRemove(p.id)} className="text-gray-500 hover:text-red-400 transition-colors">
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-3 text-[8px] font-mono text-gray-400 uppercase">
                                                    <span><Droplets className="w-2.5 h-2.5 inline mr-1 opacity-50" />{p.volume}L</span>
                                                    <span><Thermometer className="w-2.5 h-2.5 inline mr-1 opacity-50" />{p.temp}℃</span>
                                                    <span><Hourglass className="w-2.5 h-2.5 inline mr-1 opacity-50" />{p.life}D</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
