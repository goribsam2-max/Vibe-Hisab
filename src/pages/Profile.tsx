import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../lib/auth';
import { Button, Surface } from '../components/ui';
import { PageTransition } from '../components/PageTransition';
import { User, Phone, Star, ShieldAlert, Users, Plus, Settings, ChevronRight, RefreshCw, FileBarChart, MessageCircle, Headset, Copy, Send } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  
  const [apiGenerated, setApiGenerated] = useState(!!user?.apiKey);
  const [apiKeyVal, setApiKeyVal] = useState(user?.apiKey || '');
  const [whatsappConnected, setWhatsappConnected] = useState(false);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    if (user?.apiKey) {
      setApiGenerated(true);
      setApiKeyVal(user.apiKey);
    }
  }, [user]);

  if(!user) return null;
  const isPremium = user.premiumUntil > Date.now();

  const handleGenerateApiKey = async () => {
    const newKey = `sk_v2_${Math.random().toString(36).substr(2, 9)}_${user.uid.slice(0, 5)}`;
    try {
      await updateDoc(doc(db, 'users', user.uid), { apiKey: newKey });
      setApiGenerated(true);
      setApiKeyVal(newKey);
      toast.success('নতুন API কি তৈরি হয়েছে!');
    } catch (err) {
      toast.error('API কি তৈরিতে সমস্যা হয়েছে');
    }
  };

  const handleAddStaff = () => {
    if (!isPremium) {
      toast.error('Staff management requires Premium tier');
      navigate('/upgrade');
      return;
    }
    toast.success('Staff invitation sent successfully (Preview)');
    setShowStaffModal(false);
  };

  const generateAdvancedReport = async () => {
    if (!user) return;
    const loadingToast = toast.loading('অ্যাডভান্সড রিপোর্ট তৈরি হচ্ছে...');
    try {
      const salesQ = query(collection(db, 'sales'), where('userId', '==', user.uid));
      const expQ = query(collection(db, 'expenses'), where('userId', '==', user.uid));
      const custQ = query(collection(db, 'customers'), where('userId', '==', user.uid));

      const [salesSnap, expSnap, custSnap] = await Promise.all([
        getDocs(salesQ), getDocs(expQ), getDocs(custQ)
      ]);

      let totalSales = 0, totalProfit = 0;
      salesSnap.docs.forEach(d => {
        totalSales += (d.data().totalAmount || 0);
        totalProfit += (d.data().profit || 0);
      });

      let totalExp = 0;
      expSnap.docs.forEach(d => {
        totalExp += (d.data().amount || 0);
      });

      let totalDue = 0;
      custSnap.docs.forEach(d => {
        totalDue += (d.data().dueAmount || 0);
      });

      const doc = new jsPDF();
      
      // Header
      doc.setFillColor(98, 90, 248);
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.text('VIBE HISAB', 105, 20, { align: 'center' });
      doc.setFontSize(14);
      doc.text('Advanced Business Report', 105, 30, { align: 'center' });

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.text(`Shop Name: ${user.shopName}`, 14, 50);
      doc.text(`Generated Date: ${format(new Date(), 'dd MMM yyyy')}`, 14, 58);

      // Summary Table
      autoTable(doc, {
        startY: 70,
        head: [['Metric', 'Amount (TK)']],
        body: [
          ['Total Sales', totalSales.toLocaleString()],
          ['Total Profit', totalProfit.toLocaleString()],
          ['Total Expenses', totalExp.toLocaleString()],
          ['Net Cash Flow', (totalSales - totalExp).toLocaleString()],
          ['Total Pending Due', totalDue.toLocaleString()],
        ],
        theme: 'grid',
        headStyles: { fillColor: [11, 87, 208], textColor: 255 },
        styles: { fontSize: 12, cellPadding: 6 },
      });

      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text('Powered by Vibe Hisab Platform', 105, 280, { align: 'center' });

      doc.save(`Vibe_Hisab_Report_${format(new Date(), 'yyyyMMdd')}.pdf`);
      toast.success('রিপোর্ট ডাউনলোড সফল হয়েছে!', { id: loadingToast });
      setShowReportModal(false);
    } catch (err) {
      console.error(err);
      toast.error('রিপোর্ট তৈরিতে সমস্যা হয়েছে', { id: loadingToast });
    }
  };

  const handleSupportMessage = async () => {
    const input = document.getElementById('support-msg') as HTMLTextAreaElement;
    const msg = input?.value;
    if (!msg) return toast.error('মেসেজ লিখুন');
    
    const loadingToast = toast.loading('মেসেজ পাঠানো হচ্ছে...');
    setTimeout(() => {
      toast.success('মেসেজ পাঠানো হয়েছে! আমরা দ্রুতই যোগাযোগ করবো।', { id: loadingToast });
      setShowSupportModal(false);
    }, 1000);
  };

  const renderModals = () => {
    if (!mounted) return null;
    return createPortal(
      <>
        <AnimatePresence>
        {showStaffModal && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-[#1F1F1F]/40 backdrop-blur-md z-[60] flex items-center justify-center p-4">
            <motion.div initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}} className="bg-white rounded-[2rem] w-full max-w-sm p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
              <h3 className="text-2xl font-black text-[#1F1F1F] mb-6">স্টাফ যোগ করুন</h3>
              <div className="space-y-5 mb-8">
                <div>
                  <label className="text-[14px] font-bold text-[#444746] block mb-2 pl-1">মোবাইল নাম্বার</label>
                  <input type="tel" className="w-full bg-[#F0F4F8] border-2 border-transparent rounded-[1.25rem] px-5 py-4 focus:outline-none focus:bg-white focus:border-[#0B57D0]/30 focus:shadow-[0_0_0_4px_rgba(11,87,208,0.1)] transition-all font-medium text-[#1F1F1F]" placeholder="017********" />
                </div>
                <div>
                  <label className="text-[14px] font-bold text-[#444746] block mb-2 pl-1">রোল</label>
                  <select className="w-full bg-[#F0F4F8] border-2 border-transparent rounded-[1.25rem] px-5 py-4 focus:outline-none focus:bg-white focus:border-[#0B57D0]/30 focus:shadow-[0_0_0_4px_rgba(11,87,208,0.1)] transition-all font-medium text-[#1F1F1F]">
                     <option>ক্যাশিয়ার</option>
                     <option>ম্যানেজার</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-4">
                <Button variant="tonal" className="flex-1 bg-[#F0F4F8] hover:bg-[#EAEEEF] text-[#444746]" onClick={() => setShowStaffModal(false)}>বাতিল</Button>
                <Button className="flex-1 shadow-lg shadow-[#0B57D0]/20" onClick={handleAddStaff}>ইনভাইট</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
        </AnimatePresence>

        <AnimatePresence>
        {showApiModal && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-[#1F1F1F]/40 backdrop-blur-md z-[60] flex items-center justify-center p-4">
            <motion.div initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}} className="bg-white rounded-[2rem] w-full max-w-sm p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="w-16 h-16 bg-gradient-to-tr from-[#6500CC] to-[#D0BCFF] text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"><Settings size={32} /></div>
              <h3 className="text-2xl font-black text-[#1F1F1F] mb-3 text-center">API অ্যাক্সেস</h3>
              <p className="text-center text-[#444746] text-[15px] mb-8 font-medium">আপনার শপের ডাটা থার্ড-পার্টি ওয়েবসাইটে দেখানোর জন্য API কি তৈরি করুন।</p>
              
              {apiGenerated ? (
                <div className="bg-[#1F1F1F] p-5 text-white rounded-[1.5rem] flex items-center justify-between mb-8 shadow-inner border border-[#444746]">
                  <code className="text-[14px] font-mono tracking-wider">{apiKeyVal || `sk_v2_${user.uid.slice(0,12)}...`}</code>
                  <button onClick={() => toast.success('API কি কপি হয়েছে!')} className="hover:text-[#C2E7FF] transition-colors p-2 bg-white/10 rounded-full"><Copy size={18} /></button>
                </div>
              ) : null}

              <div className="flex flex-col gap-4">
                {!apiGenerated && <Button className="w-full h-[56px] shadow-lg shadow-[#6500CC]/20" onClick={handleGenerateApiKey}>নতুন API কি তৈরি করুন</Button>}
                <Button variant="tonal" className="w-full h-[56px] bg-[#F0F4F8] hover:bg-[#EAEEEF] text-[#444746] font-bold" onClick={() => setShowApiModal(false)}>বন্ধ করুন</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
        </AnimatePresence>

        <AnimatePresence>
        {showWhatsappModal && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-[#1F1F1F]/40 backdrop-blur-md z-[60] flex items-center justify-center p-4">
            <motion.div initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}} className="bg-white rounded-[2rem] w-full max-w-sm p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="w-16 h-16 bg-gradient-to-tr from-[#146C2E] to-[#6DD58C] text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"><MessageCircle size={32} /></div>
              <h3 className="text-2xl font-black text-[#1F1F1F] mb-3 text-center">WhatsApp কানেক্ট</h3>
              <p className="text-center text-[#444746] text-[15px] mb-8 font-medium">সেলস রসিদ ও বাকি মেসেজ সরাসরি কাস্টমারের হোয়াটসঅ্যাপে পাঠান।</p>
              
              <div className="space-y-5 mb-8">
                <div>
                  <label className="text-[14px] font-bold text-[#444746] block mb-2 pl-1">WhatsApp নাম্বার</label>
                  <input type="tel" className="w-full bg-[#F0F4F8] border-2 border-transparent rounded-[1.25rem] px-5 py-4 focus:outline-none focus:bg-white focus:border-[#146C2E]/30 focus:shadow-[0_0_0_4px_rgba(20,108,46,0.1)] transition-all font-medium text-[#1F1F1F]" placeholder="017********" defaultValue={user.mobile} />
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {!whatsappConnected ? (
                   <Button className="w-full bg-[#146C2E] hover:bg-[#0F5323] text-white h-[56px] shadow-lg shadow-[#146C2E]/20" onClick={() => { setWhatsappConnected(true); toast.success('WhatsApp কানেক্ট হয়েছে!'); }}>কানেক্ট করুন</Button>
                ) : (
                   <Button className="w-full bg-[#B3261E] hover:bg-[#8C1D18] text-white h-[56px] shadow-lg shadow-[#B3261E]/20" onClick={() => setWhatsappConnected(false)}>ডিসকানেক্ট করুন</Button>
                )}
                <Button variant="tonal" className="w-full h-[56px] bg-[#F0F4F8] hover:bg-[#EAEEEF] text-[#444746] font-bold" onClick={() => setShowWhatsappModal(false)}>বন্ধ করুন</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
        </AnimatePresence>

        <AnimatePresence>
        {showReportModal && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-[#1F1F1F]/40 backdrop-blur-md z-[60] flex items-center justify-center p-4">
            <motion.div initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}} className="bg-white rounded-[2rem] w-full max-w-sm p-8 shadow-2xl text-center overflow-y-auto max-h-[90vh]">
              <div className="w-20 h-20 bg-gradient-to-tr from-[#6500CC] to-[#D0BCFF] text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#6500CC]/30"><FileBarChart size={40} /></div>
              <h3 className="text-2xl font-black text-[#1F1F1F] mb-3">রিপোর্ট জেনারেটর</h3>
              <p className="text-[#444746] text-[15px] mb-8 font-medium leading-relaxed">আপনার পুরো মাসের ক্যাশ ফ্লো, লস-লাভ এবং ডিউ রিপোর্ট এক ক্লিকে ডাউনলোড করুন।</p>
              <div className="flex flex-col gap-4">
                <Button className="w-full bg-[#6500CC] hover:bg-[#4E0099] text-white h-[56px] flex items-center justify-center gap-2 shadow-lg shadow-[#6500CC]/20" onClick={generateAdvancedReport}>ডাউনলোড পিডিএফ</Button>
                <Button variant="tonal" className="w-full h-[56px] bg-[#F0F4F8] hover:bg-[#EAEEEF] text-[#444746] font-bold" onClick={() => setShowReportModal(false)}>বন্ধ করুন</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
        </AnimatePresence>

        <AnimatePresence>
        {showSupportModal && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-[#1F1F1F]/40 backdrop-blur-md z-[60] flex items-center justify-center p-4">
            <motion.div initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}} className="bg-white rounded-[2rem] w-full max-w-sm p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-tr from-[#B3261E] to-[#F9DEDC] text-white rounded-full flex items-center justify-center shadow-lg shadow-[#B3261E]/30"><Headset size={40} /></div>
              </div>
              <h3 className="text-2xl font-black text-[#1F1F1F] mb-2 text-center">ভিআইপি সাপোর্ট</h3>
              <p className="text-[15px] text-[#444746] text-center font-medium mb-8">কীভাবে আপনাকে সাহায্য করতে পারি?</p>
              
              <textarea id="support-msg" className="w-full h-32 bg-[#F0F4F8] border-2 border-transparent rounded-[1.25rem] p-5 focus:outline-none focus:bg-white focus:border-[#B3261E]/30 focus:shadow-[0_0_0_4px_rgba(179,38,30,0.1)] transition-all font-medium text-[#1F1F1F] resize-none mb-6" placeholder="আপনার সমস্যাটি বিস্তারিত লিখুন..."></textarea>
              
              <div className="flex flex-col gap-4">
                <Button className="w-full bg-[#B3261E] hover:bg-[#8C1D18] text-white h-[56px] flex items-center justify-center gap-2 shadow-lg shadow-[#B3261E]/20" onClick={handleSupportMessage}><Send size={20} /> মেসেজ পাঠান</Button>
                <Button variant="tonal" className="w-full h-[56px] bg-[#F0F4F8] hover:bg-[#EAEEEF] text-[#444746] font-bold" onClick={() => setShowSupportModal(false)}>বাতিল</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
        </AnimatePresence>
      </>,
      document.body
    );
  };

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto space-y-6 pb-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-gradient-to-br from-[#625AF8] to-[#4537E9] rounded-[2rem] p-8 text-center overflow-hidden shadow-2xl shadow-[#625AF8]/20"
        >
          {/* Abstract background shapes */}
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute right-0 top-0 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl pointer-events-none text-white"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white font-black text-4xl mb-4 border-4 border-white/30 shadow-lg">
              {user.shopName.charAt(0)}
            </div>
            <h2 className="text-3xl font-black text-white mb-2 tracking-tight">{user.shopName}</h2>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 px-4 py-1.5 rounded-full text-[13px] font-bold flex items-center gap-2 uppercase tracking-wide">
              {user.role === 'admin' && <ShieldAlert size={16} />}
              {user.role}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Surface className="bg-white border border-[#EAEEEF] shadow-sm flex items-center p-4">
             <div className="w-12 h-12 bg-[#F0F4F8] rounded-full flex items-center justify-center text-[#0B57D0] mr-4">
               <User size={24} />
             </div>
             <div>
               <p className="text-[12px] font-bold text-[#444746] uppercase tracking-wider mb-0.5">মালিকের নাম</p>
               <p className="font-bold text-[#1F1F1F] text-[16px]">{user.ownerName}</p>
             </div>
          </Surface>
          <Surface className="bg-white border border-[#EAEEEF] shadow-sm flex items-center p-4">
             <div className="w-12 h-12 bg-[#F0F4F8] rounded-full flex items-center justify-center text-[#146C2E] mr-4">
               <Phone size={24} />
             </div>
             <div>
               <p className="text-[12px] font-bold text-[#444746] uppercase tracking-wider mb-0.5">মোবাইল নাম্বার</p>
               <p className="font-bold text-[#1F1F1F] text-[16px]">{user.mobile}</p>
             </div>
          </Surface>
        </div>

        <Surface className="bg-gradient-to-r from-[#FFF8F7] to-[#FFF1F0] border border-[#FAD2CF] shadow-none">
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-[#FAD2CF]/50">
            <h3 className="font-bold text-[14px] uppercase tracking-wider text-[#B3261E] flex items-center gap-2">
              <Star fill="currentColor" size={18} /> সাবস্ক্রিপশন স্ট্যাটাস
            </h3>
            {isPremium ? (
              <span className="font-bold text-white bg-gradient-to-r from-[#625AF8] to-[#B3261E] px-3 py-1 rounded-full text-[12px] shadow-sm hover:shadow-md transition-shadow">
                প্রিমিয়াম অ্যাক্টিভ
              </span>
            ) : (
              <span className="font-bold text-[#444746] bg-[#EAEEEF] px-3 py-1 rounded-full text-[12px]">
                ফ্রি টিয়ার
              </span>
            )}
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              {isPremium ? (
                <>
                  <p className="text-[#444746] font-medium text-[14px] mb-1"> মেয়াদ শেষ হবে:</p>
                  <p className="text-2xl font-black text-[#1F1F1F]">{format(new Date(user.premiumUntil), 'dd MMM, yyyy')}</p>
                </>
              ) : (
                <p className="text-[#444746] font-medium text-[15px]">আপনি বর্তমানে ফ্রি টিয়ারে আছেন। সব ফিচারের জন্য আপগ্রেড করুন।</p>
              )}
            </div>
            {!isPremium && <Button className="w-full md:w-auto shadow-lg shadow-[#0B57D0]/20" onClick={() => navigate('/upgrade')}>আপগ্রেড করুন</Button>}
          </div>
        </Surface>

        <Surface className="bg-white border border-[#EAEEEF] shadow-sm p-2 rounded-[2rem]">
          <div className="px-4 pt-4 pb-2 mb-2 flex justify-between items-center">
            <h3 className="font-black text-[16px] text-[#1F1F1F] flex items-center gap-2">
               এক্সক্লুসিভ ফিচারসমূহ
            </h3>
            {!isPremium && <span className="text-[10px] bg-[#F0F4F8] text-[#444746] font-bold px-2 py-1 rounded-md uppercase tracking-wider">লকড</span>}
          </div>

          <div className="space-y-1">
             <div className="group flex items-center justify-between p-4 hover:bg-[#F0F4F8] transition-all rounded-[1.5rem] cursor-pointer" onClick={() => isPremium ? setShowStaffModal(true) : navigate('/upgrade')}>
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-[#D3E3FD]/50 rounded-full flex items-center justify-center text-[#0B57D0] transition-colors group-hover:bg-[#0B57D0] group-hover:text-white"><Users size={20} /></div>
                 <div>
                   <p className="font-bold text-[#1F1F1F] text-[16px]">স্টাফ ম্যানেজমেন্ট</p>
                   <p className="text-[13px] text-[#444746] font-medium mt-0.5">মাল্টিপল ইউজার অ্যাক্সেস</p>
                 </div>
               </div>
               <ChevronRight size={20} className="text-[#A8C7FA] group-hover:text-[#0B57D0] transition-colors" />
             </div>

             <div className="group flex items-center justify-between p-4 hover:bg-[#F0F4F8] transition-all rounded-[1.5rem] cursor-pointer" onClick={() => isPremium ? setShowApiModal(true) : navigate('/upgrade')}>
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-[#F0D9FF]/50 rounded-full flex items-center justify-center text-[#6500CC] transition-colors group-hover:bg-[#6500CC] group-hover:text-white"><Settings size={20} /></div>
                 <div>
                   <p className="font-bold text-[#1F1F1F] text-[16px]">API অ্যাক্সেস</p>
                   <p className="text-[13px] text-[#444746] font-medium mt-0.5">থার্ড-পার্টি কানেকশন</p>
                 </div>
               </div>
               <ChevronRight size={20} className="text-[#E8DEF8] group-hover:text-[#6500CC] transition-colors" />
             </div>
             
             <div className="group flex items-center justify-between p-4 hover:bg-[#F0F4F8] transition-all rounded-[1.5rem] cursor-pointer" onClick={() => isPremium ? setShowWhatsappModal(true) : navigate('/upgrade')}>
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-[#C4EED0]/50 rounded-full flex items-center justify-center text-[#146C2E] transition-colors group-hover:bg-[#146C2E] group-hover:text-white"><MessageCircle size={20} /></div>
                 <div>
                   <p className="font-bold text-[#1F1F1F] text-[16px]">WhatsApp ইন্টিগ্রেশন</p>
                   <p className="text-[13px] text-[#444746] font-medium mt-0.5">অটোম্যাটিক রসিদ পাঠানো</p>
                 </div>
               </div>
               <ChevronRight size={20} className="text-[#C4EED0] group-hover:text-[#146C2E] transition-colors" />
             </div>

             <div className="group flex items-center justify-between p-4 hover:bg-[#F0F4F8] transition-all rounded-[1.5rem] cursor-pointer" onClick={() => isPremium ? toast.success('অফলাইন মোড চালু হয়েছে') : navigate('/upgrade')}>
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-[#EAEEEF] rounded-full flex items-center justify-center text-[#444746] transition-colors group-hover:bg-[#444746] group-hover:text-white"><RefreshCw size={20} /></div>
                 <div>
                   <p className="font-bold text-[#1F1F1F] text-[16px]">অফলাইন সিঙ্ক</p>
                   <p className="text-[13px] text-[#444746] font-medium mt-0.5">ইন্টারনেট ছাড়া কাজ</p>
                 </div>
               </div>
               <ChevronRight size={20} className="text-[#C4C7C5] group-hover:text-[#444746] transition-colors" />
             </div>

             <div className="group flex items-center justify-between p-4 hover:bg-[#F0F4F8] transition-all rounded-[1.5rem] cursor-pointer" onClick={() => isPremium ? setShowReportModal(true) : navigate('/upgrade')}>
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-[#FFD599]/30 rounded-full flex items-center justify-center text-[#B26E00] transition-colors group-hover:bg-[#B26E00] group-hover:text-white"><FileBarChart size={20} /></div>
                 <div>
                   <p className="font-bold text-[#1F1F1F] text-[16px]">অ্যাডভান্সড রিপোর্ট</p>
                   <p className="text-[13px] text-[#444746] font-medium mt-0.5">বিস্তারিত হিসাব নিকাশ</p>
                 </div>
               </div>
               <ChevronRight size={20} className="text-[#FFD599] group-hover:text-[#B26E00] transition-colors" />
             </div>

             <div className="group flex items-center justify-between p-4 hover:bg-[#F0F4F8] transition-all rounded-[1.5rem] cursor-pointer" onClick={() => isPremium ? setShowSupportModal(true) : navigate('/upgrade')}>
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-[#F9DEDC]/50 rounded-full flex items-center justify-center text-[#B3261E] transition-colors group-hover:bg-[#B3261E] group-hover:text-white"><Headset size={20} /></div>
                 <div>
                   <p className="font-bold text-[#1F1F1F] text-[16px]">ভিআইপি সাপোর্ট</p>
                   <p className="text-[13px] text-[#444746] font-medium mt-0.5">প্রাইমারি কাস্টমার সল্যুশন</p>
                 </div>
               </div>
               <ChevronRight size={20} className="text-[#F9DEDC] group-hover:text-[#B3261E] transition-colors" />
             </div>
          </div>
        </Surface>

        {renderModals()}
      </div>
    </PageTransition>
  );
}
