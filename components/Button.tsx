import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  active = false, 
  variant = 'secondary', 
  icon, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-offset-1";
  
  const variants = {
    primary: "bg-stone-800 text-white hover:bg-stone-700 active:scale-95 shadow-sm",
    secondary: "bg-white text-stone-700 border border-stone-200 hover:bg-stone-50 hover:border-stone-300 active:scale-95 shadow-sm",
    danger: "bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 active:scale-95",
    ghost: "bg-transparent text-stone-600 hover:bg-stone-100 active:scale-95"
  };

  const activeStyles = active ? "ring-2 ring-stone-800 border-stone-800 bg-stone-100" : "";

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${activeStyles} ${className}`} 
      {...props}
    >
      {icon && <span className="w-4 h-4">{icon}</span>}
      {children}
    </button>
  );
};