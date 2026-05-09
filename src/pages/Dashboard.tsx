import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui';
import { useAuth } from '../lib/auth';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, getDocs, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Wallet, TrendingUp, Package, MoveUpRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { PageTransition } from '../components/PageTransition';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalSales: 0, totalProfit: 0, productsCount: 0 });
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    setLoading(true);

    const salesQ = query(collection(db, 'sales'), where('userId', '==', user.uid));
    const unsubscribeSales = onSnapshot(salesQ, (salesSnap) => {
      const sales = salesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      sales.sort((a: any, b: any) => {
         if(!a.timestamp || !b.timestamp) return 0;
         return b.timestamp.seconds - a.timestamp.seconds;
      });

      let totalS = 0;
      let totalP = 0;
      const cDataMap: Record<string, number> = {};

      sales.forEach((s: any) => {
        totalS += s.totalAmount || 0;
        totalP += s.profit || 0;
        
        if(s.timestamp) {
          const dStr = format(s.timestamp.toDate(), 'MMM dd');
          cDataMap[dStr] = (cDataMap[dStr] || 0) + s.totalAmount;
        }
      });

      const cData = Object.keys(cDataMap).reverse().map(k => ({ date: k, sales: cDataMap[k] }));

      setStats(prev => ({ ...prev, totalSales: totalS, totalProfit: totalP }));
      setRecentSales(sales.slice(0, 5));
      setChartData(cData.length ? cData : [{ date: format(new Date(), 'MMM dd'), sales: 0 }]);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'sales');
      setLoading(false);
    });

    const prodsQ = query(collection(db, 'products'), where('userId', '==', user.uid));
    const unsubscribeProds = onSnapshot(prodsQ, (prodsSnap) => {
      setStats(prev => ({ ...prev, productsCount: prodsSnap.size }));
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'products');
    });

    return () => {
      unsubscribeSales();
      unsubscribeProds();
    };
  }, [user]);

  if (loading) return <div className="p-8 text-[#444746] font-medium text-center">ড্যাশবোর্ড লোড হচ্ছে...</div>;

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-[#D3E3FD] text-[#041E49]">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-[#0B57D0]/10 p-3 rounded-full text-[#0B57D0]"><Wallet size={24} /></div>
              <h3 className="font-bold text-lg">মোট বিক্রি</h3>
            </div>
            <p className="text-[2.5rem] leading-none font-bold tracking-tight">৳ {stats.totalSales.toLocaleString()}</p>
          </Card>
          
          <Card className="bg-[#C4EED0] text-[#072711]">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-[#146C2E]/10 p-3 rounded-full text-[#146C2E]"><TrendingUp size={24} /></div>
              <h3 className="font-bold text-lg">মোট লাভ</h3>
            </div>
            <p className="text-[2.5rem] leading-none font-bold tracking-tight">৳ {stats.totalProfit.toLocaleString()}</p>
          </Card>

          <Card className="bg-[#F0D9FF] text-[#2F005B]">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-[#6500CC]/10 p-3 rounded-full text-[#6500CC]"><Package size={24} /></div>
              <h3 className="font-bold text-lg">পণ্যসমূহ</h3>
            </div>
            <p className="text-[2.5rem] leading-none font-bold tracking-tight">{stats.productsCount}</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 shadow-sm border border-[#EAEEEF]">
            <h3 className="text-xl font-bold text-[#1F1F1F] mb-6">বিক্রির ওভারভিউ</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0B57D0" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#0B57D0" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#444746', fontSize: 13, fontWeight: 500}} dy={15} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#444746', fontSize: 13, fontWeight: 500}} dx={-10} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '1.25rem', border: 'none', boxShadow: '0 4px 20px rgb(0 0 0 / 0.1)', padding: '12px 20px' }}
                    itemStyle={{ color: '#1F1F1F', fontWeight: 'bold' }}
                    cursor={{ stroke: '#0B57D0', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area type="monotone" dataKey="sales" stroke="#0B57D0" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="shadow-sm border border-[#EAEEEF]">
            <div className="flex items-center justify-between mb-6">
               <h3 className="text-xl font-bold text-[#1F1F1F]">সাম্প্রতিক বিক্রি</h3>
            </div>
            <div className="space-y-4">
              {recentSales.map(sale => (
                <div key={sale.id} className="flex items-center justify-between p-4 rounded-[1rem] bg-[#F0F4F8] hover:bg-[#EAEEEF] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="bg-[#C4EED0] p-3 rounded-full text-[#146C2E]">
                      <MoveUpRight size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#1F1F1F] truncate max-w-[120px] sm:max-w-[180px]">{sale.productName}</h4>
                      <p className="text-[13px] text-[#444746] font-medium">{sale.paymentMethod} • x{sale.quantity}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#1F1F1F]">৳ {sale.totalAmount}</p>
                    <p className="text-[13px] text-[#146C2E] font-bold">+ ৳ {sale.profit}</p>
                  </div>
                </div>
              ))}
              {recentSales.length === 0 && (
                <p className="text-[#444746] text-center py-6 font-medium bg-[#F0F4F8] rounded-[1rem]">কোনো বিক্রি নেই।</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
