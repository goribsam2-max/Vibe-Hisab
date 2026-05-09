import React from 'react';
import { Card, Button } from '../components/ui';
import { PageTransition } from './PageTransition';
import { Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PremiumLockProps {
  title: string;
  description: string;
}

export function PremiumLock({ title, description }: PremiumLockProps) {
  const navigate = useNavigate();

  return (
    <PageTransition>
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <Card className="max-w-sm w-full text-center border border-[#EAEEEF] shadow-sm relative overflow-hidden bg-[#F0F4F8]">
          <div className="w-16 h-16 bg-[#D3E3FD] rounded-full flex items-center justify-center text-[#0B57D0] mx-auto mb-6 shadow-sm">
            <Lock size={32} />
          </div>
          <h2 className="text-[22px] font-bold text-[#1F1F1F] mb-3 leading-tight">{title}</h2>
          <p className="text-[#444746] text-[15px] mb-8 font-medium leading-relaxed">{description}</p>
          
          <Button 
            className="w-full h-[52px] rounded-full text-[15px] font-bold shadow-md tracking-wide"
            onClick={() => navigate('/upgrade')}
          >
            Upgrade to Premium
          </Button>
        </Card>
      </div>
    </PageTransition>
  );
}
