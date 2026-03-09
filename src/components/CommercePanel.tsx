import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingCart, Star, Clock, MapPin, Phone, MessageSquare, ChevronRight, CreditCard, Truck, Package, Drone, User } from 'lucide-react';
import { Business, Product, FulfillmentMethod, OrderStatus } from '../types/operational';

interface CommercePanelProps {
  business: Business;
  menu: Product[];
  onClose: () => void;
  onPlaceOrder: (items: any[], fulfillment: any) => void;
}

export default function CommercePanel({ business, menu, onClose, onPlaceOrder }: CommercePanelProps) {
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [step, setStep] = useState<'menu' | 'checkout' | 'payment' | 'status'>('menu');
  const [fulfillment, setFulfillment] = useState<FulfillmentMethod>(FulfillmentMethod.MOTORCYCLE);
  const [address, setAddress] = useState('');

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
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const deliveryFee = fulfillment === FulfillmentMethod.PICKUP ? 0 : 5.00;
  const platformFee = subtotal * 0.05;
  const tax = subtotal * 0.10;
  const total = subtotal + deliveryFee + platformFee + tax;

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      className="fixed top-0 right-0 w-[400px] h-full bg-black/90 backdrop-blur-2xl border-l border-white/10 z-[3000] flex flex-col shadow-2xl"
    >
      {/* Header */}
      <div className="p-6 border-bottom border-white/10 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10">
            <img src={business.image} alt={business.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">{business.name}</h2>
            <div className="flex items-center gap-2 text-[10px] text-white/40 font-black uppercase tracking-widest">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              <span>{business.rating} ({business.reviewCount} reviews)</span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <AnimatePresence mode="wait">
          {step === 'menu' && (
            <motion.div 
              key="menu"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 gap-4">
                {menu.map(product => (
                  <div key={product.id} className="group bg-white/5 border border-white/10 rounded-2xl p-4 hover:border-electric-blue/50 transition-all">
                    <div className="flex gap-4">
                      <div className="w-20 h-20 rounded-xl overflow-hidden border border-white/10 flex-shrink-0">
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-black text-white uppercase tracking-tight">{product.name}</h4>
                        <p className="text-[10px] text-white/40 mb-2 line-clamp-2">{product.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-black text-electric-blue">${product.price.toFixed(2)}</span>
                          <button 
                            onClick={() => addToCart(product)}
                            className="px-3 py-1 bg-white text-black text-[10px] font-black uppercase rounded-full hover:bg-electric-blue hover:text-white transition-all"
                          >
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 'checkout' && (
            <motion.div 
              key="checkout"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.3em]">Fulfillment Method</h3>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: FulfillmentMethod.MOTORCYCLE, icon: Truck, label: 'Moto' },
                    { id: FulfillmentMethod.CAR, icon: Package, label: 'Car' },
                    { id: FulfillmentMethod.DRONE, icon: Drone, label: 'Drone' },
                    { id: FulfillmentMethod.PICKUP, icon: MapPin, label: 'Pickup' },
                  ].map(method => (
                    <button
                      key={method.id}
                      onClick={() => setFulfillment(method.id as FulfillmentMethod)}
                      className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                        fulfillment === method.id 
                        ? 'bg-electric-blue border-electric-blue text-white' 
                        : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
                      }`}
                    >
                      <method.icon className="w-5 h-5" />
                      <span className="text-[10px] font-black uppercase">{method.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {fulfillment !== FulfillmentMethod.PICKUP && (
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.3em]">Delivery Address</h3>
                  <input 
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter your address..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-electric-blue transition-all"
                  />
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.3em]">Order Summary</h3>
                <div className="space-y-2">
                  {cart.map(item => (
                    <div key={item.product.id} className="flex justify-between text-xs">
                      <span className="text-white/60">{item.quantity}x {item.product.name}</span>
                      <span className="text-white font-mono">${(item.product.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-white/10 bg-white/5">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] text-white/40 uppercase font-black tracking-widest">
              <span>Subtotal</span>
              <span className="text-white font-mono">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[10px] text-white/40 uppercase font-black tracking-widest">
              <span>Delivery Fee</span>
              <span className="text-white font-mono">${deliveryFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[10px] text-white/40 uppercase font-black tracking-widest">
              <span>Platform Fee</span>
              <span className="text-white font-mono">${platformFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-white uppercase tracking-tight pt-2 border-t border-white/5">
              <span>Total</span>
              <span className="text-electric-blue font-mono">${total.toFixed(2)}</span>
            </div>
          </div>

          {step === 'menu' ? (
            <button 
              disabled={cart.length === 0}
              onClick={() => setStep('checkout')}
              className="w-full py-4 bg-electric-blue text-white font-black uppercase tracking-widest rounded-2xl hover:bg-white hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              <ShoppingCart className="w-5 h-5" />
              Checkout ({cart.length})
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setStep('menu')}
                className="py-4 bg-white/5 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-white/10 transition-all"
              >
                Back
              </button>
              <button 
                onClick={() => onPlaceOrder(cart, { method: fulfillment, address })}
                className="py-4 bg-electric-blue text-white font-black uppercase tracking-widest rounded-2xl hover:bg-white hover:text-black transition-all"
              >
                Place Order
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
