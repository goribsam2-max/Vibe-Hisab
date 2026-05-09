import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Button, Input, Card } from '../components/ui';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { PageTransition } from '../components/PageTransition';
import { useNavigate } from 'react-router-dom';

export default function AddExpense() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !amount) return toast.error('All fields required');
    
    setLoading(true);
    try {
      await addDoc(collection(db, 'expenses'), {
        userId: user!.uid,
        description: desc,
        amount: Number(amount),
        timestamp: serverTimestamp()
      });
      toast.success('Expense recorded successfully!');
      navigate('/expenses');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'expenses');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex justify-between items-center bg-white p-4 sm:p-6 rounded-[1.75rem] shadow-[0_2px_12px_rgb(0,0,0,0.04)]">
           <div className="flex items-center gap-3">
             <button onClick={() => navigate('/expenses')} className="w-10 h-10 rounded-full bg-[#EAEEEF] hover:bg-[#E0E5E7] flex items-center justify-center transition-colors text-[#444746]">
               <ArrowLeft size={20} />
             </button>
             <div>
               <h2 className="text-xl font-bold text-[#1F1F1F]">Record Expense</h2>
             </div>
           </div>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-5">
             <Input label="Description" placeholder="e.g. Shop Rent" value={desc} onChange={e => setDesc(e.target.value)} />
             <Input label="Amount (৳)" type="number" min="0" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} />
             <div className="pt-4">
               <Button type="submit" disabled={loading} className="w-full h-[56px] text-[15px]">
                 {loading ? 'Recording...' : 'Save Expense'}
               </Button>
             </div>
          </form>
        </Card>
      </div>
    </PageTransition>
  );
}
