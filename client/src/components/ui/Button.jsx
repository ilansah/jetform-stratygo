import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({ children, onClick, type = "button", variant = "primary", className = "", disabled = false, loading = false }) => {
    const baseStyle = "w-full py-4 px-6 rounded-xl font-bold uppercase tracking-wider text-sm transition-all duration-300 transform focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center cursor-pointer";

    const variants = {
        primary: "shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-100 active:shadow-md disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none focus:ring-gray-500/30",
        secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200 shadow-sm hover:shadow-md focus:ring-gray-300",
        outline: "border-2 border-gray-200 text-gray-600 hover:border-gray-800 hover:text-gray-800 hover:bg-gray-50/50 bg-transparent focus:ring-gray-500/30"
    };

    // Direct background gradient style to ensure it works
    const backgroundStyle = variant === 'primary'
        ? {
            background: 'linear-gradient(to right, #2d2d2d, #1a1a1a)',
            color: '#ffffff'
        }
        : {};

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`${baseStyle} ${variants[variant]} ${className}`}
            style={backgroundStyle}
        >
            {loading && <Loader2 className="animate-spin mr-2 h-4 w-4" style={{ color: '#ffffff' }} />}
            <span style={{ color: '#ffffff' }}>{children}</span>
        </button>
    );
};

export default Button;
