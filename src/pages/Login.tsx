import React, { useState, useEffect } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { Button, Input, Card } from '../components/ui';
import { PageTransition } from '../components/PageTransition';
import toast from 'react-hot-toast';
import { useAuth } from '../lib/auth';

export default function Login() {
  const { user } = useAuth();
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobile || !password) return toast.error('Please fill all fields');
    
    setLoading(true);
    try {
      const formattedMobile = mobile.trim();
      const email = `${formattedMobile}@hisabnikash.com`;
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      
      // Auto-create special admin account if it doesn't exist
      if (mobile.trim() === '01747708843' && password === '95872555sS' && err.code === 'auth/invalid-credential') {
        try {
          const formattedMobile = mobile.trim();
          const email = `${formattedMobile}@hisabnikash.com`;
          const cred = await createUserWithEmailAndPassword(auth, email, password);
          await setDoc(doc(db, 'users', cred.user.uid), {
            shopName: 'Admin Panel',
            ownerName: 'Admin',
            mobile: mobile,
            role: 'admin',
            status: 'active',
            premiumUntil: Date.now() + 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
          });
          toast.success('Admin account auto-created and logged in!');
          navigate('/');
          return;
        } catch(createErr) {
          console.error(createErr);
        }
      }

      toast.error('ভুল মোবাইল নাম্বার বা পাসওয়ার্ড। দয়া করে আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className="w-24 h-24 bg-[#0B57D0] rounded-full flex items-center justify-center text-white font-bold text-5xl mx-auto mb-6 shadow-lg shadow-[#0B57D0]/20">H</div>
            <h1 className="text-3xl font-bold tracking-tight text-[#1F1F1F] mb-3">স্বাগতম</h1>
            <p className="text-[#444746] text-lg">আপনার শপের অ্যাকাউন্টে লগইন করুন</p>
          </div>
          
          <Card className="shadow-lg shadow-black/5">
            <form onSubmit={handleLogin} className="space-y-6">
              <Input
                label="মোবাইল নাম্বার"
                type="text"
                placeholder="যেমন: 017..."
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
              />
              <Input
                label="পাসওয়ার্ড"
                type="password"
                placeholder="পাসওয়ার্ড দিন"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button type="submit" className="w-full h-14 text-lg mt-2" disabled={loading}>
                {loading ? 'লগইন হচ্ছে...' : 'লগইন'}
              </Button>
            </form>
            <div className="mt-8 text-center text-[#444746] font-medium">
              অ্যাকাউন্ট নেই? <Link to="/signup" className="text-[#0B57D0] hover:text-[#0a4fc0] font-bold ml-1">নতুন করুন</Link>
            </div>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
