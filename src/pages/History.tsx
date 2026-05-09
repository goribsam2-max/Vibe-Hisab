import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, getDocs, orderBy, limit, doc, deleteDoc, updateDoc, getDoc } from 'firebase/firestore';
import { Card } from '../components/ui';
import { format } from 'date-fns';
import { Search, Banknote, Smartphone, CreditCard, Trash2, Download } from 'lucide-react';
import { PageTransition } from '../components/PageTransition';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import toast from 'react-hot-toast';

export default function History() {
  const { user } = useAuth();
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [saleToDelete, setSaleToDelete] = useState<any | null>(null);

  const fetchSales = async () => {
    try {
      const q = query(collection(db, 'sales'), where('userId', '==', user!.uid));
      const snap = await getDocs(q);
      const fetchedSales = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      fetchedSales.sort((a: any, b: any) => {
         if(!a.timestamp || !b.timestamp) return 0;
         return b.timestamp.seconds - a.timestamp.seconds;
      });
      setSales(fetchedSales.slice(0, 100)); // limit 100
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'sales');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchSales();
  }, [user]);

  const handleDelete = async () => {
    if (!saleToDelete) return;
    try {
      // Return stock
      const productRef = doc(db, 'products', saleToDelete.productId);
      const productSnap = await getDoc(productRef);
      if (productSnap.exists()) {
        const newStock = productSnap.data().stock + saleToDelete.quantity;
        await updateDoc(productRef, { stock: newStock });
      }

      await deleteDoc(doc(db, 'sales', saleToDelete.id));
      toast.success('বিক্রি মুছে ফেলা হয়েছে এবং স্টক ফেরত দেয়া হয়েছে');
      fetchSales();
    } catch(err) {
      handleFirestoreError(err, OperationType.DELETE, `sales/${saleToDelete.id}`);
    } finally {
      setSaleToDelete(null);
    }
  };

  const getMethodIcon = (method: string) => {
    if (method === 'bKash') return <Smartphone size={18} />;
    if (method === 'Nagad') return <CreditCard size={18} />;
    return <Banknote size={18} />;
  }

  const exportToCSV = () => {
    if (sales.length === 0) return toast.error('ডাউনলোড করার মত কোনো তথ্য নেই');
    
    const headers = ['Date', 'Time', 'Product', 'Quantity', 'Payment Method', 'Total Amount', 'Profit'];
    const rows = filteredSales.map(sale => [
      sale.timestamp ? format(sale.timestamp.toDate(), 'dd MMM yyyy') : 'N/A',
      sale.timestamp ? format(sale.timestamp.toDate(), 'hh:mm a') : 'N/A',
      `"${sale.productName.replace(/"/g, '""')}"`,
      sale.quantity,
      sale.paymentMethod,
      sale.totalAmount,
      sale.profit
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Sales_Export_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('ডাউনলোড শুরু হয়েছে');
  };

  const filteredSales = sales.filter(s => s.productName.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="p-8 font-medium text-[#444746] text-center">ইতিহাস লোড হচ্ছে...</div>;

  return (
    <PageTransition>
      <div className="space-y-6">
          <ConfirmDialog 
          isOpen={!!saleToDelete}
          title="বিক্রি মুছুন"
          message="আপনি কি নিশ্চিত যে এই বিক্রিটি মুছে ফেলতে চান? পণ্যটি পুনরায় স্টকে ফিরে যাবে।"
          confirmText="মুছুন"
          onConfirm={handleDelete}
          onCancel={() => setSaleToDelete(null)}
        />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[1.75rem] shadow-[0_2px_12px_rgb(0,0,0,0.04)] border-none">
           <div>
             <h2 className="text-2xl font-bold text-[#1F1F1F]">বিক্রির ইতিহাস</h2>
             <p className="text-[#444746] font-medium text-[13px]">আপনার সাম্প্রতিক ১০০টি ট্রানজ্যাকশন</p>
           </div>
           <div className="flex items-center gap-3 w-full sm:w-auto">
             <div className="relative w-full sm:w-auto flex-1">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#444746]" size={20} />
               <input 
                 placeholder="সার্চ করুন..." 
                 className="w-full sm:w-64 h-12 pl-12 pr-4 rounded-xl border border-[#EAEEEF] bg-[#F0F4F8] hover:bg-[#EAEEEF] focus:bg-white focus:border-[#0B57D0] focus:ring-1 focus:ring-[#0B57D0] focus:outline-none transition-all font-medium text-[#1F1F1F]"
                 value={search}
                 onChange={e => setSearch(e.target.value)}
               />
             </div>
             <button onClick={exportToCSV} className="h-12 bg-[#D3E3FD]/20 text-[#0B57D0] px-4 rounded-xl font-bold hover:bg-[#D3E3FD]/40 transition-colors flex items-center justify-center gap-2">
                <Download size={20} /> পিডিএফ/এক্সেল ডাইউনলোড
             </button>
           </div>
        </div>

        <Card className="p-0 overflow-hidden border border-[#EAEEEF] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-[#F0F4F8] text-[#444746] font-bold text-[13px] uppercase tracking-wider border-b border-[#EAEEEF] whitespace-nowrap">
                  <th className="p-4 pl-6">তারিখ ও সময়</th>
                  <th className="p-4">পণ্যের নাম</th>
                  <th className="p-4 text-center">পরিমাণ</th>
                  <th className="p-4">পেমেন্ট</th>
                  <th className="p-4 text-right">মোট টাকা</th>
                  <th className="p-4 text-right">লাভ</th>
                  <th className="p-4 pr-6"></th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="border-b border-[#EAEEEF]/50 hover:bg-[#F0F4F8]/50 transition-colors whitespace-nowrap">
                    <td className="p-4 p-4 pl-6 text-[14px]">
                      <p className="font-bold text-[#1F1F1F]">
                        {sale.timestamp ? format(sale.timestamp.toDate(), 'dd MMM, yyyy') : 'N/A'}
                      </p>
                      <p className="font-bold text-[#444746] text-[12px]">
                        {sale.timestamp ? format(sale.timestamp.toDate(), 'hh:mm a') : 'N/A'}
                      </p>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-[#1F1F1F] text-[14px] sm:text-[15px] truncate max-w-[150px] sm:max-w-[200px]">
                        {sale.productName}
                      </div>
                    </td>
                    <td className="p-4 text-center font-bold text-[#444746] text-[15px]">{sale.quantity}</td>
                    <td className="p-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#F0F4F8] rounded-lg text-[13px] font-bold text-[#1F1F1F]">
                        {getMethodIcon(sale.paymentMethod)} {sale.paymentMethod}
                      </div>
                    </td>
                    <td className="p-4 text-right font-black text-[#1F1F1F] text-[15px]">৳ {sale.totalAmount}</td>
                    <td className="p-4 text-right font-bold text-[#146C2E] text-[15px]">+ ৳ {sale.profit}</td>
                    <td className="p-4 pr-6 text-right">
                      <button onClick={() => setSaleToDelete(sale)} className="w-[32px] h-[32px] ml-auto shrink-0 bg-[#B3261E]/10 text-[#B3261E] rounded-full flex items-center justify-center hover:bg-[#B3261E]/20 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredSales.length === 0 && (
              <div className="p-8 text-center text-[#444746] font-medium bg-white">
                কোনো বিক্রির তালিকা পাওয়া যায়নি।
              </div>
            )}
          </div>
        </Card>
      </div>
    </PageTransition>
  );
}
