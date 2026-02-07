import React from 'react';

const Input = ({ label, type = "text", name, placeholder, required = false, onChange, value, error, className = "", showLabel = true, disabled = false }) => {
    return (
        <div className={`mb-6 group ${className} ${disabled ? 'opacity-60 pointer-events-none' : ''}`}>
            {showLabel && (label || required) && (
                <label className="block text-sm font-semibold text-stratygo-dark mb-2 ml-1 transition-colors group-focus-within:text-stratygo-red">
                    {label} {required && <span className="text-stratygo-red">*</span>}
                </label>
            )}
            <div className="relative">
                <input
                    type={type}
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    required={required}
                    disabled={disabled}
                    className={`w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-stratygo-red/10 focus:border-stratygo-red focus:bg-white transition-all duration-300 shadow-sm hover:border-gray-300 ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : ''} ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                />
            </div>
            {error && <p className="mt-2 text-xs text-red-600 font-medium ml-1 animate-pulse">{error}</p>}
        </div>
    );
};

export default Input;
