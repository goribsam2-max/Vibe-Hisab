import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { Button, Input, Card, Surface } from '../components/ui';
import toast from 'react-hot-toast';
import { ShoppingCart, Search, CreditCard, Banknote, Smartphone, Receipt, Package, Printer, CheckCircle2 } from 'lucide-react';
import { PageTransition } from '../components/PageTransition';
import { format } from 'date-fns';

export default function POS() {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [sellPriceOverride, setSellPriceOverride] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'bKash' | 'Nagad'>('Cash');
  const [loading, setLoading] = useState(false);
  const [lastSaleReceipt, setLastSaleReceipt] = useState<any | null>(null);

  useEffect(() => {
    if (selectedProduct) {
      setSellPriceOverride(selectedProduct.sellPrice);
    }
  }, [selectedProduct]);

  useEffect(() => {
    if (!user) return;
    const fetchProducts = async () => {
      try {
        const q = query(collection(db, 'products'), where('userId', '==', user.uid));
        const snap = await getDocs(q);
        setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'products');
      }
    };
    fetchProducts();
  }, [user]);

  const filteredProd = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const handleSale = async () => {
    if (!selectedProduct) return toast.error('Select a product');
    if (quantity <= 0) return toast.error('Invalid quantity');
    if (quantity > selectedProduct.stock) return toast.error('Not enough stock');

    setLoading(true);
    const finalSellPrice = Number(sellPriceOverride) || 0;
    const totalAmount = finalSellPrice * quantity;
    const totalBuyPrice = selectedProduct.buyPrice * quantity;
    const profit = totalAmount - totalBuyPrice;

    try {
      const saleData = {
        userId: user!.uid,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        quantity,
        buyPrice: selectedProduct.buyPrice,
        sellPrice: finalSellPrice,
        totalAmount,
        profit,
        paymentMethod,
        timestamp: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, 'sales'), saleData);

      await updateDoc(doc(db, 'products', selectedProduct.id), {
        stock: increment(-quantity)
      });

      toast.success('Sale Recorded successfully!');
      setLastSaleReceipt({ id: docRef.id, ...saleData, date: new Date() });
      setSelectedProduct(null);
      setQuantity(1);
      setPaymentMethod('Cash');
      
      const pIndex = products.findIndex(p => p.id === selectedProduct.id);
      if(pIndex !== -1) {
        const newP = [...products];
        newP[pIndex].stock -= quantity;
        setProducts(newP);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'sales');
    } finally {
      setLoading(false);
    }
  };

  const printReceipt = () => {
    if (!lastSaleReceipt) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return toast.error('Pop-up blocked by browser');
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${lastSaleReceipt.id}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; padding: 20px; max-width: 300px; margin: 0 auto; color: #000; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
            .title { font-size: 24px; font-weight: bold; margin: 0; }
            .subtitle { font-size: 12px; margin: 5px 0; }
            .item-row { display: flex; justify-content: space-between; margin: 10px 0; font-size: 14px; }
            .total-row { display: flex; justify-content: space-between; margin: 15px 0; font-size: 16px; font-weight: bold; border-top: 1px dashed #000; padding-top: 10px; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; border-top: 1px dashed #000; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">STORE RECEIPT</h1>
            <p class="subtitle">${format(lastSaleReceipt.date, 'dd MMM yyyy, hh:mm a')}</p>
            <p class="subtitle">Receipt #: ${lastSaleReceipt.id.slice(0, 8)}</p>
          </div>
          
          <div style="margin-bottom: 15px;">
            <div style="font-weight: bold; font-size: 14px;">${lastSaleReceipt.productName}</div>
            <div style="font-size: 12px; color: #333;">Qty: ${lastSaleReceipt.quantity} x ${lastSaleReceipt.sellPrice}</div>
          </div>
          
          <div class="item-row">
            <span>Payment Method:</span>
            <span>${lastSaleReceipt.paymentMethod}</span>
          </div>

          <div class="total-row">
            <span>TOTAL:</span>
            <span>Tk ${lastSaleReceipt.totalAmount}</span>
          </div>
          
          <div class="footer">
            <p>Thank you for your purchase!</p>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <PageTransition>
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 min-h-[calc(100vh-10rem)] lg:h-[calc(100vh-6rem)]">
        
        {/* Product Selection */}
        <Surface className={`flex-1 flex col p-4 bg-white border border-[#EAEEEF] shadow-sm ${(selectedProduct || lastSaleReceipt) ? 'hidden lg:flex lg:flex-col' : 'flex flex-col'}`}>
          <div className="mb-4">
             <div className="relative">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#444746]" size={20} />
               <input 
                 placeholder="পণ্য খুঁজুন..." 
                 className="w-full h-14 pl-12 pr-4 rounded-[1.25rem] bg-[#EAEEEF] border-none text-[#1F1F1F] placeholder:text-[#444746] focus:outline-none focus:ring-2 focus:ring-[#0B57D0] transition-shadow shadow-inner shadow-black/5"
                 value={search}
                 onChange={e => setSearch(e.target.value)}
                 onClick={() => setLastSaleReceipt(null)} // Clear receipt on interaction
               />
             </div>
          </div>
          <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-3 auto-rows-max pr-1">
             {filteredProd.map(p => (
               <button 
                 key={p.id} 
                 onClick={() => { setSelectedProduct(p); setQuantity(1); setLastSaleReceipt(null); }}
                 disabled={p.stock <= 0}
                 className={`text-left p-4 rounded-3xl border-2 transition-all block w-full flex flex-col
                   ${selectedProduct?.id === p.id 
                      ? 'border-[#0B57D0] bg-[#D3E3FD] shadow-sm' 
                      : 'border-transparent hover:border-[#EAEEEF] bg-[#F0F4F8] hover:bg-[#EAEEEF]'}
                   ${p.stock <= 0 ? 'opacity-50 cursor-not-allowed' : ''}
                 `}
               >
                 <h4 className="font-bold text-[#1F1F1F] mb-1 truncate text-[14px] sm:text-[15px]">{p.name}</h4>
                 <div className="mt-auto pt-3 flex flex-col gap-1">
                   <p className="text-[#0B57D0] font-black text-[15px] sm:text-[17px]">৳ {p.sellPrice}</p>
                   <span className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider ${p.stock > 0 ? 'text-[#444746]' : 'text-[#B3261E]'}`}>
                     {p.stock > 0 ? `স্টক: ${p.stock}` : 'স্টক নেই'}
                   </span>
                 </div>
               </button>
             ))}
             {filteredProd.length === 0 && (
                <div className="col-span-full py-10 flex flex-col items-center text-center">
                   <Package size={40} className="text-[#444746] opacity-30 mb-2" />
                   <div className="text-[#444746] font-bold">কোনো পণ্য পাওয়া যায়নি</div>
                </div>
             )}
          </div>
        </Surface>

        {/* Checkout Panel */}
        <Surface className={`w-full lg:w-[400px] flex-col gap-4 p-5 bg-white border border-[#EAEEEF] shadow-md relative overflow-hidden ${(selectedProduct || lastSaleReceipt) ? 'flex' : 'hidden lg:flex'}`}>
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#0B57D0] to-[#C2E7FF]" />
          
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => { setSelectedProduct(null); setLastSaleReceipt(null); }} className="lg:hidden w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-[#444746] hover:bg-[#F0F4F8]">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <h3 className="text-[20px] font-bold text-[#1F1F1F] flex items-center gap-2">
              <Receipt className="text-[#0B57D0]" size={22} /> বর্তমান সেল
            </h3>
          </div>
          
          {lastSaleReceipt ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="w-20 h-20 bg-[#C4EED0] rounded-full flex items-center justify-center mb-4 text-[#146C2E]">
                <CheckCircle2 size={40} />
              </div>
              <h3 className="text-[24px] font-black text-[#1F1F1F] mb-1">বিক্রি সম্পন্ন!</h3>
              <p className="font-bold text-[#146C2E] text-[18px] mb-6">মোট: ৳ {lastSaleReceipt.totalAmount}</p>

              <div className="w-full bg-[#F0F4F8] p-4 rounded-3xl text-left space-y-2 mb-8">
                 <p className="text-[14px] text-[#444746]"><strong>পণ্য:</strong> {lastSaleReceipt.productName}</p>
                 <p className="text-[14px] text-[#444746]"><strong>পরিমাণ:</strong> {lastSaleReceipt.quantity}</p>
                 <p className="text-[14px] text-[#444746]"><strong>পেমেন্ট:</strong> {lastSaleReceipt.paymentMethod}</p>
              </div>

              <div className="w-full space-y-3 mt-auto">
                <Button onClick={printReceipt} variant="tonal" className="w-full h-[56px] text-[16px] rounded-full gap-2">
                  <Printer size={20} /> প্রিন্ট রসিদ
                </Button>
                <Button onClick={() => setLastSaleReceipt(null)} className="w-full h-[56px] text-[16px] rounded-full bg-[#1F1F1F] text-white hover:bg-black">
                  নতুন সেল
                </Button>
              </div>
            </div>
          ) : selectedProduct ? (
            <div className="flex-1 flex flex-col">
              <div className="bg-[#F0F4F8] p-5 rounded-[1.5rem] mb-6">
                <h4 className="font-bold text-[#1F1F1F] text-[17px] mb-1 leading-tight">{selectedProduct.name}</h4>
                <p className="text-[#444746] font-bold">ক্রয় মূল্য: ৳ {selectedProduct.buyPrice}</p>
              </div>

              <div className="space-y-6 mb-6">
                <div>
                  <label className="text-[14px] font-bold text-[#444746] block mb-3 pl-1">বিক্রয় মূল্য (প্রতি ইউনিট)</label>
                  <input 
                    type="number"
                    value={sellPriceOverride}
                    onChange={(e) => setSellPriceOverride(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full h-14 px-5 rounded-[1.25rem] bg-[#F0F4F8] border-2 border-transparent text-[#1F1F1F] font-bold focus:outline-none focus:bg-white focus:border-[#0B57D0]/30 focus:shadow-[0_0_0_4px_rgba(11,87,208,0.1)] transition-all mb-2 text-lg"
                    placeholder="বিক্রয় মূল্য দিন"
                  />
                </div>

                <div>
                  <label className="text-[14px] font-bold text-[#444746] block mb-3 pl-1">পরিমাণ</label>
                  <div className="flex items-center gap-4 bg-[#F0F4F8] p-2 rounded-full w-max mx-auto shadow-inner shadow-black/5">
                     <button className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[#1F1F1F] font-bold text-xl shadow-sm hover:bg-[#EAEEEF] active:scale-95 transition-all" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                     <span className="text-[22px] font-black w-14 text-center">{quantity}</span>
                     <button className="w-12 h-12 rounded-full bg-[#0B57D0] flex items-center justify-center text-white font-bold text-xl shadow-sm hover:bg-[#0a4fc0] active:scale-95 transition-all" onClick={() => setQuantity(Math.min(selectedProduct.stock, quantity + 1))}>+</button>
                  </div>
                </div>

                <div>
                  <label className="text-[14px] font-bold text-[#444746] block mb-3 pl-1">পেমেন্ট মেথড</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'Cash', icon: Banknote },
                      { id: 'bKash', icon: Smartphone },
                      { id: 'Nagad', icon: CreditCard }
                    ].map(method => (
                      <button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id as any)}
                        className={`flex flex-col items-center justify-center py-3 px-1 rounded-2xl border-2 transition-all
                          ${paymentMethod === method.id 
                            ? 'border-[#0B57D0] bg-[#D3E3FD] text-[#001D35] shadow-sm' 
                            : 'border-transparent bg-[#F0F4F8] text-[#444746] hover:bg-[#EAEEEF]'}
                        `}
                      >
                        <method.icon size={24} className="mb-1.5" />
                        <span className="text-[13px] font-bold">{method.id}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-auto">
                <div className="flex justify-between items-end mb-4 bg-[#1F1F1F] text-white p-5 rounded-[1.5rem] shadow-md">
                   <div className="text-[#EAEEEF] font-bold">মোট টাকা</div>
                   <div className="text-[28px] font-black leading-none">৳ {(Number(sellPriceOverride) || 0) * quantity}</div>
                </div>
                
                <Button 
                  onClick={handleSale} 
                  disabled={loading}
                  className="w-full h-[64px] text-[17px] rounded-full bg-[#0B57D0]"
                >
                  {loading ? 'প্রসেসিং...' : 'চেকআউট সম্পন্ন করুন'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
              <div className="w-24 h-24 bg-[#F0F4F8] rounded-full flex items-center justify-center mb-6">
                <ShoppingCart size={40} className="text-[#0B57D0]/50" />
              </div>
              <h3 className="text-[20px] font-bold text-[#1F1F1F] mb-2">কোনো পণ্য নির্বাচন করা হয়নি</h3>
              <p className="font-medium text-[#444746] text-[15px]">বাম পাশ থেকে পণ্য নির্বাচন করুন।</p>
            </div>
          )}
        </Surface>

      </div>
    </PageTransition>
  );
}
