import React from 'react';
import { motion } from 'motion/react';

export const PageTransition = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
    exit={{ opacity: 0, y: -20, filter: 'blur(4px)' }}
    transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
    className={className}
    style={{ height: '100%', width: '100%' }}
  >
    {children}
  </motion.div>
);
