import React from 'react';

const Header = () => {
    return (
        <header className="glass sticky top-0 z-50 border-b border-gray-200/50 py-4 shadow-md transition-all duration-300">
            <div className="container mx-auto px-4 flex items-center justify-center">
                <div className="flex items-center space-x-4 group cursor-default">
                    {/* Stratygo Logo */}
                    <div className="transform transition-all duration-300 group-hover:scale-105">
                        <img
                            src="/stratygo-logo.png"
                            alt="Stratygo"
                            className="h-12 w-auto object-contain"
                        />
                    </div>

                    {/* Divider */}
                    <div className="h-10 w-px bg-gradient-to-b from-transparent via-stratygo-red to-transparent opacity-50"></div>

                    {/* Subtitle */}
                    <div className="flex flex-col">
                        <span className="text-xs font-semibold uppercase tracking-[0.15em] text-stratygo-gray leading-none">
                            Formulaire d'
                        </span>
                        <span className="text-lg font-bold tracking-tight text-stratygo-dark leading-none mt-1">
                            Accréditations
                        </span>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
