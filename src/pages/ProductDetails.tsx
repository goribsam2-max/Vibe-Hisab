import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Card } from '../components/ui';
import { ArrowLeft, Banknote, Smartphone, CreditCard, Clock } from 'lucide-react';
import { PageTransition } from '../components/PageTransition';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';

export default function ProductDetails() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [product, setProduct] = useState<any | null>(null);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !id) return;
    const fetchData = async () => {
      try {
        const pDoc = await getDoc(doc(db, 'products', id));
        if (pDoc.exists() && pDoc.data().userId === user.uid) {
          setProduct({ id: pDoc.id, ...pDoc.data() });
        } else {
          return navigate('/products');
        }

        const q = query(collection(db, 'sales'), where('productId', '==', id), where('userId', '==', user.uid));
        const snap = await getDocs(q);
        const fetchedSales = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        fetchedSales.sort((a: any, b: any) => {
           if(!a.timestamp || !b.timestamp) return 0;
           return b.timestamp.seconds - a.timestamp.seconds;
        });
        setSales(fetchedSales);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'product_details');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, id]);

  const getMethodIcon = (method: string) => {
    if (method === 'bKash') return <Smartphone size={16} />;
    if (method === 'Nagad') return <CreditCard size={16} />;
    return <Banknote size={16} />;
  };

  if (loading) return <div className="p-8 text-center font-medium">লোড হচ্ছে...</div>;
  if (!product) return null;

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center bg-white p-4 sm:p-6 rounded-[1.75rem] shadow-[0_2px_12px_rgb(0,0,0,0.04)]">
           <div className="flex items-center gap-3">
             <button onClick={() => navigate('/products')} className="w-10 h-10 rounded-full bg-[#EAEEEF] hover:bg-[#E0E5E7] flex items-center justify-center transition-colors text-[#444746]">
               <ArrowLeft size={20} />
             </button>
             <div>
               <h2 className="text-xl font-bold text-[#1F1F1F] leading-tight">{product.name}</h2>
               <p className="text-[13px] font-medium text-[#444746]">বর্তমান স্টক: {product.stock}</p>
             </div>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-[#D3E3FD]/30 border-transparent">
            <p className="text-[12px] font-bold text-[#444746] uppercase mb-1 tracking-wider">কেনা দাম</p>
            <p className="text-2xl font-black text-[#1F1F1F]">৳ {product.buyPrice}</p>
          </Card>
          <Card className="bg-[#C4EED0]/30 border-transparent">
            <p className="text-[12px] font-bold text-[#146C2E] uppercase mb-1 tracking-wider">বিক্রি দাম</p>
            <p className="text-2xl font-black text-[#146C2E]">৳ {product.sellPrice}</p>
          </Card>
        </div>

        <div>
          <h3 className="text-lg font-bold text-[#1F1F1F] mb-4 flex items-center gap-2"><Clock size={20} className="text-[#0B57D0]" /> সাম্প্রতিক বিক্রির ইতিহাস</h3>
          <Card className="p-0 overflow-hidden border-[#EAEEEF]">
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[#F0F4F8] text-[#444746] font-bold text-[12px] uppercase tracking-wider border-b border-[#EAEEEF] whitespace-nowrap">
                      <th className="p-4 pl-6">তারিখ ও সময়</th>
                      <th className="p-4 text-center">পরিমাণ</th>
                      <th className="p-4">পেমেন্ট মেথড</th>
                      <th className="p-4 text-right">লাভ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map(s => (
                      <tr key={s.id} className="border-b border-[#EAEEEF]/50 whitespace-nowrap">
                        <td className="p-4 pl-6 text-[13px] font-bold text-[#1F1F1F]">
                          {s.timestamp ? format(s.timestamp.toDate(), 'dd MMM yyyy, hh:mm a') : 'N/A'}
                        </td>
                        <td className="p-4 text-center font-bold text-[#444746]">{s.quantity}</td>
                        <td className="p-4">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F0F4F8] rounded-full text-[12px] font-bold text-[#1F1F1F]">
                            {getMethodIcon(s.paymentMethod)} {s.paymentMethod}
                          </div>
                        </td>
                        <td className="p-4 text-right font-bold text-[#146C2E] pr-6">+ ৳ {s.profit}</td>
                      </tr>
                    ))}
                    {sales.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-[#444746] font-medium text-[14px]">
                          এই পণ্যের কোনো বিক্রির রেকর্ড নেই।
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
             </div>
          </Card>
        </div>

      </div>
    </PageTransition>
  );
}
