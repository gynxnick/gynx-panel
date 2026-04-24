import React from 'react';
import styled from 'styled-components/macro';
import tw from 'twin.macro';

interface ChartBlockProps {
    title: string;
    legend?: React.ReactNode;
    children: React.ReactNode;
}

/**
 * gynx — chart panel for the Server Console live graphs.
 *
 * Glassy container with a gradient underline and a subtle scan-line highlight
 * at the top edge. Title uses the display font; legend is right-aligned and
 * dimmed.
 */

const Panel = styled.div`
    ${tw`relative rounded-gynx backdrop-blur-md`};
    background: rgba(17, 19, 28, 0.72);
    border: 1px solid var(--gynx-line);
    padding-top: 0.5rem;
    overflow: hidden;
    transition: border-color .25s ease, box-shadow .25s ease;

    &:hover {
        border-color: rgba(124, 58, 237, 0.35);
        box-shadow: 0 12px 30px -14px rgba(124, 58, 237, 0.35);
    }

    /* top scan line */
    &::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(124, 58, 237, 0.55), transparent);
    }

    /* bottom accent */
    &::after {
        content: '';
        position: absolute;
        bottom: 0; left: 0; right: 0;
        height: 2px;
        background: linear-gradient(90deg, #7C3AED, #22D3EE);
        opacity: 0.55;
    }
`;

const Header = styled.div`
    ${tw`flex items-center justify-between px-4 py-2`};
`;

const Title = styled.h3`
    ${tw`font-display text-sm m-0`};
    font-weight: 500;
    color: var(--gynx-text);
    letter-spacing: 0.02em;
`;

const Legend = styled.p`
    ${tw`text-sm flex items-center m-0 text-gynx-text-dim`};
`;

const Body = styled.div`
    ${tw`relative z-10 pl-2 pr-2 pb-2`};
`;

export default ({ title, legend, children }: ChartBlockProps) => (
    <Panel className={'group'}>
        <Header>
            <Title>{title}</Title>
            {legend && <Legend>{legend}</Legend>}
        </Header>
        <Body>{children}</Body>
    </Panel>
);
