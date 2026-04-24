import React from 'react';
import GynxLogo from '@/assets/brand/gynx-logo.png';

interface Props {
    size?: number;
    className?: string;
    /**
     * Optional hosted logo URL. When set, renders that image. Upstream
     * source is `state.settings.data.branding.logoUrl`, which is pushed
     * through window.SiteConfiguration from wrapper.blade.php. Fallback
     * is the bundled gynx logo above.
     */
    url?: string | null;
    alt?: string;
}

/**
 * gynx.gg logo lockup. Bundled webpack asset by default; admin can
 * override with any URL via Branding → Logo URL in /admin/branding.
 */
export default ({ size = 36, className, url, alt = 'gynx.gg' }: Props) => {
    const src = url && url.trim() !== '' ? url : (GynxLogo as unknown as string);

    return (
        <img
            src={src}
            alt={alt}
            height={size}
            className={className}
            style={{ display: 'block', objectFit: 'contain', maxHeight: size }}
        />
    );
};
