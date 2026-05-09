import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import { Card } from '../components/ui';
import { PageTransition } from '../components/PageTransition';
import { format } from 'date-fns';
import { Bell, AlertTriangle } from 'lucide-react';
import { useAuth } from '../lib/auth';

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        const notifsQ = query(collection(db, 'notifications'), orderBy('timestamp', 'desc'));
        const notifsSnap = await getDocs(notifsQ);
        const notifs = notifsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        // filter by userId if the notification belongs to this user or global
        setNotifications(notifs.filter((n: any) => !n.userId || n.userId === user.uid));

        const productsQ = query(collection(db, 'products'), where('userId', '==', user.uid), where('stock', '<=', 5));
        const productsSnap = await getDocs(productsQ);
        setLowStockProducts(productsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'notifications');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  return (
    <PageTransition>
      <div className="space-y-4 max-w-2xl mx-auto min-h-[80vh] pb-24">
        <h2 className="text-2xl font-bold text-[#1F1F1F] mb-6 flex items-center gap-3">
          <Bell className="text-[#0B57D0]" /> System Notifications
        </h2>

        {loading ? (
          <p className="text-center font-medium text-[#444746] py-10">Loading...</p>
        ) : (
          <div className="space-y-4">
            {lowStockProducts.map(p => (
              <Card key={`stock-${p.id}`} className="border border-[#F9DEDC] bg-[#F9DEDC]/20 shadow-sm relative overflow-hidden">
                <div className="w-1.5 h-full bg-[#B3261E] absolute top-0 left-0" />
                <div className="pl-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-[#8C1D18] leading-tight flex items-center gap-2">
                      <AlertTriangle size={18} /> লো স্টক অ্যালার্ট
                    </h3>
                    <span className="text-[12px] font-bold text-[#B3261E] bg-[#F9DEDC] px-2 py-1 rounded-md shrink-0">
                      অ্যাকশন প্রয়োজন
                    </span>
                  </div>
                  <p className="text-[#8C1D18] text-[15px] leading-relaxed">
                    <strong>{p.name}</strong> এর স্টক কমে যাচ্ছে। স্টকে মাত্র {p.stock} টি আছে।
                  </p>
                </div>
              </Card>
            ))}

            {notifications.map((n: any) => (
              <Card key={n.id} className="border border-[#EAEEEF] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                 <div className="w-1.5 h-full bg-[#0B57D0] absolute top-0 left-0" />
                 <div className="pl-4">
                   <div className="flex justify-between items-start mb-2">
                     <h3 className="font-bold text-lg text-[#1F1F1F] leading-tight">{n.title}</h3>
                     <span className="text-[12px] font-bold text-[#444746] bg-[#F0F4F8] px-2 py-1 rounded-md shrink-0">
                       {n.timestamp ? format(n.timestamp.toDate(), 'dd MMM') : ''}
                     </span>
                   </div>
                   <p className="text-[#444746] text-[15px] leading-relaxed">{n.message}</p>
                 </div>
              </Card>
            ))}

            {(notifications.length === 0 && lowStockProducts.length === 0) && (
              <div className="text-center py-16 bg-white rounded-[1.75rem] border border-[#EAEEEF]">
                <Bell size={40} className="mx-auto text-[#444746] opacity-30 mb-4" />
                <p className="font-bold text-[#1F1F1F] text-lg">সব ঠিক আছে!</p>
                <p className="font-medium text-[#444746]">নতুন কোনো নোটিফিকেশন নেই।</p>
              </div>
            )}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
