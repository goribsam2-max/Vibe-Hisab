import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Clock, Shield, LogOut, Users, TrendingDown, Bell, User, Menu, X, Info, HandCoins } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'ড্যাশবোর্ড' },
    { to: '/cash-match', icon: HandCoins, label: 'ক্যাশ মেলাই' },
    { to: '/pos', icon: ShoppingCart, label: 'বিক্রি করুন' },
    { to: '/products', icon: Package, label: 'পণ্য' },
    { to: '/customers', icon: Users, label: 'গ্রাহক' },
    { to: '/history', icon: Clock, label: 'ইতিহাস' },
    { to: '/expenses', icon: TrendingDown, label: 'খরচ' },
    { to: '/notifications', icon: Bell, label: 'নোটিফিকেশন' },
    { to: '/about', icon: Info, label: 'আমাদের সম্পর্কে' },
    { to: '/profile', icon: User, label: 'প্রোফাইল' },
  ];

  if (user?.role === 'admin') {
    navItems.push({ to: '/admin', icon: Shield, label: 'অ্যাডমিন প্যানেল' });
  }

  const mobileNavItems = navItems.slice(0, 3);
  const moreNavItems = navItems.slice(3);

  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex flex-col md:flex-row font-sans pb-24 md:pb-0">
      {/* Desktop Sidebar (Material Style) */}
      <aside className="hidden md:flex flex-col w-72 h-screen px-4 py-8 bg-[#F0F4F8] shrink-0 sticky top-0 justify-between">
        <div>
          <div className="flex items-center gap-4 mb-8 px-6">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#1F1F1F]">{user?.shopName}</h1>
              <p className="text-[13px] text-[#444746] font-medium">{user?.ownerName}</p>
            </div>
          </div>
          <nav className="flex-1 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-6 py-3.5 rounded-full transition-all font-bold ${
                    isActive
                      ? 'bg-[#C2E7FF] text-[#001D35]'
                      : 'text-[#444746] hover:bg-[#1F1F1F]/5'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} fill={isActive ? 'currentColor' : 'none'} className={isActive ? 'text-[#001D35]' : 'text-[#444746]'}/>
                    <span className="text-[14px]">{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
        
        <div className="px-2">
          <button onClick={handleLogout} className="flex items-center gap-4 w-full px-4 py-4 rounded-full text-[#444746] hover:bg-[#B3261E]/10 hover:text-[#B3261E] transition-all font-bold">
            <LogOut size={22} strokeWidth={2}/>
            <span className="text-[14px]">লগআউট</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 md:pl-2">
        <div className="md:hidden flex items-center justify-between mb-6 px-4 pt-4">
          <div className="flex items-center gap-3">
             <div>
               <h1 className="text-xl font-bold tracking-tight text-[#1F1F1F] leading-tight">{user?.shopName}</h1>
             </div>
          </div>
          <NavLink to="/notifications" className="w-10 h-10 bg-transparent rounded-full flex items-center justify-center text-[#444746] hover:bg-[#1F1F1F]/5 relative">
            <Bell size={22} className="ml-0.5" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#B3261E] rounded-full border border-white"></span>
          </NavLink>
        </div>
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar (Material 3) */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 bg-[#F0F4F8] flex justify-around px-2 py-3 pb-safe-area-inset-bottom transition-all ${isMenuOpen ? 'z-[60] shadow-none border-t-transparent' : 'z-[60] shadow-[0_-4px_16px_rgb(0,0,0,0.05)] border-t border-black/5'}`}>
        {mobileNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setIsMenuOpen(false)}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-16 transition-all ${
                isActive && !isMenuOpen ? 'text-[#1F1F1F]' : 'text-[#444746]'
              }`
            }
          >
            {({ isActive }) => (
               <>
                  <div className={`flex items-center justify-center w-16 h-8 rounded-full mb-1 transition-colors ${isActive && !isMenuOpen ? 'bg-[#C2E7FF]' : 'bg-transparent'}`}>
                     <item.icon size={22} strokeWidth={isActive && !isMenuOpen ? 2.5 : 2} fill={isActive && !isMenuOpen ? '#001D35' : 'none'} className={isActive && !isMenuOpen ? 'text-[#001D35]' : 'text-[#444746]'} />
                  </div>
                  <span className={`text-[12px] font-bold ${isActive && !isMenuOpen ? 'text-[#1F1F1F]' : 'text-[#444746]'}`}>{item.label}</span>
               </>
            )}
          </NavLink>
        ))}
        {/* Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`flex flex-col items-center justify-center w-16 transition-all ${isMenuOpen ? 'text-[#1F1F1F]' : 'text-[#444746]'}`}
        >
          <div className={`flex items-center justify-center w-16 h-8 rounded-full mb-1 transition-colors ${isMenuOpen ? 'bg-[#C2E7FF]' : 'bg-transparent'}`}>
            {isMenuOpen ? (
              <X size={22} strokeWidth={2.5} className="text-[#001D35]" />
            ) : (
              <Menu size={22} strokeWidth={2} className="text-[#444746]" />
            )}
          </div>
          <span className={`text-[12px] font-bold ${isMenuOpen ? 'text-[#1F1F1F]' : 'text-[#444746]'}`}>আরও...</span>
        </button>
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-[#1F1F1F]/40 backdrop-blur-sm z-[50]"
              onClick={() => setIsMenuOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
              className="md:hidden fixed bottom-0 left-0 right-0 bg-[#F0F4F8] rounded-t-[2rem] z-[55] overflow-hidden flex flex-col border-none shadow-[0_-12px_24px_-8px_rgba(0,0,0,0.1)] pb-24"
              style={{ maxHeight: '80vh' }}
            >
              <div className="w-12 h-1.5 bg-[#EAEEEF] rounded-full mx-auto mt-4 mb-2" />
              <div className="overflow-y-auto px-4 pb-6">
                <nav className="grid grid-cols-4 gap-y-6 pt-4">
                  {moreNavItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setIsMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex flex-col items-center justify-center transition-all ${
                          isActive ? 'text-[#1F1F1F]' : 'text-[#444746]'
                        }`
                      }
                    >
                      {({ isActive }) => (
                         <>
                            <div className={`flex items-center justify-center w-14 h-14 rounded-full mb-2 transition-colors ${isActive ? 'bg-[#C2E7FF]' : 'bg-[#EAEEEF]'}`}>
                               <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} fill={isActive ? '#001D35' : 'none'} className={isActive ? 'text-[#001D35]' : 'text-[#444746]'} />
                            </div>
                            <span className={`text-[12px] font-bold ${isActive ? 'text-[#1F1F1F]' : 'text-[#444746]'}`}>{item.label}</span>
                         </>
                      )}
                    </NavLink>
                  ))}
                  <button onClick={handleLogout} className="flex flex-col items-center justify-center transition-all text-[#B3261E]">
                    <div className="flex items-center justify-center w-14 h-14 rounded-full mb-2 transition-colors bg-[#F9DEDC]/50">
                       <LogOut size={24} strokeWidth={2} />
                    </div>
                    <span className="text-[12px] font-bold">লগআউট</span>
                  </button>
                </nav>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
