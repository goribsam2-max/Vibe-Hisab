import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, getDocs, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { Card, Button, Input } from '../components/ui';
import { PageTransition } from '../components/PageTransition';
import { format } from 'date-fns';
import { TrendingDown, Plus, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import { PremiumLock } from '../components/PremiumLock';

export default function Expenses() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');

  const fetchExpenses = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'expenses'), where('userId', '==', user.uid), orderBy('timestamp', 'desc'));
      const snap = await getDocs(q);
      setExpenses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if(user && user.premiumUntil > Date.now()) {
      fetchExpenses(); 
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) return <div className="p-8 text-center text-[#444746] font-medium">Loading...</div>;

  if (user && user.premiumUntil < Date.now() && user.role !== 'admin') {
    return (
      <PremiumLock 
        title="Expense Tracker Locked" 
        description="Premium users can record and track daily operational expenses deeply integrated with profit calculation." 
      />
    );
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !amount) return toast.error('Fill required fields');
    try {
      await addDoc(collection(db, 'expenses'), {
        userId: user!.uid,
        description: desc,
        amount: Number(amount),
        timestamp: serverTimestamp()
      });
      toast.success('Expense recorded');
      setIsAdding(false);
      setDesc(''); setAmount('');
      fetchExpenses();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'expenses');
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-white p-6 rounded-[1.75rem] shadow-[0_2px_12px_rgb(0,0,0,0.04)] border-none">
           <div>
             <h2 className="text-2xl font-bold text-[#1F1F1F]">Expenses</h2>
             <p className="text-[#444746] font-medium text-[13px]">Track daily shop expenses</p>
           </div>
           <Button onClick={() => setIsAdding(!isAdding)} variant={isAdding ? 'tonal' : 'filled'} className="gap-2 shrink-0">
             <Plus size={20} className={isAdding ? 'rotate-45 transition-transform' : 'transition-transform'} />
             <span className="hidden sm:inline">{isAdding ? 'Close' : 'Add Expense'}</span>
           </Button>
        </div>

        {isAdding && (
          <Card className="bg-[#F9DEDC]/20 border border-[#F9DEDC]">
            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
               <div className="lg:col-span-2">
                 <Input label="Expense Description" placeholder="e.g. Electricity Bill" value={desc} onChange={e => setDesc(e.target.value)} />
               </div>
               <Input label="Amount (৳)" type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} />
               <Button type="submit" variant="danger" className="w-full h-[56px] text-[15px] mb-1">Record Expense</Button>
            </form>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="md:col-span-2 lg:col-span-3 p-0 overflow-hidden shadow-sm border border-[#EAEEEF]">
            <div className="overflow-x-auto">
              {expenses.length > 0 ? (
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="bg-[#F0F4F8] text-[#444746] font-bold text-[13px] uppercase tracking-wider">
                      <th className="p-4 pl-6">Date</th>
                      <th className="p-4">Description</th>
                      <th className="p-4 text-right pr-6">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map(e => (
                      <tr key={e.id} className="border-b border-[#EAEEEF]/50 hover:bg-[#F0F4F8]/50 transition-colors">
                        <td className="p-4 pl-6 font-medium text-[#444746] text-[14px]">
                          {e.timestamp ? format(e.timestamp.toDate(), 'dd MMM, yyyy') : 'N/A'}
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-[#1F1F1F] text-[14px] sm:text-[15px] truncate max-w-[150px] sm:max-w-[300px]">
                            {e.description}
                          </div>
                        </td>
                        <td className="p-4 text-right font-black text-[#8C1D18] pr-6">- ৳{e.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-16 text-center text-[#444746]">
                   <TrendingDown size={32} className="mx-auto mb-4 opacity-50" />
                   <p className="font-bold text-lg mb-1">No expenses recorded</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
