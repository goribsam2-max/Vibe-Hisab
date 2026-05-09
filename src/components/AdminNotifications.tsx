import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, addDoc, serverTimestamp } from 'firebase/firestore';
import { Card, Button, Input } from '../components/ui';
import { Send } from 'lucide-react';
import toast from 'react-hot-toast';

export function AdminNotifications() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return toast.error('Fill all fields');
    setLoading(true);
    try {
      await addDoc(collection(db, 'notifications'), {
        title,
        message,
        timestamp: serverTimestamp()
      });
      toast.success('Notification Sent to all users!');
      setTitle(''); setMessage('');
    } catch(err) {
      handleFirestoreError(err, OperationType.CREATE, 'notifications');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border border-[#EAEEEF] shadow-sm">
      <h3 className="font-bold text-lg text-[#1F1F1F] mb-4">Send Global Notification</h3>
      <form onSubmit={handleSend} className="space-y-4">
        <Input label="Notification Title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. System Update" />
        <div className="space-y-1.5 px-2">
          <label className="text-[13px] font-bold text-[#444746]">Message Body</label>
          <textarea 
            className="w-full min-h-[100px] rounded-[1.25rem] bg-[#EAEEEF] border-2 border-transparent px-5 py-3 text-[15px] text-[#1F1F1F] placeholder:text-[#444746]/60 focus:bg-white focus:border-[#0B57D0] focus:outline-none resize-none transition-all"
            value={message} onChange={e => setMessage(e.target.value)} placeholder="Enter details..."
          />
        </div>
        <Button type="submit" disabled={loading} className="w-full gap-2">
          <Send size={18} /> {loading ? 'Sending...' : 'Broadcast to all apps'}
        </Button>
      </form>
    </Card>
  );
}
