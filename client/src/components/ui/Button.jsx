import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({ children, onClick, type = "button", variant = "primary", className = "", disabled = false, loading = false }) => {
    const baseStyle = "w-full py-4 px-6 rounded-xl font-bold uppercase tracking-wider text-sm transition-all duration-300 transform focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center";

    const variants = {
        primary: "bg-gradient-to-r from-stratygo-red to-red-700 text-white shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 hover:-translate-y-0.5 active:translate-y-0 active:shadow-md disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none",
        secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 shadow-sm hover:shadow-md focus:ring-gray-300",
        outline: "border-2 border-gray-200 text-gray-600 hover:border-stratygo-red hover:text-stratygo-red hover:bg-red-50/50 bg-transparent"
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`${baseStyle} ${variants[variant]} ${className}`}
        >
            {loading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
            {children}
        </button>
    );
};

export default Button;
