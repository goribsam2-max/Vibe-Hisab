import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { Button, Input, Card } from '../components/ui';
import { PageTransition } from '../components/PageTransition';
import toast from 'react-hot-toast';
import { Store, User, Phone, Lock, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../lib/auth';

export default function Signup() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1 && !shopName) return toast.error('Enter shop name');
    if (step === 2 && !ownerName) return toast.error('Enter owner name');
    if (step === 3 && !mobile) return toast.error('Enter mobile number');
    setStep(step + 1);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) return toast.error('Enter password');
    if (password !== confirmPassword) return toast.error('Passwords do not match');
    
    setLoading(true);
    try {
      const formattedMobile = mobile.trim();
      const email = `${formattedMobile}@hisabnikash.com`;
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      
      const role = (formattedMobile === 'admin' || formattedMobile === '01747708843') ? 'admin' : 'user';

      try {
        await setDoc(doc(db, 'users', cred.user.uid), {
          shopName: shopName.trim(),
          ownerName: ownerName.trim(),
          mobile: formattedMobile,
          role,
          status: 'active',
          premiumUntil: 0
        });
      } catch(err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${cred.user.uid}`);
      }
      toast.success('স্বাগতম!');
      navigate('/');
    } catch (err: any) {
      console.error(err);
      let errorMsg = 'রেজিস্ট্রেশন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।';
      if (err.code === 'auth/email-already-in-use') {
        errorMsg = 'এই মোবাইল নাম্বার দিয়ে ইতিমধ্যে অ্যাকাউন্ট তৈরি করা হয়েছে।';
      } else if (err.code === 'auth/weak-password') {
        errorMsg = 'পাসওয়ার্ড অত্যন্ত দুর্বল। কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন।';
      } else if (err.code === 'auth/invalid-email') {
        errorMsg = 'ভুল মোবাইল নাম্বার। দয়া করে সঠিক নাম্বার দিন।';
      } else if (err.code === 'auth/operation-not-allowed') {
        errorMsg = 'Firebase Console থেকে Email/Password Authentication চালু করতে হবে।';
      }
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const variants = {
    enter: { opacity: 0, x: 20 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F0F4F8] flex flex-col items-center justify-center p-4">
        
        <div className="w-full max-w-[400px]">
          <div className="flex gap-2 justify-center mb-8">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className={`h-2 rounded-full transition-all ${s <= step ? 'w-full bg-[#0B57D0]' : 'w-4 bg-[#D3E3FD]'}`} />
            ))}
          </div>

          <Card className="shadow-lg shadow-black/5 min-h-[380px] flex flex-col relative overflow-hidden">
             
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="1" variants={variants} initial="enter" animate="center" exit="exit" className="flex-1 flex flex-col justify-center">
                  <div className="w-16 h-16 bg-[#D3E3FD] rounded-full flex items-center justify-center text-[#0B57D0] mb-6 shadow-sm mx-auto">
                    <Store size={32} />
                  </div>
                  <h2 className="text-2xl font-bold text-[#1F1F1F] mb-2 text-center">আপনার শপের নাম কি?</h2>
                  <p className="text-[#444746] text-center mb-8">এটি আপনার ড্যাশবোর্ড এবং রসিদে দেখানো হবে।</p>
                  <form onSubmit={handleNext}>
                    <Input autoFocus placeholder="যেমন: এম এস এন্টারপ্রাইজ" value={shopName} onChange={(e) => setShopName(e.target.value)} className="text-center text-xl font-bold" />
                    <Button type="submit" className="w-full mt-6 h-[56px] rounded-full text-lg shadow-md">পরবর্তী স্ক্রিন</Button>
                  </form>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="2" variants={variants} initial="enter" animate="center" exit="exit" className="flex-1 flex flex-col justify-center">
                  <div className="w-16 h-16 bg-[#D3E3FD] rounded-full flex items-center justify-center text-[#0B57D0] mb-6 shadow-sm mx-auto">
                    <User size={32} />
                  </div>
                  <h2 className="text-2xl font-bold text-[#1F1F1F] mb-2 text-center">শপের মালিক কে?</h2>
                  <p className="text-[#444746] text-center mb-8">মালিকের নাম লিখুন।</p>
                  <form onSubmit={handleNext}>
                    <Input autoFocus placeholder="যেমন: রকিব হাসান" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} className="text-center text-xl font-bold" />
                    <Button type="submit" className="w-full mt-6 h-[56px] rounded-full text-lg shadow-md">পরবর্তী স্ক্রিন</Button>
                  </form>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="3" variants={variants} initial="enter" animate="center" exit="exit" className="flex-1 flex flex-col justify-center">
                  <div className="w-16 h-16 bg-[#D3E3FD] rounded-full flex items-center justify-center text-[#0B57D0] mb-6 shadow-sm mx-auto">
                    <Phone size={32} />
                  </div>
                  <h2 className="text-2xl font-bold text-[#1F1F1F] mb-2 text-center">মোবাইল নাম্বার</h2>
                  <p className="text-[#444746] text-center mb-8">এই নাম্বার দিয়ে আপনি সবসময় লগইন করবেন।</p>
                  <form onSubmit={handleNext}>
                    <Input autoFocus type="tel" placeholder="যেমন: 017xxxxxxxx" value={mobile} onChange={(e) => setMobile(e.target.value)} className="text-center text-xl font-bold tracking-widest" />
                    <Button type="submit" className="w-full mt-6 h-[56px] rounded-full text-lg shadow-md">পরবর্তী স্ক্রিন</Button>
                  </form>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div key="4" variants={variants} initial="enter" animate="center" exit="exit" className="flex-1 flex flex-col justify-center">
                  <div className="w-16 h-16 bg-[#D3E3FD] rounded-full flex items-center justify-center text-[#0B57D0] mb-6 shadow-sm mx-auto">
                    <Lock size={32} />
                  </div>
                  <h2 className="text-2xl font-bold text-[#1F1F1F] mb-2 text-center">অ্যাকাউন্ট সুরক্ষিত করুন</h2>
                  <p className="text-[#444746] text-center mb-8">একটি শক্তিশালী পাসওয়ার্ড তৈরি করুন।</p>
                  <form onSubmit={handleSignup} className="space-y-4">
                    <Input autoFocus type="password" placeholder="পাসওয়ার্ড" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <Input type="password" placeholder="পাসওয়ার্ড নিশ্চিত করুন" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                    <Button type="submit" disabled={loading} className="w-full mt-2 h-[56px] rounded-full text-lg shadow-md">
                      {loading ? 'অ্যাকাউন্ট তৈরি হচ্ছে...' : 'সেটআপ শেষ করুন'}
                    </Button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

          </Card>

          <div className="mt-8 text-center text-[#444746] font-medium">
            আপনার কি আগে থেকেই অ্যাকাউন্ট আছে? <Link to="/login" className="text-[#0B57D0] hover:text-[#0a4fc0] font-bold ml-1">লগইন করুন</Link>
          </div>
        </div>

      </div>
    </PageTransition>
  );
}
