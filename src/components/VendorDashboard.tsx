import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, Package, DollarSign, Archive, X, Upload, Edit2 } from 'lucide-react';
import { Product, Shop } from '../types';

interface VendorDashboardProps {
  userId: string;
  onClose: () => void;
}

export default function VendorDashboard({ userId, onClose }: VendorDashboardProps) {
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    // Fetch vendor's shop
    fetch('/api/shops')
      .then(res => res.json())
      .then(shops => {
        const myShop = shops.find((s: Shop) => s.owner_id === userId);
        if (myShop) {
          setShop(myShop);
          fetch(`/api/shops/${myShop.id}/products`)
            .then(res => res.json())
            .then(setProducts);
        }
      });
  }, [userId]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newProduct = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      shop_id: shop?.id,
      name: formData.get('name') as string,
      price: parseFloat(formData.get('price') as string),
      description: formData.get('description') as string,
      stock: parseInt(formData.get('stock') as string),
      image_url: previewImage || (editingProduct ? editingProduct.image_url : `https://picsum.photos/seed/${Math.random()}/200/200`),
      available: true
    };

    if (editingProduct) {
      // Update existing
      setProducts(products.map(p => p.id === editingProduct.id ? newProduct as Product : p));
    } else {
      // Create new
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      });
      setProducts([...products, newProduct as Product]);
    }

    setIsAdding(false);
    setEditingProduct(null);
    setPreviewImage(null);
  };

  if (!shop) return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[1600] p-6">
      <div className="bg-zinc-900 border border-white/10 p-8 rounded-3xl max-w-md w-full text-center">
        <h2 className="text-white text-2xl font-bold mb-4">No Shop Found</h2>
        <p className="text-white/60 mb-6">You need to register a shop first. Use the AI input to say "Register my shop named [Name]".</p>
        <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">Close</button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[1600] flex items-center justify-center p-4">
      <motion.div 
        drag
        dragMomentum={false}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-zinc-900 border border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] sm:h-[80vh] overflow-hidden flex flex-col cursor-grab active:cursor-grabbing"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-white/5 flex justify-between items-center bg-zinc-800/50 shrink-0">
          <div>
            <h2 className="text-lg sm:text-2xl font-black tracking-tight uppercase italic">{shop.name}</h2>
            <p className="text-[8px] sm:text-xs tracking-widest uppercase text-white/40">Vendor Dashboard</p>
          </div>
          <div className="flex gap-2 sm:gap-4">
            <button 
              onClick={() => setIsAdding(true)}
              className="bg-electric-blue text-black px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-sm font-bold flex items-center gap-1 sm:gap-2 hover:bg-electric-blue/90 transition-all glow-blue"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4" /> <span className="hidden xs:inline">Add</span>
            </button>
            <button onClick={onClose} className="p-2 text-white/40 hover:text-white transition-colors">
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(product => (
              <div key={product.id} className="bg-zinc-800/50 border border-white/5 rounded-2xl overflow-hidden group">
                <div className="aspect-square relative overflow-hidden">
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] text-white font-bold uppercase">
                    {product.stock} in stock
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-white font-bold text-lg mb-1">{product.name}</h3>
                  <p className="text-white/40 text-xs mb-3 line-clamp-2">{product.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-electric-blue font-mono font-bold">${(product.price || 0).toFixed(2)}</span>
                    <button 
                      onClick={() => {
                        setEditingProduct(product);
                        setIsAdding(true);
                      }}
                      className="text-[10px] uppercase tracking-widest text-white/40 hover:text-white border border-white/10 px-3 py-1 rounded-full transition-all flex items-center gap-2"
                    >
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add/Edit Product Modal */}
        {isAdding && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[70] flex items-center justify-center p-6">
            <motion.form 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              onSubmit={addProduct}
              className="bg-zinc-900 border border-white/10 p-8 rounded-3xl max-w-lg w-full space-y-6 overflow-y-auto max-h-[90vh]"
            >
              <h3 className="text-white text-xl font-bold">{editingProduct ? 'Edit Product' : 'New Product'}</h3>
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-32 h-32 rounded-2xl border border-white/10 overflow-hidden bg-white/5 relative group">
                    {(previewImage || editingProduct?.image_url) ? (
                      <img src={previewImage || editingProduct?.image_url} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/20">
                        <Upload className="w-8 h-8" />
                      </div>
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] font-bold uppercase">Change Photo</span>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-white/40 text-[10px] uppercase tracking-widest block mb-2">Product Name</label>
                  <input name="name" defaultValue={editingProduct?.name} required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-white/30 transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-white/40 text-[10px] uppercase tracking-widest block mb-2">Price ($)</label>
                    <input name="price" type="number" step="0.01" defaultValue={editingProduct?.price} required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-white/30 transition-all" />
                  </div>
                  <div>
                    <label className="text-white/40 text-[10px] uppercase tracking-widest block mb-2">Initial Stock</label>
                    <input name="stock" type="number" defaultValue={editingProduct?.stock} required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-white/30 transition-all" />
                  </div>
                </div>
                <div>
                  <label className="text-white/40 text-[10px] uppercase tracking-widest block mb-2">Description</label>
                  <textarea name="description" rows={3} defaultValue={editingProduct?.description} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-white/30 transition-all resize-none" />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 bg-electric-blue text-black font-bold py-3 rounded-xl hover:bg-electric-blue/90 transition-all glow-blue">
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setIsAdding(false);
                    setEditingProduct(null);
                    setPreviewImage(null);
                  }} 
                  className="flex-1 bg-white/5 text-white font-bold py-3 rounded-xl hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </motion.div>
    </div>
  );
}
