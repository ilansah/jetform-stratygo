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
                    red: '#D32F2F',
                }
            }
        },
    },
    plugins: [],
}
