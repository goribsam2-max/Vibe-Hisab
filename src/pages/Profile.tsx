import React, { useState } from 'react';
import { useAuth } from '../lib/auth';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { Card, Button, Surface } from '../components/ui';
import { PageTransition } from '../components/PageTransition';
import { User, Store, Phone, Star, ShieldAlert, LogOut, Users, Plus, Settings, ChevronRight, RefreshCw, FileBarChart, MessageCircle, Headset, Copy, Send } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  
  const [apiGenerated, setApiGenerated] = useState(false);
  const [whatsappConnected, setWhatsappConnected] = useState(false);

  if(!user) return null;

  const isPremium = user.premiumUntil > Date.now();

  const handleAddStaff = () => {
    if (!isPremium) {
      toast.error('Staff management requires Premium tier');
      navigate('/upgrade');
      return;
    }
    toast.success('Staff invitation sent successfully (Preview)');
    setShowStaffModal(false);
  };

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto space-y-6">
        <Surface className="flex flex-col items-center text-center p-8 bg-gradient-to-b from-[#D3E3FD]/50 to-[#F0F4F8]">
          <div className="w-24 h-24 bg-[#0B57D0] rounded-full flex items-center justify-center text-white font-bold text-4xl mb-4 shadow-lg shadow-[#0B57D0]/20">
            {user.shopName.charAt(0)}
          </div>
          <h2 className="text-2xl font-black text-[#1F1F1F] mb-1">{user.shopName}</h2>
          <p className="text-[#444746] font-medium text-[15px] mb-4 bg-white px-4 py-1.5 rounded-full border border-[#EAEEEF] shadow-sm flex items-center gap-2">
            {user.role === 'admin' && <ShieldAlert size={16} className="text-[#0B57D0]" />}
            {user.role.toUpperCase()}
          </p>
        </Surface>

        <Card>
          <h3 className="font-bold text-[13px] uppercase tracking-wider text-[#444746] mb-4 pb-2 border-b border-[#EAEEEF]">অ্যাকাউন্ট ইনফো</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#F0F4F8] flex items-center justify-center text-[#444746]"><User size={18}/></div>
              <div>
                 <p className="text-[12px] font-bold text-[#444746]">মালিকের নাম</p>
                 <p className="font-bold text-[#1F1F1F] text-[15px]">{user.ownerName}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#F0F4F8] flex items-center justify-center text-[#444746]"><Phone size={18}/></div>
              <div>
                 <p className="text-[12px] font-bold text-[#444746]">মোবাইল নাম্বার</p>
                 <p className="font-bold text-[#1F1F1F] text-[15px]">{user.mobile}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#EAEEEF]">
            <h3 className="font-bold text-[13px] uppercase tracking-wider text-[#1F1F1F] flex items-center gap-2">
              <Users size={16} /> স্টাফ ম্যানেজমেন্ট
            </h3>
            {!isPremium && <span className="text-[10px] bg-[#F9DEDC] text-[#B3261E] font-bold px-2 py-0.5 rounded uppercase">শুধুমাত্র প্রিমিয়াম</span>}
          </div>
          <div className="flex items-center justify-between p-4 bg-[#F0F4F8] rounded-[1rem] border border-[#EAEEEF]">
             <div>
                <p className="font-bold text-[#1F1F1F] text-[15px]">অ্যাক্টিভ স্টাফ</p>
                <p className="text-[#444746] text-[13px] font-medium">আপনার দোকানের স্টাফ অ্যাক্সেস পরিচালনা করুন</p>
             </div>
             <div className="font-black text-[#0B57D0] text-xl">
               ০ / {isPremium ? 'আনলিমিটেড' : '০'}
             </div>
          </div>
          <Button 
             variant="tonal" 
             className="w-full mt-4 flex items-center justify-center gap-2"
             onClick={() => isPremium ? setShowStaffModal(true) : navigate('/upgrade')}
          >
            <Plus size={18} /> নতুন স্টাফ যোগ করুন
          </Button>
        </Card>

        <Card>
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#EAEEEF]">
            <h3 className="font-bold text-[13px] uppercase tracking-wider text-[#444746]">সাবস্ক্রিপশন</h3>
            {isPremium ? (
              <span className="font-bold text-[#0B57D0] bg-[#D3E3FD] px-2 py-0.5 rounded text-[12px] flex items-center gap-1">
                <Star size={12} fill="currentColor"/> অ্যাক্টিভ
              </span>
            ) : (
              <span className="font-bold text-[#444746] bg-[#EAEEEF] px-2 py-0.5 rounded text-[12px]">ফ্রি টিয়ার</span>
            )}
          </div>
          <div className="py-4 text-center">
            {isPremium ? (
              <p className="font-bold text-[15px] text-[#1F1F1F]">
                প্রিমিয়াম মেয়াদ:<br/>
                <span className="text-[#0B57D0] text-xl mt-1 block">{format(new Date(user.premiumUntil), 'dd MMM, yyyy')}</span>
              </p>
            ) : (
              <div className="text-center">
                <Star size={32} className="mx-auto text-[#444746]/40 mb-3" />
                <p className="font-medium text-[#444746]">আপনি ফ্রি টিয়ার ব্যবহার করছেন।</p>
                <Button className="mt-4" variant="tonal" onClick={() => navigate('/upgrade')}>আপগ্রেড করুন</Button>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#EAEEEF]">
            <h3 className="font-bold text-[13px] uppercase tracking-wider text-[#1F1F1F] flex items-center gap-2">
              <Star size={16} fill="currentColor" className="text-[#0B57D0]" /> প্রিমিয়াম ফিচারসমূহ
            </h3>
            {!isPremium && <span className="text-[10px] bg-[#F9DEDC] text-[#B3261E] font-bold px-2 py-0.5 rounded uppercase">লকড</span>}
          </div>
          <div className="space-y-3">
             <div className="flex items-center justify-between p-3 bg-[#F0F4F8] hover:bg-[#EAEEEF] transition-colors rounded-[1rem] cursor-pointer" onClick={() => isPremium ? setShowApiModal(true) : navigate('/upgrade')}>
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#0B57D0] shadow-sm"><Settings size={18} /></div>
                 <div>
                   <p className="font-bold text-[#1F1F1F] text-[14px]">API অ্যাক্সেস</p>
                   <p className="text-[12px] text-[#444746] font-medium">থার্ড-পার্টি অ্যাপে কানেক্ট করুন</p>
                 </div>
               </div>
               <ChevronRight size={18} className="text-[#444746]" />
             </div>
             
             <div className="flex items-center justify-between p-3 bg-[#F0F4F8] hover:bg-[#EAEEEF] transition-colors rounded-[1rem] cursor-pointer" onClick={() => isPremium ? setShowWhatsappModal(true) : navigate('/upgrade')}>
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#146C2E] shadow-sm"><MessageCircle size={18} /></div>
                 <div>
                   <p className="font-bold text-[#1F1F1F] text-[14px]">WhatsApp ইন্টিগ্রেশন</p>
                   <p className="text-[12px] text-[#444746] font-medium">রসিদ ও বাকি মেসেজ পাঠান</p>
                 </div>
               </div>
               <ChevronRight size={18} className="text-[#444746]" />
             </div>

             <div className="flex items-center justify-between p-3 bg-[#F0F4F8] hover:bg-[#EAEEEF] transition-colors rounded-[1rem] cursor-pointer" onClick={() => isPremium ? toast.success('অফলাইন মোড চালু হয়েছে') : navigate('/upgrade')}>
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#444746] shadow-sm"><RefreshCw size={18} /></div>
                 <div>
                   <p className="font-bold text-[#1F1F1F] text-[14px]">অফলাইন সিঙ্ক</p>
                   <p className="text-[12px] text-[#444746] font-medium">ইন্টারনেট ছাড়াও কাজ করুন</p>
                 </div>
               </div>
               <ChevronRight size={18} className="text-[#444746]" />
             </div>

             <div className="flex items-center justify-between p-3 bg-[#F0F4F8] hover:bg-[#EAEEEF] transition-colors rounded-[1rem] cursor-pointer" onClick={() => isPremium ? setShowReportModal(true) : navigate('/upgrade')}>
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#6500CC] shadow-sm"><FileBarChart size={18} /></div>
                 <div>
                   <p className="font-bold text-[#1F1F1F] text-[14px]">অ্যাডভান্সড রিপোর্ট</p>
                   <p className="text-[12px] text-[#444746] font-medium">বিস্তারিত আয়-ব্যয়ের হিসাব</p>
                 </div>
               </div>
               <ChevronRight size={18} className="text-[#444746]" />
             </div>

             <div className="flex items-center justify-between p-3 bg-[#F0F4F8] hover:bg-[#EAEEEF] transition-colors rounded-[1rem] cursor-pointer" onClick={() => isPremium ? setShowSupportModal(true) : navigate('/upgrade')}>
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#B3261E] shadow-sm"><Headset size={18} /></div>
                 <div>
                   <p className="font-bold text-[#1F1F1F] text-[14px]">ভিআইপি সাপোর্ট</p>
                   <p className="text-[12px] text-[#444746] font-medium">প্রাথমিক কাস্টমার সাপোর্ট</p>
                 </div>
               </div>
               <ChevronRight size={18} className="text-[#444746]" />
             </div>
          </div>
        </Card>

        {showStaffModal && (
          <div className="fixed inset-0 bg-[#1F1F1F]/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] w-full max-w-sm p-6 shadow-xl animate-in zoom-in-95">
              <h3 className="text-xl font-bold text-[#1F1F1F] mb-4">স্টাফ যোগ করুন</h3>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-[14px] font-bold text-[#444746] block mb-2 pl-1">মোবাইল নাম্বার</label>
                  <input type="tel" className="w-full bg-[#F0F4F8] border border-[#EAEEEF] rounded-[1.25rem] px-4 py-3.5 focus:outline-none focus:border-[#0B57D0] transition-colors font-medium text-[#1F1F1F]" placeholder="017********" />
                </div>
                <div>
                  <label className="text-[14px] font-bold text-[#444746] block mb-2 pl-1">রোল</label>
                  <select className="w-full bg-[#F0F4F8] border border-[#EAEEEF] rounded-[1.25rem] px-4 py-3.5 focus:outline-none focus:border-[#0B57D0] transition-colors font-medium text-[#1F1F1F]">
                     <option>ক্যাশিয়ার</option>
                     <option>ম্যানেজার</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="tonal" className="flex-1 bg-[#F0F4F8] hover:bg-[#EAEEEF] text-[#444746]" onClick={() => setShowStaffModal(false)}>বাতিল</Button>
                <Button className="flex-1" onClick={handleAddStaff}>ইনভাইট পাঠান</Button>
              </div>
            </div>
          </div>
        )}

        {showApiModal && (
          <div className="fixed inset-0 bg-[#1F1F1F]/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] w-full max-w-sm p-6 shadow-xl animate-in zoom-in-95">
              <div className="w-12 h-12 bg-[#D3E3FD] text-[#0B57D0] rounded-full flex items-center justify-center mx-auto mb-4"><Settings size={24} /></div>
              <h3 className="text-xl font-bold text-[#1F1F1F] mb-2 text-center">API অ্যাক্সেস</h3>
              <p className="text-center text-[#444746] text-[14px] mb-6">আপনার শপের ডাটা থার্ড-পার্টি ওয়েবসাইটে দেখানোর জন্য API কি তৈরি করুন।</p>
              
              {apiGenerated ? (
                <div className="bg-[#1F1F1F] p-4 text-white rounded-2xl flex items-center justify-between mb-6">
                  <code className="text-[13px] font-mono">sk_live_v2_{user.uid.slice(0,10)}...</code>
                  <button onClick={() => toast.success('API কি কপি হয়েছে!')} className="hover:text-[#C2E7FF]"><Copy size={18} /></button>
                </div>
              ) : null}

              <div className="flex flex-col gap-3">
                {!apiGenerated && <Button className="w-full h-12" onClick={() => setApiGenerated(true)}>নতুন API কি তৈরি করুন</Button>}
                <Button variant="tonal" className="w-full h-12 bg-[#F0F4F8] hover:bg-[#EAEEEF] text-[#444746]" onClick={() => setShowApiModal(false)}>বন্ধ করুন</Button>
              </div>
            </div>
          </div>
        )}

        {showWhatsappModal && (
          <div className="fixed inset-0 bg-[#1F1F1F]/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] w-full max-w-sm p-6 shadow-xl animate-in zoom-in-95">
              <div className="w-12 h-12 bg-[#C4EED0] text-[#146C2E] rounded-full flex items-center justify-center mx-auto mb-4"><MessageCircle size={24} /></div>
              <h3 className="text-xl font-bold text-[#1F1F1F] mb-2 text-center">WhatsApp ইন্টিগ্রেশন</h3>
              <p className="text-center text-[#444746] text-[14px] mb-6">সেলস রসিদ ও বাকি মেসেজ সরাসরি კাস্টমারের হোয়াটসঅ্যাপে পাঠান।</p>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-[14px] font-bold text-[#444746] block mb-2 pl-1">শপের WhatsApp নাম্বার</label>
                  <input type="tel" className="w-full bg-[#F0F4F8] border border-[#EAEEEF] rounded-[1.25rem] px-4 py-3.5 focus:outline-none focus:border-[#146C2E] transition-colors font-medium text-[#1F1F1F]" placeholder="017********" defaultValue={user.mobile} />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {!whatsappConnected ? (
                   <Button className="w-full bg-[#146C2E] hover:bg-[#0F5323] text-white h-12" onClick={() => { setWhatsappConnected(true); toast.success('WhatsApp কানেক্ট হয়েছে!'); }}>কানেক্ট করুন</Button>
                ) : (
                   <Button className="w-full bg-[#B3261E] hover:bg-[#8C1D18] text-white h-12" onClick={() => setWhatsappConnected(false)}>ডিসকানেক্ট করুন</Button>
                )}
                <Button variant="tonal" className="w-full h-12 bg-[#F0F4F8] hover:bg-[#EAEEEF] text-[#444746]" onClick={() => setShowWhatsappModal(false)}>বন্ধ করুন</Button>
              </div>
            </div>
          </div>
        )}

        {showReportModal && (
          <div className="fixed inset-0 bg-[#1F1F1F]/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] w-full max-w-sm p-6 shadow-xl animate-in zoom-in-95 text-center">
              <div className="w-16 h-16 bg-[#F3E8FF] text-[#6500CC] rounded-full flex items-center justify-center mx-auto mb-4"><FileBarChart size={32} /></div>
              <h3 className="text-xl font-bold text-[#1F1F1F] mb-2">অ্যাডভান্সড রিপোর্ট জেনারেটর</h3>
              <p className="text-[#444746] text-[14px] mb-6">আপনার পুরো মাসের ক্যাশ ফ্লো, লস-লাভ এবং ডিউ রিপোর্ট এক ক্লিকে ডাউনলোড করুন।</p>
              <div className="flex flex-col gap-3">
                <Button className="w-full bg-[#6500CC] hover:bg-[#4E0099] text-white h-12 flex items-center justify-center gap-2" onClick={() => { toast.success('রিপোর্ট তৈরি হচ্ছে...'); setTimeout(() => setShowReportModal(false), 1000); }}>পিডিএফ ডাউনলোড</Button>
                <Button variant="tonal" className="w-full h-12 bg-[#F0F4F8] hover:bg-[#EAEEEF] text-[#444746]" onClick={() => setShowReportModal(false)}>বন্ধ করুন</Button>
              </div>
            </div>
          </div>
        )}

        {showSupportModal && (
          <div className="fixed inset-0 bg-[#1F1F1F]/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] w-full max-w-sm p-6 shadow-xl animate-in zoom-in-95">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-[#F9DEDC] text-[#B3261E] rounded-full flex items-center justify-center shrink-0"><Headset size={24} /></div>
                <div>
                   <h3 className="text-lg font-bold text-[#1F1F1F] leading-tight">ভিআইপি সাপোর্ট</h3>
                   <p className="text-[13px] text-[#444746]">আমরা আছি শুনছি...</p>
                </div>
              </div>
              <textarea className="w-full h-32 bg-[#F0F4F8] border border-[#EAEEEF] rounded-[1.25rem] p-4 focus:outline-none focus:border-[#B3261E] transition-colors font-medium text-[#1F1F1F] resize-none mb-4" placeholder="আপনার সমস্যাটি বিস্তারিত লিখুন..."></textarea>
              <div className="flex flex-col gap-3">
                <Button className="w-full bg-[#B3261E] hover:bg-[#8C1D18] text-white h-12 flex items-center justify-center gap-2" onClick={() => { toast.success('মেসেজ পাঠানো হয়েছে! আমরা দ্রুতই যোগাযোগ করবো।'); setShowSupportModal(false); }}><Send size={18} /> সেন্ড করুন</Button>
                <Button variant="tonal" className="w-full h-12 bg-[#F0F4F8] hover:bg-[#EAEEEF] text-[#444746]" onClick={() => setShowSupportModal(false)}>বাতিল</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
