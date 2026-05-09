import React, { useState, useEffect } from 'react';
import { Card, Button, Input } from './ui';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

export function AdminAboutUs() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    image: '',
    name: '',
    description: '',
    phone: '',
    location: ''
  });

  useEffect(() => {
    const fetchAbout = async () => {
      try {
        const d = await getDoc(doc(db, 'aboutConfig', 'main'));
        if (d.exists()) {
          setData(d.data() as any);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchAbout();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await setDoc(doc(db, 'aboutConfig', 'main'), data);
      toast.success('About Us updated successfully');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'aboutConfig/main');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-sm border-[#EAEEEF] mt-6">
      <h3 className="text-xl font-bold text-[#1F1F1F] mb-4">About Us Settings</h3>
      <form onSubmit={handleSave} className="space-y-4">
        <Input 
          label="Admin Image URL" 
          value={data.image} 
          onChange={e => setData({...data, image: e.target.value})} 
          placeholder="https://example.com/image.jpg"
        />
        <Input 
          label="Admin Name" 
          value={data.name} 
          onChange={e => setData({...data, name: e.target.value})} 
        />
        <div>
          <label className="block text-sm font-bold text-[#1F1F1F] mb-1.5 ml-1">Description</label>
          <textarea 
            className="w-full bg-[#f8f9fa] border border-[#eaeeef] text-[#1F1F1F] rounded-xl px-4 py-3 h-24 focus:outline-none focus:ring-2 focus:ring-[#0b57d0]/20"
            value={data.description} 
            onChange={e => setData({...data, description: e.target.value})} 
          />
        </div>
        <Input 
          label="Contact Number" 
          value={data.phone} 
          onChange={e => setData({...data, phone: e.target.value})} 
        />
        <Input 
          label="Location" 
          value={data.location} 
          onChange={e => setData({...data, location: e.target.value})} 
        />
        <Button type="submit" disabled={loading}>Save About Us</Button>
      </form>
    </Card>
  );
}
