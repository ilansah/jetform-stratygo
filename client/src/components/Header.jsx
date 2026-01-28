import React from 'react';
import { ShieldCheck } from 'lucide-react';

const Header = () => {
    return (
        <header className="bg-white/90 backdrop-blur-md border-b border-gray-100 py-4 sticky top-0 z-50 shadow-sm transition-all duration-300">
            <div className="container mx-auto px-4 flex items-center justify-center">
                <div className="flex items-center space-x-3 group cursor-default">
                    <div className="bg-gradient-to-tr from-stratygo-red to-red-600 text-white p-2.5 rounded-xl shadow-lg shadow-red-500/20 group-hover:shadow-red-500/40 transition-all duration-300 transform group-hover:scale-105">
                        <ShieldCheck size={26} strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-2xl font-extrabold tracking-tight text-gray-900 leading-none">
                            STRATYGO
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stratygo-red/90 leading-none mt-1 pl-0.5">
                            Accréditations
                        </span>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
