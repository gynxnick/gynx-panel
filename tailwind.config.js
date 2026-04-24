const colors = require('tailwindcss/colors');

// ---- gynx.gg brand palette -------------------------------------------------
// 80 / 15 / 5 distribution: void base / purple+neon accents / pink reserved.
//
// Legacy Tailwind token names (blue/cyan/gray) are remapped to gynx equivalents
// so the thousands of existing `bg-blue-600` / `text-gray-200` usages across
// the Pterodactyl codebase adopt the new identity without class-level edits.
// New code should reach for the explicit `gynx` namespace instead.

const gynxPurple = {
    50:  '#F5F3FF',
    100: '#EDE9FE',
    200: '#DDD6FE',
    300: '#C4B5FD',
    400: '#A78BFA',
    500: '#8B5CF6',
    600: '#7C3AED', // brand primary
    700: '#6D28D9',
    800: '#5B21B6',
    900: '#4C1D95',
};

const gynxNeon = {
    50:  '#ECFEFF',
    100: '#CFFAFE',
    200: '#A5F3FC',
    300: '#67E8F9',
    400: '#22D3EE', // brand secondary
    500: '#06B6D4',
    600: '#0891B2',
    700: '#0E7490',
    800: '#155E75',
    900: '#164E63',
};

// Dark-first neutral scale anchored on Void Black #0B0B0F.
const gynxGray = {
    50:  '#F4F4F6',
    100: '#E5E5EB',
    200: '#C7C7D1',
    300: '#9CA3AF',
    400: '#6B7280',
    500: '#4B5563',
    600: '#2A2F3E', // card surface
    700: '#1F2937', // panels (Dark Slate)
    800: '#111827',
    900: '#0B0B0F', // Void Black base
};

module.exports = {
    content: [
        './resources/scripts/**/*.{js,ts,tsx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                // display font for headings, brand moments
                display: ['"Space Grotesk"', '"Inter"', 'system-ui', 'sans-serif'],
                // body font
                sans:    ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
                mono:    ['"JetBrains Mono"', '"IBM Plex Mono"', 'ui-monospace', 'monospace'],
                // preserved legacy alias so existing `font-header` usages still work
                header:  ['"Space Grotesk"', '"Inter"', 'system-ui', 'sans-serif'],
            },
            colors: {
                // void base overrides the stock black
                black: '#0B0B0F',
                white: '#FFFFFF',

                // legacy aliases — remapped to gynx palette
                primary: gynxPurple,
                blue:    gynxPurple,
                cyan:    gynxNeon,
                gray:    gynxGray,
                neutral: gynxGray,

                // explicit brand namespace (preferred for new code)
                gynx: {
                    void:    '#0B0B0F',
                    'void-2': '#101018',
                    slate:   '#1F2937',
                    'slate-2': '#2A2F3E',
                    line:    'rgba(124, 58, 237, 0.18)',
                    'line-soft': 'rgba(156, 163, 175, 0.08)',
                    purple:  gynxPurple[600],
                    'purple-light': '#9B5BFF',
                    neon:    gynxNeon[400],
                    pink:    '#EC4899',
                    text:    '#E5E7EB',
                    'text-dim':  '#9CA3AF',
                    'text-mute': '#6B7280',
                },
            },
            backgroundImage: {
                'gynx-gradient': 'linear-gradient(135deg, #7C3AED, #9B5BFF)',
                'gynx-gradient-br': 'linear-gradient(135deg, #7C3AED 0%, #22D3EE 100%)',
                'gynx-mesh': [
                    'radial-gradient(900px 600px at 12% -10%, rgba(124, 58, 237, 0.28), transparent 60%)',
                    'radial-gradient(1000px 700px at 110% 10%, rgba(34, 211, 238, 0.18), transparent 60%)',
                    'radial-gradient(700px 500px at 50% 120%, rgba(236, 72, 153, 0.08), transparent 60%)',
                ].join(', '),
            },
            boxShadow: {
                'gynx-glow':      '0 0 0 1px rgba(124, 58, 237, 0.35), 0 8px 28px -8px rgba(124, 58, 237, 0.55)',
                'gynx-glow-neon': '0 0 0 1px rgba(34, 211, 238, 0.35), 0 8px 28px -8px rgba(34, 211, 238, 0.45)',
                'gynx-panel':     '0 10px 30px -18px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(124, 58, 237, 0.14)',
                'gynx-modal':     '0 30px 80px -20px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(124, 58, 237, 0.25), 0 0 60px -20px rgba(124, 58, 237, 0.5)',
            },
            fontSize: {
                '2xs': '0.625rem',
            },
            transitionDuration: {
                250: '250ms',
            },
            borderRadius: {
                // match brand guide 8-16px
                'gynx-sm': '8px',
                'gynx':    '12px',
                'gynx-lg': '16px',
            },
            borderColor: theme => ({
                default: theme('colors.neutral.400', 'currentColor'),
            }),
            backdropBlur: {
                xs: '2px',
            },
        },
    },
    plugins: [
        require('@tailwindcss/line-clamp'),
        require('@tailwindcss/forms')({
            strategy: 'class',
        }),
    ],
};
