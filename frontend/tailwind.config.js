/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#FFFFFF',
                accent: '#FFFFFF',
                pagebg: '#FFFFFF',
                cardbg: '#F0F0F0',
                bordercolor: '#C0C0C0',
                'text-primary': '#111827',
                'text-secondary': '#4B5563',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', '"Noto Sans"', 'sans-serif'],
                mono: ['"JetBrains Mono"', 'monospace'],
            },
            letterSpacing: {
                brand: '0.03em',
            },
            transitionTimingFunction: {
                brand: 'ease-in-out',
                editorial: 'cubic-bezier(0.22, 1, 0.36, 1)',
            },
            animation: {
                'fade-in': 'fadeIn 0.2s ease-in-out forwards',
                'slide-up': 'slideUp 0.3s ease-in-out forwards',
                'scan': 'scan 3s linear infinite',
                'ping-slow': 'ping 3s cubic-bezier(0, 0, 0.2, 1) infinite',
                'reveal': 'reveal 700ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(15px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                scan: {
                    '0%, 100%': { top: '0%' },
                    '50%': { top: '100%' },
                },
                reveal: {
                    '0%': { opacity: '0', transform: 'translateY(40px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                }
            }
        },
    },
    plugins: [],
}
