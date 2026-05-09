import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Card } from '../components/ui';
import { PageTransition } from '../components/PageTransition';
import { Phone, MapPin, User, Info } from 'lucide-react';

export default function AboutUs() {
  const [data, setData] = useState({
    image: '',
    name: '',
    description: '',
    phone: '',
    location: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAbout = async () => {
      try {
        const d = await getDoc(doc(db, 'aboutConfig', 'main'));
        if (d.exists()) {
          setData(d.data() as any);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'aboutConfig/main');
      } finally {
        setLoading(false);
      }
    };
    fetchAbout();
  }, []);

  if (loading) return <div className="p-8 text-center text-[#444746] font-medium">লোড হচ্ছে...</div>;

  return (
    <PageTransition>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-4 bg-white p-6 rounded-[1.75rem] shadow-[0_2px_12px_rgb(0,0,0,0.04)] border-none">
           <div className="w-12 h-12 bg-[#F0F4F8] rounded-full flex items-center justify-center text-[#0B57D0]">
             <Info size={24} />
           </div>
           <div>
             <h2 className="text-2xl font-bold text-[#1F1F1F]">আমাদের সম্পর্কে</h2>
             <p className="text-[#444746] font-medium text-[13px]">ডেভেলপার এবং অ্যাডমিন সম্পর্কে জানুন</p>
           </div>
        </div>

        <Card className="flex flex-col items-center text-center p-8 border-none shadow-[0_2px_12px_rgb(0,0,0,0.04)] bg-white rounded-[1.75rem]">
          {data.image ? (
            <img src={data.image} alt={data.name} className="w-32 h-32 rounded-full object-cover mb-6 border-4 border-[#F0F4F8]" />
          ) : (
            <div className="w-32 h-32 rounded-full bg-[#F0F4F8] flex items-center justify-center text-[#9AA0A6] mb-6">
              <User size={48} />
            </div>
          )}
          
          <h3 className="text-2xl font-black text-[#1F1F1F] mb-2">{data.name || 'অ্যাডমিন'}</h3>
          <p className="text-[#444746] font-medium mb-8 max-w-lg leading-relaxed">
            {data.description || 'হিসাব নিকাশ অ্যাপে স্বাগতম।'}
          </p>

          <div className="w-full flex justify-center gap-4 flex-col sm:flex-row">
            {data.phone && (
              <a href={`tel:${data.phone}`} className="flex flex-col items-center p-4 bg-[#F0F4F8] rounded-2xl flex-1 hover:bg-[#E1E6EB] transition-colors">
                <Phone className="text-[#0B57D0] mb-2" size={24} />
                <span className="font-bold text-[#1F1F1F]">{data.phone}</span>
                <span className="text-[12px] text-[#444746]">কল করুন</span>
              </a>
            )}
            
            {data.location && (
               <div className="flex flex-col items-center p-4 bg-[#F0F4F8] rounded-2xl flex-1">
                 <MapPin className="text-[#0B57D0] mb-2" size={24} />
                 <span className="font-bold text-[#1F1F1F]">{data.location}</span>
                 <span className="text-[12px] text-[#444746]">ঠিকানা</span>
               </div>
            )}
          </div>
        </Card>
      </div>
    </PageTransition>
  );
}
