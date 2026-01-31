/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                stratygo: {
                    black: '#1a1a1a',
                    dark: '#2d2d2d',
                    gray: '#4a4a4a',
                    'light-gray': '#f5f5f5',
                    red: '#e63946',
                    'red-dark': '#c1121f',
                    'red-light': '#ff6b7a',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
            },
            animation: {
                'blob': 'blob 7s infinite',
                'fade-in': 'fadeIn 0.5s ease-out',
                'slide-up': 'slideUp 0.5s ease-out',
                'shake': 'shake 0.5s',
                'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                blob: {
                    '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
                    '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
                    '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
                },
                fadeIn: {
                    from: { opacity: '0', transform: 'translateY(10px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
                slideUp: {
                    from: { opacity: '0', transform: 'translateY(20px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
                shake: {
                    '0%, 100%': { transform: 'translateX(0)' },
                    '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-5px)' },
                    '20%, 40%, 60%, 80%': { transform: 'translateX(5px)' },
                },
            },
            boxShadow: {
                'red-sm': '0 1px 2px 0 rgba(230, 57, 70, 0.05)',
                'red-md': '0 4px 6px -1px rgba(230, 57, 70, 0.1), 0 2px 4px -1px rgba(230, 57, 70, 0.06)',
                'red-lg': '0 10px 15px -3px rgba(230, 57, 70, 0.15), 0 4px 6px -2px rgba(230, 57, 70, 0.05)',
                'red-xl': '0 20px 25px -5px rgba(230, 57, 70, 0.2), 0 10px 10px -5px rgba(230, 57, 70, 0.1)',
            },
        },
    },
    plugins: [],
}
