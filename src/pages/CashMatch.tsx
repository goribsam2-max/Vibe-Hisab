import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { PageTransition } from '../components/PageTransition';
import { Card, Button } from '../components/ui';
import { CheckCircle2, ChevronRight, HandCoins, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CashMatch() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [salesDiff, setSalesDiff] = useState(0);
  const [expensesDiff, setExpensesDiff] = useState(0);
  const [dueDiff, setDueDiff] = useState(0);
  const [expectedCash, setExpectedCash] = useState(0);

  const [actualCash, setActualCash] = useState<number | ''>('');

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        const salesQ = query(collection(db, 'sales'), where('userId', '==', user.uid));
        const expQ = query(collection(db, 'expenses'), where('userId', '==', user.uid));
        const dueCollQ = query(collection(db, 'dueCollections'), where('userId', '==', user.uid));

        const [sSnap, eSnap, dueSnap] = await Promise.all([ getDocs(salesQ), getDocs(expQ), getDocs(dueCollQ) ]);

        let sTotal = 0;
        sSnap.docs.forEach(d => { sTotal += (d.data().totalAmount || 0) });

        let eTotal = 0;
        eSnap.docs.forEach(d => { eTotal += (d.data().amount || 0) });

        let dueTotal = 0;
        dueSnap.docs.forEach(d => { dueTotal += (d.data().amount || 0) });

        setSalesDiff(sTotal);
        setExpensesDiff(eTotal);
        setDueDiff(dueTotal);
        // Maybe we want to show dueTotal separately in CashMatch
        setExpectedCash(sTotal + dueTotal - eTotal);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'cashmatch');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleMatch = () => {
    if (actualCash === '' || actualCash < 0) return toast.error('সঠিক ক্যাশ ইনপুট দিন');
    const diff = Number(actualCash) - expectedCash;
    if (diff === 0) {
      toast.success('ক্যাশ পুরোপুরি মিলে গেছে! 🎉', { duration: 4000 });
    } else if (diff > 0) {
      toast.error(`হিসাবের চেয়ে ক্যাশ ৳ ${diff} বেশি আছে!`, { duration: 4000 });
    } else {
      toast.error(`হিসাবের চেয়ে ক্যাশ ৳ ${Math.abs(diff)} কম (শর্ট) আছে!`, { duration: 4000 });
    }
  };

  if(loading) return <div className="p-8 text-center text-[#444746] font-medium">লোড হচ্ছে...</div>;

  return (
    <PageTransition>
      <div className="max-w-md mx-auto space-y-6 pb-20">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-[#D3E3FD] text-[#0B57D0] rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <HandCoins size={40} />
          </div>
          <h2 className="text-2xl font-black text-[#1F1F1F] mb-2">ক্যাশ মেলাই (Cash Match)</h2>
          <p className="text-[#444746] text-sm">দিন শেষে আপনার ক্যাশ ড্রয়ার মিলিয়ে নিন</p>
        </div>

        <Card className="p-6 border border-[#EAEEEF] shadow-sm rounded-[1.75rem] space-y-4">
          <div className="flex justify-between items-center bg-[#F0F4F8] p-4 rounded-2xl">
            <span className="font-bold text-[#444746]">মোট বিক্রি (ইনকাম)</span>
            <span className="font-bold text-[#146C2E]">+ ৳ {salesDiff.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center bg-[#F0F4F8] p-4 rounded-2xl">
            <span className="font-bold text-[#444746]">বাকি আদায় (ইনকাম)</span>
            <span className="font-bold text-[#146C2E]">+ ৳ {dueDiff.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center bg-[#F0F4F8] p-4 rounded-2xl">
            <span className="font-bold text-[#444746]">মোট খরচ</span>
            <span className="font-bold text-[#B3261E]">- ৳ {expensesDiff.toLocaleString()}</span>
          </div>

          <div className="flex justify-between items-center bg-[#1F1F1F] text-white p-5 rounded-[1.5rem] mt-4 shadow-lg">
            <span className="text-[#EAEEEF] font-bold">হিসাব অনুযায়ী থাকা উচিত</span>
            <span className="text-[24px] font-black">৳ {expectedCash.toLocaleString()}</span>
          </div>
        </Card>

        <div className="space-y-4">
          <label className="text-[14px] font-bold text-[#444746] block pl-1">ড্রয়ারে বাস্তবে কত ক্যাশ আছে?</label>
          <input 
            type="number"
            value={actualCash}
            onChange={(e) => setActualCash(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full h-16 px-6 rounded-[1.5rem] bg-white border-2 border-[#EAEEEF] text-[#1F1F1F] font-bold text-2xl focus:outline-none focus:border-[#0B57D0] focus:shadow-[0_0_0_4px_rgba(11,87,208,0.1)] transition-all text-center"
            placeholder="0"
          />
          <Button onClick={handleMatch} className="w-full h-[64px] text-[18px] bg-[#0B57D0] shadow-lg shadow-[#0B57D0]/20 rounded-full">
            ক্যাশ মিলিয়ে দেখুন <ChevronRight />
          </Button>
        </div>

      </div>
    </PageTransition>
  );
}
