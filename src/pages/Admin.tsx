import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, getDocs, doc, updateDoc, orderBy } from 'firebase/firestore';
import { Card, Button } from '../components/ui';
import toast from 'react-hot-toast';
import { Shield, Ban, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { PageTransition } from '../components/PageTransition';
import { AdminNotifications } from '../components/AdminNotifications';
import { AdminAboutUs } from '../components/AdminAboutUs';

export default function Admin() {
  const [users, setUsers] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const q = query(collection(db, 'users'));
      const snap = await getDocs(q);
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));

      const reqSnap = await getDocs(query(collection(db, 'premiumRequests'), orderBy('timestamp', 'desc')));
      setRequests(reqSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'banned' : 'active';
    try {
      if(!confirm(`Are you sure you want to ${newStatus === 'banned' ? 'ban' : 'unban'} this user?`)) return;
      await updateDoc(doc(db, 'users', id), { status: newStatus });
      toast.success(`User is now ${newStatus}`);
      fetchData();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${id}`);
    }
  };

  const grantPremium = async (id: string, days: number) => {
    try {
      const ms = days * 24 * 60 * 60 * 1000;
      const premiumUntil = Date.now() + ms; // Add to current logic later if needed
      await updateDoc(doc(db, 'users', id), { premiumUntil });
      toast.success(`Granted ${days} days of premium!`);
      fetchData();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${id}`);
    }
  };

  const handleApproveRequest = async (reqId: string, userId: string, days: number) => {
    try {
      const user = users.find(u => u.id === userId);
      const ms = days * 24 * 60 * 60 * 1000;
      const current = user?.premiumUntil || 0;
      const newUntil = current > Date.now() ? current + ms : Date.now() + ms;

      await updateDoc(doc(db, 'premiumRequests', reqId), { status: 'approved' });
      await updateDoc(doc(db, 'users', userId), { premiumUntil: newUntil });
      
      toast.success('Request approved');
      fetchData();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `premiumRequests/${reqId}`);
    }
  };

  if (loading) return <div className="p-8 font-medium text-[#444746] text-center">Loading admin panel...</div>;

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center gap-4 bg-[#0B57D0] text-white p-6 rounded-[1.75rem] shadow-sm">
           <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Shield size={24} />
           </div>
           <div>
             <h2 className="text-2xl font-bold">Admin Panel</h2>
             <p className="text-[#A8C7FA] font-medium text-[13px]">Manage shop users and premium access</p>
           </div>
        </div>

        <AdminNotifications />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <h3 className="text-xl font-bold text-[#1F1F1F] mb-4">Pending Upgrades</h3>
            <div className="space-y-4">
               {requests.filter(r => r.status === 'pending').map(req => (
                 <Card key={req.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-[#EAEEEF] shadow-sm bg-white">
                   <div>
                     <h4 className="font-bold text-[#1F1F1F]">{req.shopName} <span className="text-[#444746] font-medium text-[13px]">({req.mobile})</span></h4>
                     <p className="text-[13px] font-bold text-[#0B57D0]">
                       {req.paymentMethod} • TrxID: {req.transactionId} • ৳ {req.amount}
                     </p>
                     <p className="text-[12px] font-medium text-[#444746] mt-1">
                       Plan: {req.planName} ({req.durationDays} days) • {req.timestamp ? format(req.timestamp.toDate(), 'PP p') : ''}
                     </p>
                   </div>
                   <Button size="sm" onClick={() => handleApproveRequest(req.id, req.userId, req.durationDays)}>
                     Approve & Grant {req.durationDays} Days
                   </Button>
                 </Card>
               ))}
               {requests.filter(r => r.status === 'pending').length === 0 && (
                 <div className="p-6 text-center text-[#444746] bg-white rounded-[1.75rem] border border-[#EAEEEF] font-medium">
                   No pending upgrade requests.
                 </div>
               )}
            </div>
          </div>
        </div>

        <AdminAboutUs />

        <h3 className="text-xl font-bold text-[#1F1F1F] mb-4">User Management</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map(u => (
            <Card key={u.id} className={`relative border ${u.status === 'banned' ? 'border-[#B3261E]/30 bg-[#F9DEDC]/20' : 'border-[#EAEEEF] bg-white'}`}>
              <div className="absolute top-4 right-4 text-[11px] font-bold px-2 py-1 rounded-md uppercase tracking-wider bg-[#F0F4F8] text-[#444746]">
                {u.role}
              </div>
              <h3 className="text-lg font-bold text-[#1F1F1F] pr-16">{u.shopName}</h3>
              <p className="text-[13px] font-medium text-[#444746] mb-4">{u.ownerName} • {u.mobile}</p>
              
              <div className={`text-[12px] font-bold mb-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full 
                ${u.status === 'active' ? 'bg-[#C4EED0] text-[#072711]' : 'bg-[#F9DEDC] text-[#8C1D18]'}`}>
                {u.status === 'active' ? <CheckCircle size={14} /> : <Ban size={14} />}
                {u.status.toUpperCase()}
              </div>

              <div className="border-t border-[#EAEEEF] pt-4 mt-2">
                <p className="text-[11px] font-bold text-[#444746] mb-2 uppercase tracking-wider">Actions</p>
                <div className="flex gap-2 mb-4">
                  <Button 
                    size="sm" 
                    variant={u.status === 'active' ? 'danger' : 'filled'}
                    className="flex-1 rounded-full text-[13px]"
                    onClick={() => toggleStatus(u.id, u.status)}
                  >
                    {u.status === 'active' ? 'Ban User' : 'Unban User'}
                  </Button>
                </div>
                
                <p className="text-[11px] font-bold text-[#444746] mb-2 uppercase tracking-wider">Premium Access</p>
                <p className="text-[13px] font-bold text-[#0B57D0] mb-2">
                  {u.premiumUntil > Date.now() ? `Until: ${format(new Date(u.premiumUntil), 'dd MMM yyyy')}` : 'No Premium Access'}
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="tonal" className="flex-1 rounded-full text-[13px]" onClick={() => grantPremium(u.id, 30)}>+30 Days</Button>
                  <Button size="sm" variant="tonal" className="flex-1 rounded-full text-[13px]" onClick={() => grantPremium(u.id, 365)}>+1 Year</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </PageTransition>
  );
}
