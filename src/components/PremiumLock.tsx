import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Card, Button } from '../components/ui';
import { motion, AnimatePresence } from 'motion/react';
import { Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PremiumLockProps {
  title: string;
  description: string;
}

export function PremiumLock({ title, description }: PremiumLockProps) {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-[#1F1F1F]/40 backdrop-blur-md z-[9999] flex items-center justify-center p-4"
      >
        <Card className="max-w-sm w-full text-center border border-[#EAEEEF] shadow-2xl relative overflow-hidden bg-white/90 backdrop-blur-3xl p-8 rounded-[2rem] animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-gradient-to-tr from-[#0B57D0] to-[#A8C7FA] rounded-full flex items-center justify-center text-white mx-auto mb-6 shadow-lg shadow-[#0B57D0]/20">
            <Lock size={36} strokeWidth={2.5} />
          </div>
          <h2 className="text-[24px] font-black tracking-tight text-[#1F1F1F] mb-3 leading-tight font-sans">
            {title}
          </h2>
          <p className="text-[#444746] text-[15px] mb-8 font-medium leading-relaxed font-sans">
            {description}
          </p>
          
          <Button 
            className="w-full h-[56px] rounded-full text-[16px] font-bold shadow-xl shadow-[#0B57D0]/20 hover:shadow-2xl hover:shadow-[#0B57D0]/30 transition-all tracking-wide"
            onClick={() => navigate('/upgrade')}
          >
            Upgrade to Premium
          </Button>
        </Card>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
