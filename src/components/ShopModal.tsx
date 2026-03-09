import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingCart, Plus, Minus, Package, Truck, ArrowRight, Store, Star } from 'lucide-react';
import { Shop, Product, Task } from '../types';

interface ShopModalProps {
  shop: Shop | null;
  onClose: () => void;
  onPlaceOrder: (items: any[], fulfillment: any) => void;
  isAuthenticated: boolean;
  onLoginRequired: () => void;
  currentUserId?: string;
}

export default function ShopModal({ shop, onClose, onPlaceOrder, isAuthenticated, onLoginRequired, currentUserId }: ShopModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<{ product: Product, quantity: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState<'menu' | 'checkout'>('menu');

  useEffect(() => {
    if (shop) {
      setIsLoading(true);
      fetch(`/api/shops/${shop.id}/products`)
        .then(res => res.json())
        .then(data => {
          setProducts(data);
          setIsLoading(false);
        })
        .catch(() => setIsLoading(false));
    }
  }, [shop]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map(item => item.product.id === productId ? { ...item, quantity: item.quantity - 1 } : item);
      }
      return prev.filter(item => item.product.id !== productId);
    });
  };

  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const handleCheckout = () => {
    if (!isAuthenticated) {
      onLoginRequired();
      return;
    }

    onPlaceOrder(cart, {
      method: 'delivery',
      mode: 'standard',
      address: 'Current Location (GPS)',
      estimatedArrival: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    });
    setCart([]);
    setStep('menu');
    onClose();
  };

  if (!shop) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-4xl bg-zinc-900 border border-white/10 rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Shop Header */}
          <div className="relative h-48 sm:h-64 shrink-0">
            <img src={shop.image_url} alt={shop.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />
            
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-black/60 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="absolute bottom-6 left-8 right-8">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border border-emerald-500/30">Open</div>
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star className="w-3 h-3 fill-current" />
                      <span className="text-xs font-bold">4.8</span>
                    </div>
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-black text-white uppercase italic tracking-tighter leading-none">{shop.name}</h2>
                  <p className="text-white/60 text-sm mt-2 max-w-md line-clamp-2">{shop.description}</p>
                </div>
                <div className="hidden sm:block text-right">
                  <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Schedule</p>
                  <p className="text-xs text-white font-mono">{shop.schedule}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-hidden flex flex-col sm:flex-row">
            {/* Menu Section */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              {step === 'menu' ? (
                <>
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black text-white uppercase italic tracking-tight flex items-center gap-3">
                      <Package className="w-6 h-6 text-electric-blue" />
                      Available Products
                    </h3>
                    <div className="text-[10px] text-white/40 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/5">
                      {products.length} Items
                    </div>
                  </div>

                  {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="h-32 bg-white/5 rounded-2xl animate-pulse" />
                      ))}
                    </div>
                  ) : products.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {products.map(product => (
                        <div key={product.id} className="group bg-white/5 border border-white/5 rounded-2xl overflow-hidden hover:border-white/20 transition-all flex">
                          <div className="w-24 h-24 sm:w-32 sm:h-32 shrink-0 overflow-hidden">
                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                          </div>
                          <div className="p-4 flex-1 flex flex-col justify-between">
                            <div>
                              <h4 className="text-white font-bold text-sm sm:text-base">{product.name}</h4>
                              <p className="text-white/40 text-[10px] sm:text-xs line-clamp-1 mt-1">{product.description}</p>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-electric-blue font-mono font-bold">${product.price.toFixed(2)}</span>
                              <button 
                                onClick={() => addToCart(product)}
                                className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white hover:bg-electric-blue hover:text-black transition-all"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-white/5 rounded-3xl border border-dashed border-white/10">
                      <Store className="w-12 h-12 text-white/10 mx-auto mb-4" />
                      <p className="text-white/40 text-sm uppercase tracking-widest font-bold">No products listed yet</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-8">
                  <h3 className="text-xl font-black text-white uppercase italic tracking-tight flex items-center gap-3">
                    <Truck className="w-6 h-6 text-emerald-400" />
                    Delivery Details
                  </h3>
                  
                  <div className="space-y-6">
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                      <h4 className="text-[10px] text-white/40 uppercase tracking-widest mb-4">Delivery Address</h4>
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                          <ArrowRight className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-white font-bold">Current Location (GPS)</p>
                          <p className="text-white/40 text-xs mt-1 italic">Your order will be delivered to your current position on the map.</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                      <h4 className="text-[10px] text-white/40 uppercase tracking-widest mb-4">Payment Method</h4>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                            <Star className="w-5 h-5" />
                          </div>
                          <span className="text-white font-bold">Astranov Wallet</span>
                        </div>
                        <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Active</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Cart Sidebar */}
            <div className="w-full sm:w-80 bg-black/40 border-l border-white/5 p-8 flex flex-col">
              <div className="flex items-center gap-3 mb-8">
                <ShoppingCart className="w-5 h-5 text-white/40" />
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Your Order</h3>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 mb-8 custom-scrollbar">
                {cart.length > 0 ? cart.map(item => (
                  <div key={item.product.id} className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-white text-xs font-bold">{item.product.name}</p>
                      <p className="text-white/40 text-[10px]">${(item.product.price * item.quantity).toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1 border border-white/5">
                      <button onClick={() => removeFromCart(item.product.id)} className="w-6 h-6 flex items-center justify-center text-white/40 hover:text-white transition-colors">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-mono text-white min-w-[1rem] text-center">{item.quantity}</span>
                      <button onClick={() => addToCart(item.product)} className="w-6 h-6 flex items-center justify-center text-white/40 hover:text-white transition-colors">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                    <ShoppingCart className="w-12 h-12 mb-4" />
                    <p className="text-[10px] uppercase font-black tracking-widest">Cart Empty</p>
                  </div>
                )}
              </div>

              <div className="space-y-4 pt-8 border-t border-white/5">
                <div className="flex justify-between text-xs">
                  <span className="text-white/40 uppercase tracking-widest">Subtotal</span>
                  <span className="text-white font-mono">${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/40 uppercase tracking-widest">Delivery</span>
                  <span className="text-white font-mono">$5.00</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-sm font-black text-white uppercase tracking-widest">Total</span>
                  <span className="text-xl font-black text-electric-blue font-mono">${(total > 0 ? total + 5 : 0).toFixed(2)}</span>
                </div>

                {step === 'menu' ? (
                  <button 
                    disabled={cart.length === 0}
                    onClick={() => setStep('checkout')}
                    className="w-full bg-white text-black font-black py-4 rounded-2xl uppercase tracking-widest text-[10px] hover:bg-electric-blue transition-all disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    Checkout <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={handleCheckout}
                      className="w-full bg-emerald-500 text-black font-black py-4 rounded-2xl uppercase tracking-widest text-[10px] hover:bg-emerald-400 transition-all flex items-center justify-center gap-2"
                    >
                      Place Order <Truck className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setStep('menu')}
                      className="w-full bg-white/5 text-white/40 font-black py-4 rounded-2xl uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all"
                    >
                      Back to Menu
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
