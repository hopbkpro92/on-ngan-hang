import type { Config } from "tailwindcss";

export default {
    darkMode: ["class"],
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))'
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))'
                },
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))'
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))'
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))'
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))'
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))'
                },
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                'input-foreground': 'hsl(var(--input-foreground))',
                ring: 'hsl(var(--ring))',
                chart: {
                    '1': 'hsl(var(--chart-1))',
                    '2': 'hsl(var(--chart-2))',
                    '3': 'hsl(var(--chart-3))',
                    '4': 'hsl(var(--chart-4))',
                    '5': 'hsl(var(--chart-5))'
                },
                sidebar: {
                    DEFAULT: 'hsl(var(--sidebar-background))',
                    foreground: 'hsl(var(--sidebar-foreground))',
                    primary: 'hsl(var(--sidebar-primary))',
                    'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
                    accent: 'hsl(var(--sidebar-accent))',
                    'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
                    border: 'hsl(var(--sidebar-border))',
                    ring: 'hsl(var(--sidebar-ring))'
                },
                'correct-answer': {
                    DEFAULT: 'hsl(var(--correct-answer-bg))',
                    foreground: 'hsl(var(--correct-answer-fg))'
                },
                'incorrect-answer': {
                    DEFAULT: 'hsl(var(--incorrect-answer-bg))',
                    foreground: 'hsl(var(--incorrect-answer-fg))'
                }
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)'
            },
            keyframes: {
                'accordion-down': {
                    from: {
                        height: '0'
                    },
                    to: {
                        height: 'var(--radix-accordion-content-height)'
                    }
                },
                'accordion-up': {
                    from: {
                        height: 'var(--radix-accordion-content-height)'
                    },
                    to: {
                        height: '0'
                    }
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                fadeOut: {
                    '0%': { opacity: '1' },
                    '100%': { opacity: '0' },
                },
                feedbackPop: {
                    '0%': { opacity: '0', transform: 'scale(0.96) translateY(4px)' },
                    '70%': { transform: 'scale(1.02) translateY(0)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                praiseBurst: {
                    '0%': { opacity: '0', transform: 'scale(0.7) rotate(-12deg)' },
                    '45%': { opacity: '1', transform: 'scale(1.18) rotate(8deg)' },
                    '100%': { opacity: '0', transform: 'scale(1.35) rotate(18deg)' },
                },
                praiseBanner: {
                    '0%': { opacity: '0', transform: 'scale(0.88) translateY(10px)' },
                    '45%': { opacity: '1', transform: 'scale(1.05) translateY(-3px)' },
                    '65%': { transform: 'scale(0.98) translateY(1px)' },
                    '82%': { transform: 'scale(1.02) translateY(0)' },
                    '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
                },
                praiseRing: {
                    '0%': { opacity: '0.7', transform: 'scale(0.7)' },
                    '100%': { opacity: '0', transform: 'scale(1.8)' },
                },
                praiseWiggle: {
                    '0%, 100%': { transform: 'rotate(0deg) scale(1)' },
                    '25%': { transform: 'rotate(-12deg) scale(1.1)' },
                    '50%': { transform: 'rotate(12deg) scale(1.16)' },
                    '75%': { transform: 'rotate(-6deg) scale(1.08)' },
                }
            },
            animation: {
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out',
                'fadeIn': 'fadeIn 0.5s ease-in-out',
                'fadeOut': 'fadeOut 0.5s ease-in-out forwards',
                'feedback-pop': 'feedbackPop 0.35s ease-out',
                'praise-burst': 'praiseBurst 0.8s ease-out forwards',
                'praise-banner': 'praiseBanner 0.75s cubic-bezier(0.2, 0.9, 0.3, 1.2)',
                'praise-ring': 'praiseRing 0.9s ease-out forwards',
                'praise-wiggle': 'praiseWiggle 0.8s ease-in-out',
            }
        }
    },
    plugins: [require("tailwindcss-animate")],
} satisfies Config;
