import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components/macro';
import tw from 'twin.macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { Card } from '@/components/gynx';
import { eggSwitchStatus, EggSwitchLogStatus } from '@/api/server/eggSwitch';

type Props = {
    serverUuid: string;
    logId: number;
    onDone?: (status: 'success' | 'failed') => void;
};

const spin = keyframes`
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
`;

const Spinner = styled.div`
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: 3px solid rgba(124, 58, 237, 0.2);
    border-top-color: #C4B5FD;
    animation: ${spin} 0.9s linear infinite;
    margin: 0 auto 16px;
`;

const StatusIcon = styled.div<{ $success: boolean }>`
    ${tw`flex items-center justify-center mx-auto mb-4`};
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: ${({ $success }) =>
        $success ? 'rgba(52, 211, 153, 0.10)' : 'rgba(248, 113, 113, 0.10)'};
    border: 1px solid ${({ $success }) =>
        $success ? 'rgba(52, 211, 153, 0.35)' : 'rgba(248, 113, 113, 0.35)'};
    color: ${({ $success }) => ($success ? '#34D399' : '#F87171')};
    font-size: 22px;
`;

const Title = styled.h3`
    ${tw`text-center text-base m-0 mb-2`};
    font-family: 'Inter', sans-serif;
    color: var(--gynx-text);
`;

const Detail = styled.p`
    ${tw`text-center text-sm m-0`};
    color: var(--gynx-text-dim);
    font-family: 'Inter', sans-serif;
`;

const POLL_MS = 3000;

export const ProgressPanel: React.FC<Props> = ({ serverUuid, logId, onDone }) => {
    const [status, setStatus] = useState<EggSwitchLogStatus | null>(null);

    useEffect(() => {
        let mounted = true;
        let timer: number | undefined;

        const poll = async () => {
            try {
                const s = await eggSwitchStatus(serverUuid, logId);
                if (!mounted) return;
                setStatus(s);
                if (s.status === 'success' || s.status === 'failed') {
                    onDone?.(s.status);
                    return;
                }
            } catch {
                /* transient — keep polling */
            }
            if (mounted) timer = window.setTimeout(poll, POLL_MS);
        };

        poll();
        return () => {
            mounted = false;
            if (timer) window.clearTimeout(timer);
        };
    }, [serverUuid, logId, onDone]);

    const state = status?.status ?? 'queued';
    const terminal = state === 'success' || state === 'failed';

    return (
        <Card>
            <div css={tw`py-8`}>
                {!terminal && <Spinner aria-label={'working'} />}
                {state === 'success' && (
                    <StatusIcon $success><FontAwesomeIcon icon={faCheckCircle} /></StatusIcon>
                )}
                {state === 'failed' && (
                    <StatusIcon $success={false}><FontAwesomeIcon icon={faExclamationCircle} /></StatusIcon>
                )}
                <Title>
                    {state === 'queued' && 'Queued — waiting for daemon'}
                    {state === 'running' && 'Switching — pulling image + running install'}
                    {state === 'success' && 'Switch complete'}
                    {state === 'failed' && 'Switch failed'}
                </Title>
                <Detail>
                    {state !== 'failed'
                        ? 'Keep this page open. Your server will reinstall into the new game; it can take a minute or two.'
                        : status?.error ?? 'An unexpected error occurred. Check the server activity log for details.'}
                </Detail>
            </div>
        </Card>
    );
};

export default ProgressPanel;
