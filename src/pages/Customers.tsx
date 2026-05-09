import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../lib/auth';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, getDocs, orderBy, doc, deleteDoc, updateDoc, increment, addDoc, serverTimestamp } from 'firebase/firestore';
import { Card, Button } from '../components/ui';
import { PageTransition } from '../components/PageTransition';
import { format } from 'date-fns';
import { Users, Phone, DollarSign, Plus, Trash2, MessageSquare, HandCoins } from 'lucide-react';
import toast from 'react-hot-toast';
import { PremiumLock } from '../components/PremiumLock';
import { useNavigate } from 'react-router-dom';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { motion, AnimatePresence } from 'motion/react';

export default function Customers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  const [dueCollectCustomer, setDueCollectCustomer] = useState<any>(null);
  const [collectAmount, setCollectAmount] = useState<number | ''>('');
  const [mounted, setMounted] = useState(false);

  const fetchCustomers = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'customers'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setCustomers(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    setMounted(true);
    if(user && user.premiumUntil > Date.now()) {
      fetchCustomers(); 
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) return <div className="p-8 text-center text-[#444746] font-medium">লোড হচ্ছে...</div>;

  if (user && user.premiumUntil < Date.now()) {
    return <PremiumLock title="কাস্টমার ম্যানেজার লকড" description="আপনার কাস্টমারদের প্রোফাইল এবং বাকি ট্র্যাক করতে প্রিমিয়ামে আপগ্রেড করুন।" />;
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

  const handleSMS = async (customer: any) => {
    if (!customer.phone) return toast.error('ফোন নাম্বার নেই');
    
    // Simulating API call
    const loadingToast = toast.loading('SMS পাঠানো হচ্ছে...');
    setTimeout(() => {
      toast.success('SMS সফলভাবে পাঠানো হয়েছে!', { id: loadingToast });
    }, 1500);
  };

  const handleDueCollect = async () => {
    if (!dueCollectCustomer || !collectAmount || collectAmount <= 0) return toast.error('সঠিক পরিমাণ দিন');
    if (collectAmount > dueCollectCustomer.dueAmount) return toast.error('বাকি পরিমাণের চেয়ে বেশি নেওয়া যাবে না');

    try {
      await updateDoc(doc(db, 'customers', dueCollectCustomer.id), {
        dueAmount: increment(-collectAmount)
      });
      
      await addDoc(collection(db, 'dueCollections'), {
        userId: user!.uid,
        customerId: dueCollectCustomer.id,
        amount: Number(collectAmount),
        timestamp: serverTimestamp()
      });

      toast.success('বাকি আদায় সফল হয়েছে!');
      setDueCollectCustomer(null);
      setCollectAmount('');
      fetchCustomers();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `customers/${dueCollectCustomer.id}`);
    }
  };

  const renderModals = () => {
    if (!mounted) return null;
    return createPortal(
      <AnimatePresence>
        {dueCollectCustomer && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-[#1F1F1F]/40 backdrop-blur-md z-[60] flex items-center justify-center p-4">
            <motion.div initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}} className="bg-white rounded-[2rem] w-full max-w-sm p-8 shadow-2xl">
              <h3 className="text-2xl font-black text-[#1F1F1F] mb-2 text-center">বাকি আদায়</h3>
              <p className="text-center font-bold text-[#b3261e] mb-6">মোট বাকি: ৳ {dueCollectCustomer.dueAmount}</p>

              <div className="space-y-5 mb-8">
                <div>
                  <label className="text-[14px] font-bold text-[#444746] block mb-2 pl-1">জমা দেওয়ার পরিমাণ (৳)</label>
                  <input 
                    type="number" 
                    value={collectAmount}
                    onChange={(e) => setCollectAmount(Number(e.target.value))}
                    className="w-full bg-[#F0F4F8] border-2 border-transparent rounded-[1.25rem] px-5 py-4 focus:outline-none focus:bg-white focus:border-[#0B57D0]/30 transition-all font-bold text-xl text-[#1F1F1F]" 
                    placeholder="0" 
                  />
                  {collectAmount && (
                    <p className="text-sm font-bold text-[#146c2e] mt-2 text-center">
                      আদায়ের পর বাকি থাকবে: ৳ {dueCollectCustomer.dueAmount - Number(collectAmount)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-4">
                <Button variant="tonal" className="flex-1 bg-[#F0F4F8] hover:bg-[#EAEEEF] text-[#444746]" onClick={() => {setDueCollectCustomer(null); setCollectAmount('');}}>বাতিল</Button>
                <Button className="flex-1 shadow-lg shadow-[#0B57D0]/20" onClick={handleDueCollect}>আদায় করুন</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    );
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
               <div className="mt-auto bg-[#F9DEDC]/20 p-4 rounded-2xl border border-[#F9DEDC] flex justify-between items-center mb-3">
                 <div>
                   <p className="text-[11px] font-bold text-[#8C1D18] uppercase tracking-wider mb-1">মোট বাকি</p>
                   <p className="text-xl font-black text-[#8C1D18]">৳ {c.dueAmount}</p>
                 </div>
                 {c.dueAmount > 0 && (
                   <button 
                     onClick={(e) => { e.stopPropagation(); handleSMS(c); }}
                     className="bg-[#0B57D0] text-white p-2 rounded-full shadow-md hover:bg-[#0B57D0]/90 transition-colors"
                     title="SMS পাঠান"
                   >
                     <MessageSquare size={18} />
                   </button>
                 )}
               </div>
               {c.dueAmount > 0 && (
                 <Button 
                   onClick={(e) => { e.stopPropagation(); setDueCollectCustomer(c); }}
                   className="w-full bg-[#146C2E] hover:bg-[#0F5323] shadow-md shadow-[#146c2e]/20"
                 >
                   <HandCoins size={18} className="mr-2" /> বাকি আদায়
                 </Button>
               )}
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
        {renderModals()}
      </div>
    </PageTransition>
  );
}
