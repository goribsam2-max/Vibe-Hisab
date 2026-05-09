/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'motion/react';

// Placeholders for pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import POS from './pages/POS';
import History from './pages/History';
import Admin from './pages/Admin';
import Customers from './pages/Customers';
import Expenses from './pages/Expenses';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Upgrade from './pages/Upgrade';
import AddProduct from './pages/AddProduct';
import ProductDetails from './pages/ProductDetails';
import AddCustomer from './pages/AddCustomer';
import AddExpense from './pages/AddExpense';
import Layout from './components/Layout';
import AboutUs from './pages/AboutUs';

const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-[#444746] font-medium">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (user.status === 'banned') return <div className="min-h-screen flex items-center justify-center flex-col gap-4 text-center p-8 bg-[#F9DEDC] text-[#8C1D18]"><h1 className="text-2xl font-bold">Account Suspended</h1><p className="font-medium">Your shop access has been revoked by the administrator.</p></div>;
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

const AdminRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user?.role !== 'admin') return <Navigate to="/" />;
  return <Outlet />;
};

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      {/* @ts-ignore */}
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/new" element={<AddProduct />} />
          <Route path="/products/:id" element={<ProductDetails />} />
          <Route path="/pos" element={<POS />} />
          <Route path="/history" element={<History />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/customers/new" element={<AddCustomer />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/expenses/new" element={<AddExpense />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/upgrade" element={<Upgrade />} />
          <Route path="/about" element={<AboutUs />} />
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<Admin />} />
          </Route>
        </Route>
      </Routes>
    </AnimatePresence>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AnimatedRoutes />
      </Router>
      <Toaster position="top-center" toastOptions={{
        style: {
          background: '#1F1F1F',
          color: '#fff',
          borderRadius: '16px',
          fontWeight: 'bold',
        }
      }} />
    </AuthProvider>
  );
}
