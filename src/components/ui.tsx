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
          "inline-flex items-center justify-center font-bold transition-all active:scale-[0.96] disabled:opacity-50 disabled:pointer-events-none rounded-full whitespace-nowrap outline-none",
          {
            'bg-[#0B57D0] text-white hover:bg-[#0a459e] shadow-[0_4px_14px_rgba(11,87,208,0.25)] hover:shadow-[0_6px_20px_rgba(11,87,208,0.35)]': variant === 'filled',
            'bg-[#D3E3FD] text-[#041E49] hover:bg-[#C2E7FF]': variant === 'tonal',
            'border-2 border-[#747775] text-[#0B57D0] hover:border-[#0B57D0] hover:bg-[#0B57D0]/5': variant === 'outlined',
            'bg-transparent hover:bg-[#1F1F1F]/5 text-[#0B57D0]': variant === 'text',
            'bg-[#B3261E] text-white hover:bg-[#8C1D18] shadow-[0_4px_14px_rgba(179,38,30,0.25)]': variant === 'danger',
            'h-10 px-5 text-[14px]': size === 'sm',
            'h-12 px-6 text-[15px]': size === 'md',
            'h-[56px] px-8 text-[16px]': size === 'lg',
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
            "flex h-[56px] w-full rounded-[1.25rem] bg-[#F0F4F8] border-2 border-transparent px-5 py-2 text-[16px] text-[#1F1F1F] placeholder:text-[#444746]/60 focus-visible:outline-none focus:bg-white focus:border-[#0B57D0]/80 focus:shadow-[0_0_0_4px_rgba(11,87,208,0.1)] disabled:cursor-not-allowed disabled:opacity-50 transition-all font-medium",
            error && "border-[#B3261E] focus:border-[#B3261E] focus:shadow-[0_0_0_4px_rgba(179,38,30,0.1)]",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-[13px] text-[#B3261E] font-bold pl-2">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

export const Card = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("rounded-[2rem] bg-white p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:shadow-[0_8px_40px_rgb(0,0,0,0.06)] border border-[#EAEEEF]/50", className)} {...props}>
    {children}
  </div>
);

export const Surface = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("rounded-[2rem] bg-[#F0F4F8] p-7", className)} {...props}>
    {children}
  </div>
);
