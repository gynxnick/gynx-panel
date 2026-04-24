import React from 'react';
import Icon from '@/components/elements/Icon';
import { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames';
import useFitText from 'use-fit-text';
import CopyOnClick from '@/components/elements/CopyOnClick';
import styled from 'styled-components/macro';
import tw from 'twin.macro';

/**
 * gynx — redesigned stat tile.
 *
 * Glassy panel with a bottom accent bar (purple→neon gradient in the nominal
 * state; red or amber when thresholds are tripped). Icon sits in its own
 * gradient-lined badge; value auto-fits to the tile width via use-fit-text so
 * long numbers don't overflow.
 */

const Tile = styled.div`
    ${tw`relative flex items-center gap-3 px-4 py-3 rounded-gynx backdrop-blur-md`};
    background: rgba(17, 19, 28, 0.72);
    border: 1px solid var(--gynx-line);
    overflow: hidden;
    transition: transform .25s ease, border-color .25s ease, box-shadow .25s ease;

    &:hover {
        transform: translateY(-1px);
        border-color: rgba(124, 58, 237, 0.35);
        box-shadow: 0 10px 28px -14px rgba(124, 58, 237, 0.35);
    }

    /* bottom accent bar — overridden per severity via data-severity */
    &::after {
        content: '';
        position: absolute;
        left: 0; right: 0; bottom: 0;
        height: 2px;
        background: linear-gradient(90deg, #7C3AED, #22D3EE);
        opacity: 0.7;
    }

    &[data-severity='warn']::after { background: #F59E0B; opacity: 0.9; }
    &[data-severity='crit']::after { background: #EF4444; opacity: 0.95; }
`;

const IconBadge = styled.div`
    ${tw`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-gynx-sm`};
    background: linear-gradient(135deg, rgba(124, 58, 237, 0.22), rgba(34, 211, 238, 0.12));
    border: 1px solid rgba(124, 58, 237, 0.25);
    color: #fff;
    text-shadow: 0 0 12px rgba(124, 58, 237, 0.55);

    & > svg {
        width: 16px; height: 16px;
    }
`;

const Body = styled.div`
    ${tw`flex flex-col justify-center overflow-hidden min-w-0 w-full`};
`;

const Label = styled.p`
    ${tw`m-0 font-display text-[11px] uppercase`};
    letter-spacing: 0.14em;
    color: var(--gynx-text-dim);
    font-weight: 500;
`;

const Value = styled.div`
    ${tw`h-7 w-full truncate text-gynx-text`};
    font-weight: 600;
    letter-spacing: -0.01em;
`;

interface StatBlockProps {
    title: string;
    copyOnClick?: string;
    color?: string | undefined; // Tailwind bg-* class, kept for back-compat
    icon: IconDefinition;
    children: React.ReactNode;
    className?: string;
}

/**
 * Back-compat adapter: the upstream call site still passes `color` as a
 * Tailwind class (bg-red-500, bg-yellow-500, etc). Map it to a severity
 * flag the new design uses.
 */
const severityFrom = (color?: string): 'ok' | 'warn' | 'crit' => {
    if (!color) return 'ok';
    if (color.includes('red')) return 'crit';
    if (color.includes('yellow') || color.includes('amber')) return 'warn';
    return 'ok';
};

export default ({ title, copyOnClick, icon, color, className, children }: StatBlockProps) => {
    const { fontSize, ref } = useFitText({ minFontSize: 8, maxFontSize: 500 });

    return (
        <CopyOnClick text={copyOnClick}>
            <Tile className={classNames(className)} data-severity={severityFrom(color)}>
                <IconBadge>
                    <Icon icon={icon} />
                </IconBadge>
                <Body>
                    <Label>{title}</Label>
                    <Value ref={ref} style={{ fontSize }}>
                        {children}
                    </Value>
                </Body>
            </Tile>
        </CopyOnClick>
    );
};
