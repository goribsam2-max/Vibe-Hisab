import React, { useState } from 'react';
import { useAuth } from '../lib/auth';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Button, Input, Card } from '../components/ui';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { PageTransition } from '../components/PageTransition';
import { useNavigate } from 'react-router-dom';

export default function AddProduct() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [stock, setStock] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !buyPrice || !sellPrice || !stock) return toast.error('Fill all fields');
    
    setLoading(true);
    try {
      await addDoc(collection(db, 'products'), {
        userId: user!.uid,
        name,
        buyPrice: Number(buyPrice),
        sellPrice: Number(sellPrice),
        stock: Number(stock),
        createdAt: serverTimestamp()
      });
      toast.success('Product added successfully!');
      navigate('/products');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'products');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex justify-between items-center bg-white p-4 sm:p-6 rounded-[1.75rem] shadow-[0_2px_12px_rgb(0,0,0,0.04)]">
           <div className="flex items-center gap-3">
             <button onClick={() => navigate('/products')} className="w-10 h-10 rounded-full bg-[#EAEEEF] hover:bg-[#E0E5E7] flex items-center justify-center transition-colors text-[#444746]">
               <ArrowLeft size={20} />
             </button>
             <div>
               <h2 className="text-xl font-bold text-[#1F1F1F]">Add New Product</h2>
             </div>
           </div>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-5">
             <div>
               <Input label="Product Name" placeholder="e.g. Rice 1kg" value={name} onChange={e => setName(e.target.value)} />
             </div>
             <div className="grid grid-cols-2 gap-4">
               <Input label="Buy Price (৳)" type="number" min="0" placeholder="0" value={buyPrice} onChange={e => setBuyPrice(e.target.value)} />
               <Input label="Sell Price (৳)" type="number" min="0" placeholder="0" value={sellPrice} onChange={e => setSellPrice(e.target.value)} />
             </div>
             <div>
               <Input label="Initial Stock Qty" type="number" min="0" placeholder="0" value={stock} onChange={e => setStock(e.target.value)} />
             </div>
             <div className="pt-4">
               <Button type="submit" disabled={loading} className="w-full h-[56px] text-[15px]">
                 {loading ? 'Adding...' : 'Save Product'}
               </Button>
             </div>
          </form>
        </Card>
      </div>
    </PageTransition>
  );
}
