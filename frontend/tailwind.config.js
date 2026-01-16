export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'bg-app': 'var(--bg-app)',
                'bg-card': 'var(--bg-card)',
                'bg-hover': 'var(--bg-hover)',

                'text-main': 'var(--text-main)',
                'text-muted': 'var(--text-muted)',
                'text-accent': 'var(--text-accent)',

                'border-light': 'var(--border-light)',
                'border-active': 'var(--border-active)',
            },
            fontFamily: {
                'body': 'var(--font-body)',
                'heading': 'var(--font-heading)',
            },
            transitionTimingFunction: {
                'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            },
            keyframes: {
                fadeIn: {
                    'from': { opacity: '0', transform: 'translateY(10px)' },
                    'to': { opacity: '1', transform: 'translateY(0)' },
                }
            },
            animation: {
                'enter': 'fadeIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
            }
        },
    },
    plugins: [],
}
