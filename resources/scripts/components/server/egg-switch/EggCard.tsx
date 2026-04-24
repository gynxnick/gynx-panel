import React from 'react';
import styled from 'styled-components/macro';
import tw from 'twin.macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGamepad, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { EggSwitchOption } from '@/api/server/eggSwitch';

const Card = styled.button<{ $disabled: boolean }>`
    ${tw`relative w-full text-left rounded-xl p-5 cursor-pointer`};
    background: var(--gynx-surface);
    border: 1px solid var(--gynx-edge);
    transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease;
    opacity: ${({ $disabled }) => ($disabled ? 0.55 : 1)};
    pointer-events: ${({ $disabled }) => ($disabled ? 'none' : 'auto')};
    font-family: 'Inter', sans-serif;

    &:hover {
        transform: translateY(-2px);
        border-color: rgba(124, 58, 237, 0.5);
        box-shadow: 0 12px 30px -14px rgba(124, 58, 237, 0.45);
    }
`;

const Header = styled.div`
    ${tw`flex items-start gap-3`};
`;

const Icon = styled.div`
    ${tw`flex items-center justify-center rounded-md flex-shrink-0`};
    width: 40px;
    height: 40px;
    background: rgba(124, 58, 237, 0.08);
    border: 1px solid rgba(124, 58, 237, 0.25);
    color: #C4B5FD;
    font-size: 16px;
    transition: transform .2s ease;

    ${Card}:hover & {
        transform: scale(1.05);
    }
`;

const IconImg = styled.img`
    ${tw`rounded-md`};
    width: 40px;
    height: 40px;
    object-fit: cover;
`;

const Title = styled.h3`
    ${tw`m-0 text-base font-medium`};
    color: var(--gynx-text);
    letter-spacing: 0.01em;
`;

const Meta = styled.div`
    ${tw`mt-0.5 text-xs`};
    color: var(--gynx-text-mute);
`;

const Description = styled.p`
    ${tw`mt-3 text-sm m-0`};
    color: var(--gynx-text-dim);
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
`;

const Badges = styled.div`
    ${tw`flex items-center gap-2 mt-4`};
`;

const WipeBadge = styled.span`
    ${tw`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium`};
    color: #EC4899;
    background: rgba(236, 72, 153, 0.08);
    border: 1px solid rgba(236, 72, 153, 0.3);
    opacity: 0;
    transition: opacity .2s ease;

    ${Card}:hover & {
        opacity: 1;
    }
`;

const CooldownBadge = styled.span`
    ${tw`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium`};
    color: #FCD34D;
    background: rgba(252, 211, 77, 0.08);
    border: 1px solid rgba(252, 211, 77, 0.3);
`;

type Props = {
    option: EggSwitchOption;
    onSelect: (option: EggSwitchOption) => void;
};

const formatCooldown = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.ceil(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.ceil(minutes / 60);
    return `${hours}h`;
};

export const EggCard: React.FC<Props> = ({ option, onSelect }) => {
    const onCooldown = option.cooldownRemainingSeconds > 0;

    return (
        <Card
            type={'button'}
            $disabled={onCooldown}
            onClick={() => !onCooldown && onSelect(option)}
            disabled={onCooldown}
        >
            <Header>
                {option.iconUrl ? (
                    <IconImg src={option.iconUrl} alt={option.name} />
                ) : (
                    <Icon><FontAwesomeIcon icon={faGamepad} /></Icon>
                )}
                <div css={tw`flex-1 min-w-0`}>
                    <Title>{option.name}</Title>
                    <Meta>egg #{option.eggId}</Meta>
                </div>
            </Header>
            {option.description && <Description>{option.description}</Description>}
            <Badges>
                {!option.preservesFiles && (
                    <WipeBadge>
                        <FontAwesomeIcon icon={faExclamationTriangle} />
                        wipes files
                    </WipeBadge>
                )}
                {onCooldown && (
                    <CooldownBadge>
                        cooldown {formatCooldown(option.cooldownRemainingSeconds)}
                    </CooldownBadge>
                )}
            </Badges>
        </Card>
    );
};

export default EggCard;
