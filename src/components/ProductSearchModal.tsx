import { motion } from 'motion/react';
import { ShoppingCart, X } from 'lucide-react';
import { Product } from '../types';

interface ProductSearchModalProps {
  products: Product[];
  onClose: () => void;
}

export default function ProductSearchModal({ products, onClose }: ProductSearchModalProps) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-6">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-zinc-900 border border-white/10 rounded-3xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h2 className="text-white text-xl font-bold uppercase tracking-widest italic">Search Results</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {products.length === 0 ? (
            <div className="text-center py-20 text-white/20 italic">No products found for your search.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(product => (
                <div key={product.id} className="bg-zinc-800/50 border border-white/5 rounded-2xl overflow-hidden group">
                  <div className="aspect-square relative overflow-hidden">
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                  </div>
                  <div className="p-4">
                    <h3 className="text-white font-bold text-lg mb-1">{product.name}</h3>
                    <p className="text-white/40 text-xs mb-3 line-clamp-2">{product.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-electric-blue font-mono font-bold">${(product.price || 0).toFixed(2)}</span>
                      <button className="bg-electric-blue text-black px-3 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 hover:bg-electric-blue/90 transition-all glow-blue">
                        <ShoppingCart className="w-3 h-3" /> Buy
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
