import React, { memo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import styled from 'styled-components/macro';
import tw from 'twin.macro';
import isEqual from 'react-fast-compare';

interface Props {
    icon?: IconProp;
    title: string | React.ReactNode;
    className?: string;
    children: React.ReactNode;
}

const Wrap = styled.section`
    ${tw`relative rounded-xl`};
    background: var(--gynx-surface);
    border: 1px solid var(--gynx-edge);
    transition: border-color .2s ease;

    &:hover {
        border-color: rgba(124, 58, 237, 0.22);
    }
`;

const Header = styled.div`
    ${tw`px-4 pt-3 pb-2 text-xs uppercase`};
    color: var(--gynx-text-dim);
    font-family: 'Inter', sans-serif;
    letter-spacing: 0.08em;
    border-bottom: 1px solid var(--gynx-edge);
`;

const Body = styled.div`
    ${tw`p-4`};
`;

const TitledGreyBox = ({ icon, title, children, className }: Props) => (
    <Wrap className={className}>
        <Header>
            {typeof title === 'string' ? (
                <p css={tw`m-0`}>
                    {icon && (
                        <FontAwesomeIcon
                            icon={icon}
                            css={tw`mr-2`}
                            style={{ color: '#C4B5FD' }}
                        />
                    )}
                    {title}
                </p>
            ) : (
                title
            )}
        </Header>
        <Body>{children}</Body>
    </Wrap>
);

export default memo(TitledGreyBox, isEqual);
