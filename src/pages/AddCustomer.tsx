import React, { useState } from 'react';
import { useAuth } from '../lib/auth';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Button, Input, Card } from '../components/ui';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { PageTransition } from '../components/PageTransition';
import { useNavigate } from 'react-router-dom';

export default function AddCustomer() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dueAmount, setDueAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return toast.error('Name and Phone are required');
    
    setLoading(true);
    try {
      await addDoc(collection(db, 'customers'), {
        userId: user!.uid,
        name,
        phone,
        dueAmount: Number(dueAmount) || 0,
        createdAt: serverTimestamp()
      });
      toast.success('Customer added successfully!');
      navigate('/customers');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'customers');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex justify-between items-center bg-white p-4 sm:p-6 rounded-[1.75rem] shadow-[0_2px_12px_rgb(0,0,0,0.04)]">
           <div className="flex items-center gap-3">
             <button onClick={() => navigate('/customers')} className="w-10 h-10 rounded-full bg-[#EAEEEF] hover:bg-[#E0E5E7] flex items-center justify-center transition-colors text-[#444746]">
               <ArrowLeft size={20} />
             </button>
             <div>
               <h2 className="text-xl font-bold text-[#1F1F1F]">Add Customer</h2>
             </div>
           </div>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-5">
             <Input label="Customer Name" placeholder="e.g. John Doe" value={name} onChange={e => setName(e.target.value)} />
             <Input label="Phone Number" placeholder="e.g. 017..." value={phone} onChange={e => setPhone(e.target.value)} />
             <Input label="Due Amount (Optional)" type="number" min="0" placeholder="0" value={dueAmount} onChange={e => setDueAmount(e.target.value)} />
             <div className="pt-4">
               <Button type="submit" disabled={loading} className="w-full h-[56px] text-[15px]">
                 {loading ? 'Adding...' : 'Save Customer'}
               </Button>
             </div>
          </form>
        </Card>
      </div>
    </PageTransition>
  );
}
