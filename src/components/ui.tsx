import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'filled' | 'tonal' | 'outlined' | 'text' | 'danger', size?: 'sm' | 'md' | 'lg' | 'icon' }>(
  ({ className, variant = 'filled', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-bold transition-all active:scale-[0.96] disabled:opacity-50 disabled:pointer-events-none rounded-full whitespace-nowrap",
          {
            'bg-[#0B57D0] text-white hover:bg-[#0a4fc0] shadow-sm hover:shadow-md': variant === 'filled',
            'bg-[#D3E3FD] text-[#041E49] hover:bg-[#c2d7fa]': variant === 'tonal',
            'border-[1.5px] border-[#747775] text-[#0B57D0] hover:bg-[#0B57D0]/5': variant === 'outlined',
            'bg-transparent hover:bg-[#1F1F1F]/5 text-[#0B57D0]': variant === 'text',
            'bg-[#B3261E] text-white hover:bg-[#9c201a] shadow-sm hover:shadow-md': variant === 'danger',
            'h-10 px-5 text-sm': size === 'sm',
            'h-12 px-6 text-[15px]': size === 'md',
            'h-[56px] px-8 text-base': size === 'lg',
            'h-12 w-12': size === 'icon',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { error?: string, label?: string }>(
  ({ className, error, label, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col relative group">
        {label && <label className="text-[13px] font-bold text-[#444746] mb-1.5 ml-2">{label}</label>}
        <input
          ref={ref}
          className={cn(
            "flex h-[56px] w-full rounded-[1.25rem] bg-[#EAEEEF] border-2 border-transparent px-5 py-2 text-[15px] text-[#1F1F1F] placeholder:text-[#444746]/60 focus-visible:outline-none focus:bg-white focus:border-[#0B57D0] disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-inner shadow-black/5",
            error && "border-[#B3261E] focus:border-[#B3261E]",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-[#B3261E] font-bold pl-2">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

export const Card = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("rounded-[1.75rem] border-none bg-white p-6 shadow-[0_2px_12px_rgb(0,0,0,0.04)]", className)} {...props}>
    {children}
  </div>
);

export const Surface = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("rounded-[1.75rem] bg-[#F0F4F8] p-6", className)} {...props}>
    {children}
  </div>
);
