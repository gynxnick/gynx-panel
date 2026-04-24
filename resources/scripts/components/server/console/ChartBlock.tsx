import React from 'react';
import styled from 'styled-components/macro';
import tw from 'twin.macro';

/**
 * Legacy wrapper — kept so any external import still compiles, but in gynx-panel
 * we now unify the three charts into a single tabbed ChartPanel. New callers
 * should import ChartPanel from StatGraphs/ChartPanel instead.
 */

interface ChartBlockProps {
    title: string;
    legend?: React.ReactNode;
    children: React.ReactNode;
}

const Panel = styled.div`
    ${tw`relative rounded-xl`};
    background: var(--gynx-surface);
    border: 1px solid var(--gynx-edge);
    padding-top: 0.5rem;
    overflow: hidden;
    transition: border-color .25s ease, box-shadow .25s ease;

    &:hover {
        border-color: rgba(124, 58, 237, 0.35);
        box-shadow: 0 0 0 1px rgba(124, 58, 237, 0.35), 0 10px 28px -12px rgba(124, 58, 237, 0.4);
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
    <Panel>
        <Header>
            <Title>{title}</Title>
            {legend && <Legend>{legend}</Legend>}
        </Header>
        <Body>{children}</Body>
    </Panel>
);
