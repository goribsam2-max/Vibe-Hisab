import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { Button, Card } from '../components/ui';
import toast from 'react-hot-toast';
import { Plus, Trash2, Package } from 'lucide-react';
import { PageTransition } from '../components/PageTransition';
import { useNavigate } from 'react-router-dom';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

export default function Products() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  const fetchProducts = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'products'), where('userId', '==', user.uid));
      const snap = await getDocs(q);
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [user]);

  const handleDelete = async () => {
    if (!productToDelete) return;
    try {
      // Find all related sales and delete them to reset profit
      const salesQuery = query(collection(db, 'sales'), where('productId', '==', productToDelete));
      const salesSnap = await getDocs(salesQuery);
      
      const deletePromises = salesSnap.docs.map(docSnap => deleteDoc(doc(db, 'sales', docSnap.id)));
      await Promise.all(deletePromises);

      await deleteDoc(doc(db, 'products', productToDelete));
      toast.success('Product and related sales deleted');
      fetchProducts();
    } catch(err) {
      handleFirestoreError(err, OperationType.DELETE, `products/${productToDelete}`);
    } finally {
      setProductToDelete(null);
    }
  };

  if (loading) return <div className="p-8 font-medium text-[#444746] text-center">Loading products...</div>;

  return (
    <PageTransition>
      <div className="space-y-6">
        <ConfirmDialog 
          isOpen={!!productToDelete}
          title="পণ্য মুছুন"
          message="আপনি কি এই পণ্যটি মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা যাবে না।"
          confirmText="মুছুন"
          onConfirm={handleDelete}
          onCancel={() => setProductToDelete(null)}
        />
        <div className="flex justify-between items-center bg-white p-6 rounded-[1.75rem] shadow-[0_2px_12px_rgb(0,0,0,0.04)] border-none">
           <div>
             <h2 className="text-2xl font-bold text-[#1F1F1F]">ইনভেন্টরি</h2>
             <p className="text-[#444746] font-medium text-[13px]">আপনার পণ্য ও স্টক পরিচালনা করুন</p>
           </div>
           <Button onClick={() => navigate('/products/new')} className="gap-2 shrink-0">
             <Plus size={20} />
             <span className="hidden sm:inline">পণ্য যোগ করুন</span>
           </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map(p => (
            <Card 
              key={p.id} 
              onClick={() => navigate(`/products/${p.id}`)}
              className="relative overflow-hidden group hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full border hover:border-[#0B57D0]/30"
            >
              <div className="flex justify-between items-start mb-4 gap-2">
                <h3 className="text-[14px] sm:text-[17px] leading-tight font-bold text-[#1F1F1F] truncate" title={p.name}>{p.name}</h3>
                <button onClick={(e) => { e.stopPropagation(); setProductToDelete(p.id); }} className="w-[32px] h-[32px] shrink-0 bg-[#B3261E]/10 text-[#B3261E] rounded-full flex items-center justify-center hover:bg-[#B3261E]/20 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-5 mt-auto">
                <div className="bg-[#EAEEEF]/50 p-3 rounded-2xl">
                  <p className="text-[11px] uppercase tracking-wider text-[#444746] font-bold mb-0.5">কেনা দাম</p>
                  <p className="font-bold text-[#1F1F1F]">৳ {p.buyPrice}</p>
                </div>
                <div className="bg-[#C4EED0]/50 p-3 rounded-2xl">
                  <p className="text-[11px] uppercase tracking-wider text-[#146C2E] font-bold mb-0.5">বিক্রি দাম</p>
                  <p className="font-bold text-[#146C2E]">৳ {p.sellPrice}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between border-t border-[#EAEEEF] pt-4">
                 <div>
                   <span className="text-[13px] font-bold text-[#444746] mr-1">স্টক:</span>
                   <span className={`text-[13px] font-bold px-2 py-1 rounded-md ${p.stock < 5 ? 'bg-[#B3261E]/10 text-[#B3261E]' : 'bg-[#EAEEEF] text-[#1F1F1F]'}`}>{p.stock}</span>
                 </div>
                 <div className="text-[#0B57D0] font-bold text-[13px]">
                   লাভ: {p.sellPrice > p.buyPrice ? Math.round(((p.sellPrice - p.buyPrice)/p.sellPrice)*100) : 0}%
                 </div>
              </div>
            </Card>
          ))}
          {products.length === 0 && (
            <div className="col-span-full py-16 text-center text-[#444746] bg-white rounded-[1.75rem] border border-[#EAEEEF] shadow-sm">
               <div className="w-16 h-16 bg-[#EAEEEF] rounded-full flex items-center justify-center mx-auto mb-4 text-[#444746]">
                 <Package size={32} />
               </div>
               <p className="font-bold text-lg mb-1">কোনো পণ্য নেই</p>
               <p className="text-[15px]">বিক্রি শুরু করতে পণ্য যোগ করুন</p>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
