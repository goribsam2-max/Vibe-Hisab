import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, getDocs, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { Card, Button } from '../components/ui';
import { PageTransition } from '../components/PageTransition';
import { format } from 'date-fns';
import { Users, Phone, DollarSign, Plus, Trash2, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { PremiumLock } from '../components/PremiumLock';
import { useNavigate } from 'react-router-dom';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

export default function Customers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);

  const fetchCustomers = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'customers'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if(user && user.premiumUntil > Date.now()) {
      fetchCustomers(); 
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) return <div className="p-8 text-center text-[#444746] font-medium">লোড হচ্ছে...</div>;

  if (user && user.premiumUntil < Date.now()) {
    return (
      <PremiumLock 
        title="কাস্টমার ম্যানেজার লকড" 
        description="আপনার কাস্টমারদের প্রোফাইল এবং বাকি ট্র্যাক করতে প্রিমিয়ামে আপগ্রেড করুন।" 
      />
    );
  }

  const handleDelete = async () => {
    if (!customerToDelete) return;
    try {
      await deleteDoc(doc(db, 'customers', customerToDelete));
      toast.success('কাস্টমার মুছে ফেলা হয়েছে');
      fetchCustomers();
    } catch(err) {
      handleFirestoreError(err, OperationType.DELETE, `customers/${customerToDelete}`);
    } finally {
      setCustomerToDelete(null);
    }
  };

  const handleWhatsApp = (customer: any) => {
    if (!customer.phone) {
      toast.error('কাস্টমারের ফোন নাম্বার নেই');
      return;
    }
    let phoneNum = customer.phone;
    if (phoneNum.startsWith('0')) {
      phoneNum = '+88' + phoneNum;
    }
    const message = `আসসালামু আলাইকুম। আপনার শপে মোট বাকি আছে ${customer.dueAmount} টাকা। দয়া করে পরিশোধ করুন। ধন্যবাদ।`;
    const encodedMessage = encodeURIComponent(message);
    const waUrl = `https://wa.me/${phoneNum.replace(/[^0-9]/g, '')}?text=${encodedMessage}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <ConfirmDialog 
          isOpen={!!customerToDelete}
          title="কাস্টমার মুছুন"
          message="আপনি কি এই কাস্টমারকে মুছে ফেলতে চান? এর সকল তথ্য মুছে যাবে।"
          confirmText="মুছুন"
          onConfirm={handleDelete}
          onCancel={() => setCustomerToDelete(null)}
        />
        <div className="flex justify-between items-center bg-white p-6 rounded-[1.75rem] shadow-[0_2px_12px_rgb(0,0,0,0.04)] border-none">
           <div>
             <h2 className="text-2xl font-bold text-[#1F1F1F]">কাস্টমারস</h2>
             <p className="text-[#444746] font-medium text-[13px]">আপনার কাস্টমারদের লিস্ট ও বাকি পরিচালনা করুন</p>
           </div>
           <Button onClick={() => navigate('/customers/new')} className="gap-2 shrink-0">
             <Plus size={20} />
             <span className="hidden sm:inline">নতুন কাস্টমার</span>
           </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {customers.map(c => (
             <Card key={c.id} className="flex flex-col relative overflow-hidden hover:shadow-md transition-shadow group">
               <div className="flex items-start justify-between mb-4">
                 <div className="flex items-center gap-3">
                   <div className="w-12 h-12 bg-[#F0F4F8] rounded-full flex items-center justify-center text-[#444746]">
                     <Users size={20} />
                   </div>
                   <div className="overflow-hidden">
                      <h3 className="text-[14px] sm:text-[17px] font-bold text-[#1F1F1F] truncate">{c.name}</h3>
                      <p className="text-[13px] text-[#444746] font-medium flex items-center gap-1"><Phone size={12}/> {c.phone}</p>
                   </div>
                 </div>
                 <div className="flex flex-col gap-2">
                   <button onClick={(e) => { e.stopPropagation(); setCustomerToDelete(c.id); }} className="w-[32px] h-[32px] shrink-0 bg-[#B3261E]/10 text-[#B3261E] rounded-full flex items-center justify-center hover:bg-[#B3261E]/20 transition-colors">
                     <Trash2 size={16} />
                   </button>
                 </div>
               </div>
               <div className="mt-auto bg-[#F9DEDC]/20 p-4 rounded-2xl border border-[#F9DEDC] flex justify-between items-center">
                 <div>
                   <p className="text-[11px] font-bold text-[#8C1D18] uppercase tracking-wider mb-1">মোট বাকি</p>
                   <p className="text-xl font-black text-[#8C1D18]">৳ {c.dueAmount}</p>
                 </div>
                 {c.dueAmount > 0 && (
                   <button 
                     onClick={(e) => { e.stopPropagation(); handleWhatsApp(c); }}
                     className="bg-[#25D366] text-white p-2 rounded-full shadow-md hover:bg-[#1DA851] transition-colors"
                     title="হোয়াটসঅ্যাপে মেসেজ পাঠান"
                   >
                     <MessageCircle size={20} />
                   </button>
                 )}
               </div>
             </Card>
          ))}
          {customers.length === 0 && (
            <div className="col-span-full py-16 text-center text-[#444746] bg-white rounded-[1.75rem] border border-[#EAEEEF]">
               <Users size={32} className="mx-auto mb-4 opacity-50" />
               <p className="font-bold text-lg mb-1">কোনো কাস্টমার নেই</p>
               <p className="text-[15px]">বাকি ট্র্যাক করতে কাস্টমার যোগ করুন</p>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
