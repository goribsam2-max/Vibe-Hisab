import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../ui';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <React.Fragment>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#1F1F1F]/40 backdrop-blur-sm z-[999] overflow-y-auto"
            onClick={onCancel}
          />
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-[#F0F4F8] w-full max-w-[340px] rounded-[1.75rem] p-6 shadow-xl pointer-events-auto flex flex-col"
            >
              <h3 className="text-[19px] font-bold text-[#1F1F1F] mb-3 leading-tight">{title}</h3>
              <p className="text-[14px] text-[#444746] mb-6 leading-relaxed font-medium">{message}</p>
              
              <div className="flex justify-end gap-3 mt-auto">
                <Button variant="outline" size="sm" onClick={onCancel} className="px-5 rounded-full font-bold">
                  {cancelText}
                </Button>
                <Button variant="filled" size="sm" onClick={onConfirm} className="px-5 rounded-full font-bold bg-[#B3261E] hover:bg-[#8C1D18] text-white">
                  {confirmText}
                </Button>
              </div>
            </motion.div>
          </div>
        </React.Fragment>
      )}
    </AnimatePresence>,
    document.body
  );
}
