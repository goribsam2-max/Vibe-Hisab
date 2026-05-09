import React, { useState } from 'react';
import { useAuth } from '../lib/auth';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Card, Button, Input } from '../components/ui';
import { PageTransition } from '../components/PageTransition';
import { ShieldCheck, Star, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const BENEFITS = [
  "Full access to Customers & Dues Tracking",
  "Daily Expense Logging & P&L Calculation",
  "Detailed historical sales and profit reports",
  "Advanced Data Export to CSV",
  "POS Receipt Printing & Sharing",
  "Smart Stock level Alerts",
  "Admin panel for staff & multi-user (Soon)"
];

const PLANS = [
  { id: '1-month', name: '1 Month', durationDays: 30, amount: 200 },
  { id: '6-months', name: '6 Months', durationDays: 180, amount: 1000 },
  { id: '1-year', name: '1 Year', durationDays: 365, amount: 1800 },
];

export default function Upgrade() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(PLANS[0]);
  const [paymentMethod, setPaymentMethod] = useState<'bKash' | 'Nagad'>('bKash');
  const [transactionId, setTransactionId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionId || transactionId.length < 8) {
      return toast.error('Enter a valid Transaction ID');
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'premiumRequests'), {
        userId: user!.uid,
        shopName: user!.shopName,
        mobile: user!.mobile,
        planName: selectedPlan.name,
        durationDays: selectedPlan.durationDays,
        amount: selectedPlan.amount,
        paymentMethod,
        transactionId,
        status: 'pending',
        timestamp: serverTimestamp()
      });
      toast.success('Upgrade request submitted!');
      navigate('/');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'premiumRequests');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto space-y-6">
         <div className="bg-gradient-to-b from-[#0B57D0] to-[#0a4fc0] text-white p-8 rounded-[1.75rem] text-center shadow-lg">
           <Star size={48} className="mx-auto mb-4 text-[#C2E7FF]" fill="currentColor" />
           <h1 className="text-3xl font-black mb-2">Upgrade to Premium</h1>
           <p className="text-[#D3E3FD] font-medium max-w-md mx-auto mb-6">
             Unlock features like Customer Manager, Expense Tracker and more.
           </p>
           <div className="flex flex-col gap-3 max-w-sm mx-auto text-left">
             {BENEFITS.map((benefit, i) => (
               <div key={i} className="flex items-start gap-3 bg-white/10 rounded-xl p-3">
                 <CheckCircle size={20} className="text-[#C2E7FF] shrink-0 mt-0.5" />
                 <span className="text-[14px] font-bold text-white leading-tight">{benefit}</span>
               </div>
             ))}
           </div>
         </div>

         <div className="flex flex-col sm:flex-row gap-3">
           {PLANS.map(plan => (
             <Card 
               key={plan.id}
               className={`flex-1 flex sm:flex-col items-center justify-between sm:justify-center p-4 cursor-pointer transition-all border-2 ${selectedPlan.id === plan.id ? 'border-[#0B57D0] bg-[#F0F4F8] shadow-md' : 'border-[#EAEEEF] hover:border-[#0B57D0]/30'}`}
               onClick={() => setSelectedPlan(plan)}
             >
               <h3 className="text-[15px] font-bold text-[#444746] sm:mb-2">{plan.name}</h3>
               <p className="text-xl font-black text-[#1F1F1F]">৳ {plan.amount}</p>
             </Card>
           ))}
         </div>

         <Card className="border border-[#EAEEEF]">
           <h3 className="font-bold text-lg text-[#1F1F1F] mb-6 flex items-center gap-2">
             <ShieldCheck className="text-[#0B57D0]" /> Payment Details
           </h3>

           <div className="bg-[#F0F4F8] p-4 rounded-xl mb-6 text-center text-[#444746] font-medium text-[15px]">
              Send <span className="font-bold text-[#1F1F1F]">৳ {selectedPlan.amount}</span> to <span className="font-black text-[#0B57D0]">01XXXXXXXXX</span> (Personal)
           </div>

           <div className="flex gap-4 mb-6">
             {['bKash', 'Nagad'].map(pm => (
               <label key={pm} className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-[1rem] border-2 cursor-pointer transition-colors ${paymentMethod === pm ? 'border-[#0B57D0] bg-[#F0F4F8] font-bold text-[#1F1F1F]' : 'border-[#EAEEEF] text-[#444746] font-medium'}`}>
                 <input type="radio" name="payment" value={pm} checked={paymentMethod === pm} onChange={(e) => setPaymentMethod(e.target.value as any)} className="hidden" />
                 {pm}
               </label>
             ))}
           </div>

           <form onSubmit={handleSubmit} className="space-y-4">
             <Input 
               label={`${paymentMethod} Transaction ID`} 
               placeholder="e.g. 9X2A... " 
               value={transactionId}
               onChange={e => setTransactionId(e.target.value)}
             />
             <Button type="submit" disabled={loading} className="w-full h-[56px] text-lg mt-2">
               {loading ? 'Submitting...' : 'Submit Request'}
             </Button>
           </form>
         </Card>
      </div>
    </PageTransition>
  );
}
