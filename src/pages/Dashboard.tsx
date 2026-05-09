import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui';
import { useAuth } from '../lib/auth';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { ArrowDown, ArrowUp, CalendarClock, HandCoins, Users, Package, Wallet, ShoppingCart, Banknote, ChevronRight, Filter } from 'lucide-react';
import { PageTransition } from '../components/PageTransition';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, isWithinInterval, subMonths } from 'date-fns';

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedMonth, setSelectedMonth] = useState(0); // 0 = Current, 1 = Last Month, 2 = 2 Months Ago

  // Raw Data
  const [sales, setSales] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [dueCollections, setDueCollections] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const salesQ = query(collection(db, 'sales'), where('userId', '==', user.uid));
    const unsubSales = onSnapshot(salesQ, (snap) => {
      setSales(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, err => handleFirestoreError(err, OperationType.GET, 'sales'));

    const expQ = query(collection(db, 'expenses'), where('userId', '==', user.uid));
    const unsubExp = onSnapshot(expQ, (snap) => {
      setExpenses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, err => handleFirestoreError(err, OperationType.GET, 'expenses'));

    const prodQ = query(collection(db, 'products'), where('userId', '==', user.uid));
    const unsubProd = onSnapshot(prodQ, (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, err => handleFirestoreError(err, OperationType.GET, 'products'));

    const custQ = query(collection(db, 'customers'), where('userId', '==', user.uid));
    const unsubCust = onSnapshot(custQ, (snap) => {
      setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, err => handleFirestoreError(err, OperationType.GET, 'customers'));

    const dueCollQ = query(collection(db, 'dueCollections'), where('userId', '==', user.uid));
    const unsubDueColl = onSnapshot(dueCollQ, (snap) => {
      setDueCollections(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => {
      unsubSales();
      unsubExp();
      unsubProd();
      unsubCust();
      unsubDueColl();
    };
  }, [user]);

  // Derived Stats based on selected month
  const targetDate = subMonths(new Date(), selectedMonth);
  const start = startOfMonth(targetDate);
  const end = endOfMonth(targetDate);

  // Filter helpers
  const isInMonth = (timestamp: any) => {
    if (!timestamp) return false;
    return isWithinInterval(timestamp.toDate(), { start, end });
  };

  const filteredSales = sales.filter(s => isInMonth(s.timestamp));
  const filteredExpenses = expenses.filter(e => isInMonth(e.timestamp));
  const filteredDueCols = dueCollections.filter(d => isInMonth(d.timestamp));

  // Calculations (Month specific)
  const totalSales = filteredSales.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
  const totalExpenses = filteredExpenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const totalDueCollected = filteredDueCols.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  
  // Overall Calculations (Regardless of month)
  // Or should it be month specific? Dues, Stocks are usually strictly current snapshot, not historical easily unless logged.
  // We'll show global stats for snapshot items (stock, overall due), and monthly for flows (sales, expenses, cash).
  
  const totalDue = customers.reduce((acc, curr) => acc + (curr.dueAmount || 0), 0);
  // Total stock & value
  let totalStockCount = 0;
  let totalStockValue = 0;
  products.forEach(p => {
    totalStockCount += (p.stock || 0);
    totalStockValue += ((p.stock || 0) * (p.buyPrice || 0));
  });

  const handCash = totalSales + totalDueCollected - totalExpenses; // Cash in hand roughly

  if (loading) return <div className="p-8 text-[#444746] font-medium text-center">লোড হচ্ছে...</div>;

  return (
    <PageTransition>
      <div className="space-y-6 pb-20">
        {/* Header Options */}
        <div className="flex items-center justify-between px-2">
          <div className="relative inline-flex items-center gap-2">
            <select 
              className="appearance-none bg-white border border-[#EAEEEF] rounded-full px-4 py-2 pr-10 text-[14px] font-bold text-[#1F1F1F] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/20"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
            >
              <option value={0}>চলতি মাস ({format(new Date(), 'MMM yy')})</option>
              <option value={1}>গত মাস ({format(subMonths(new Date(), 1), 'MMM yy')})</option>
              <option value={2}>{format(subMonths(new Date(), 2), 'MMMM yyyy')}</option>
            </select>
            <Filter size={16} className="absolute right-4 text-[#444746] pointer-events-none" />
          </div>
        </div>

        {/* Main Card */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-gradient-to-br from-[#625AF8] to-[#4537E9] rounded-[1.75rem] p-6 text-white shadow-xl shadow-[#625AF8]/20 relative overflow-hidden"
        >
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="text-center mb-6 relative z-10">
            <h2 className="text-white/80 font-medium text-[15px] mb-1">হাতে আছে</h2>
            <div className="text-4xl font-black tracking-tight">
              ৳ {handCash.toLocaleString()}
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1 bg-white rounded-2xl p-4 flex items-center justify-between text-[#1F1F1F] shadow-inner">
              <div>
                <p className="text-[12px] text-[#444746] font-medium mb-1">বিক্রি করেছেন</p>
                <p className="text-[16px] font-bold">৳ {totalSales.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 bg-[#C4EED0]/40 rounded-full flex items-center justify-center text-[#146C2E]">
                <ArrowDown size={20} strokeWidth={3} />
              </div>
            </div>
            <div className="flex-1 bg-white rounded-2xl p-4 flex items-center justify-between text-[#1F1F1F] shadow-inner">
              <div>
                <p className="text-[12px] text-[#444746] font-medium mb-1">কিনেছেন</p>
                <p className="text-[16px] font-bold">৳ {totalExpenses.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 bg-[#FAD2CF]/40 rounded-full flex items-center justify-center text-[#B3261E]">
                <ArrowUp size={20} strokeWidth={3} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* 2x2 Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-5 border border-[#FAD2CF] bg-[#FFF8F7] shadow-sm rounded-[1.5rem]">
            <div className="w-10 h-10 bg-[#F5B8B5]/40 rounded-full flex items-center justify-center text-[#B3261E] mb-3">
              <CalendarClock size={20} />
            </div>
            <p className="text-[#444746] text-[13px] font-medium mb-1">মোট বাকি</p>
            <p className="text-[#1F1F1F] text-[18px] font-bold">৳ {totalDue.toLocaleString()}</p>
          </Card>

          <Card className="p-5 border border-[#C2E7FF] bg-[#F4FAFF] shadow-sm rounded-[1.5rem]">
            <div className="w-10 h-10 bg-[#A8C7FA]/40 rounded-full flex items-center justify-center text-[#0B57D0] mb-3">
              <HandCoins size={20} />
            </div>
            <p className="text-[#444746] text-[13px] font-medium mb-1">মোট বাকি আদায়</p>
            <p className="text-[#1F1F1F] text-[18px] font-bold">৳ {totalDueCollected.toLocaleString()}</p>
          </Card>

          <Link to="/products" className="block">
            <Card className="p-5 border border-[#C4EED0] bg-[#F6FDF8] shadow-sm rounded-[1.5rem] flex items-end justify-between cursor-pointer hover:bg-[#E8F8EE] transition-colors">
              <div>
                <div className="w-10 h-10 bg-[#6DD58C]/30 rounded-full flex items-center justify-center text-[#146C2E] mb-3">
                  <Package size={20} />
                </div>
                <p className="text-[#444746] text-[13px] font-medium mb-1">পণ্য</p>
              </div>
              <div className="flex items-center text-[#146C2E] font-bold gap-1 mb-1">
                <span>{products.length}</span>
                <ChevronRight size={16} />
              </div>
            </Card>
          </Link>

          <Link to="/customers" className="block">
            <Card className="p-5 border border-[#FFD599] bg-[#FFFCF6] shadow-sm rounded-[1.5rem] flex items-end justify-between cursor-pointer hover:bg-[#FFF3E0] transition-colors">
              <div>
                <div className="w-10 h-10 bg-[#FFB233]/30 rounded-full flex items-center justify-center text-[#D97706] mb-3">
                  <Users size={20} />
                </div>
                <p className="text-[#444746] text-[13px] font-medium mb-1">পার্টি</p>
              </div>
              <div className="flex items-center text-[#D97706] font-bold gap-1 mb-1">
                <span>{customers.length}</span>
                <ChevronRight size={16} />
              </div>
            </Card>
          </Link>
        </div>

        {/* Vertical List Items */}
        <div className="bg-white rounded-[1.5rem] p-4 shadow-sm border border-[#EAEEEF] space-y-4">
          <Link to="/expenses" className="flex items-center justify-between bg-[#F0F4F8] p-4 rounded-[1.25rem] hover:bg-[#E8F8EE] transition-colors cursor-pointer group">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-[#B3261E] shadow-sm">
                 <Banknote size={24} />
               </div>
               <div>
                 <p className="text-[14px] font-medium text-[#444746] mb-0.5">মোট খরচ</p>
                 <p className="text-[16px] font-bold text-[#1F1F1F]">৳ {totalExpenses.toLocaleString()}</p>
               </div>
            </div>
            <ChevronRight size={20} className="text-[#747775] group-hover:text-[#B3261E] transition-colors" />
          </Link>

          <Link to="/products" className="flex items-center justify-between bg-[#F0F4F8] p-4 rounded-[1.25rem] hover:bg-[#E8F8EE] transition-colors cursor-pointer group">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-[#0B57D0] shadow-sm">
                 <ShoppingCart size={24} />
               </div>
               <div>
                 <p className="text-[14px] font-medium text-[#444746] mb-0.5">মোট স্টক</p>
                 <p className="text-[16px] font-bold text-[#1F1F1F]">{totalStockCount.toLocaleString()} টি</p>
               </div>
            </div>
            <ChevronRight size={20} className="text-[#747775] group-hover:text-[#0B57D0] transition-colors" />
          </Link>

          <Link to="/products" className="flex items-center justify-between bg-[#F0F4F8] p-4 rounded-[1.25rem] hover:bg-[#E8F8EE] transition-colors cursor-pointer group">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-[#B26E00] shadow-sm">
                 <Wallet size={24} />
               </div>
               <div>
                 <p className="text-[14px] font-medium text-[#444746] mb-0.5">স্টক মূল্য</p>
                 <p className="text-[16px] font-bold text-[#1F1F1F]">৳ {totalStockValue.toLocaleString()}</p>
               </div>
            </div>
            <ChevronRight size={20} className="text-[#747775] group-hover:text-[#B26E00] transition-colors" />
          </Link>

          <Link to="/cash-match" className="flex items-center justify-between bg-gradient-to-r from-[#D3E3FD] to-[#A8C7FA] p-4 rounded-[1.25rem] hover:opacity-90 transition-opacity cursor-pointer group shadow-sm mt-2">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-[#0B57D0] shadow-sm">
                 <HandCoins size={24} />
               </div>
               <div>
                 <p className="text-[14px] font-bold text-[#001D35] mb-0.5 tracking-tight">দিন শেষে ক্যাশ মিলান</p>
                 <p className="text-[12px] font-medium text-[#001D35]/80">বক্সের টাকা আর হিসাব মেলাই</p>
               </div>
            </div>
            <ChevronRight size={20} className="text-[#0B57D0]" />
          </Link>
        </div>

      </div>
    </PageTransition>
  );
}

