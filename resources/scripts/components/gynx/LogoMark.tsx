import React from 'react';

interface Props {
    size?: number;
    className?: string;
    /**
     * Optional hosted logo URL. When set, renders an <img> in place of the
     * inline gx monogram. Upstream source is `state.settings.data.logoUrl`,
     * which is pushed through `window.SiteConfiguration` from wrapper.blade.php.
     */
    url?: string | null;
    /** Alt text for the hosted-image variant; ignored for the inline SVG. */
    alt?: string;
}

/**
 * gx monogram — brand mark used in the sidebar and loading states.
 *
 * Two render modes:
 *   1. Hosted image (when `url` is provided) — lets admins swap the logo
 *      without a React rebuild.
 *   2. Inline SVG (default fallback) — the `gx` glyph with a subtle
 *      gradient and glass-edge outline.
 */
export default ({ size = 36, className, url, alt = 'gynx.gg' }: Props) => {
    if (url) {
        return (
            <img
                src={url}
                alt={alt}
                width={size}
                height={size}
                className={className}
                style={{ display: 'block', objectFit: 'contain' }}
            />
        );
    }

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 64 64"
            width={size}
            height={size}
            className={className}
            aria-label={alt}
            role="img"
        >
            <defs>
                <linearGradient id="gx-fill" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#9B5BFF" />
                    <stop offset="55%" stopColor="#7C3AED" />
                    <stop offset="100%" stopColor="#22D3EE" />
                </linearGradient>
                <linearGradient id="gx-edge" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#22D3EE" stopOpacity="0.55" />
                </linearGradient>
                <filter id="gx-glow" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="1.5" result="b" />
                    <feMerge>
                        <feMergeNode in="b" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            <rect x="2" y="2" width="60" height="60" rx="14" fill="#0B0B0F" stroke="url(#gx-edge)" strokeWidth="1.5" />
            <g
                fontFamily="'Space Grotesk', 'Inter', sans-serif"
                fontWeight="700"
                letterSpacing="-0.04em"
                filter="url(#gx-glow)"
            >
                <text x="32" y="44" fontSize="34" fill="url(#gx-fill)" textAnchor="middle">
                    gx
                </text>
            </g>
        </svg>
    );
};
