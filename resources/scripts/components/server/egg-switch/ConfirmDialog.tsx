import React, { useEffect, useState } from 'react';
import styled from 'styled-components/macro';
import tw from 'twin.macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faTimes } from '@fortawesome/free-solid-svg-icons';
import Modal from '@/components/elements/Modal';
import Button from '@/components/elements/Button';
import Input from '@/components/elements/Input';
import Label from '@/components/elements/Label';
import { EggSwitchOption, EggSwitchPreview } from '@/api/server/eggSwitch';

const Section = styled.div`
    ${tw`mb-5`};
`;

const SectionTitle = styled.h4`
    ${tw`m-0 mb-2 text-xs uppercase`};
    color: var(--gynx-text-mute);
    font-family: 'Inter', sans-serif;
    letter-spacing: 0.08em;
`;

const DiffTable = styled.div`
    ${tw`rounded-md overflow-hidden`};
    border: 1px solid var(--gynx-edge);
    background: rgba(15, 17, 26, 0.6);
`;

const DiffRow = styled.div`
    ${tw`grid gap-3 px-3 py-2 text-xs items-center`};
    grid-template-columns: 1fr 1fr 1fr;
    border-bottom: 1px solid var(--gynx-edge);
    &:last-child { border-bottom: 0; }
    font-family: 'JetBrains Mono', ui-monospace, monospace;
`;

const EnvKey = styled.span`
    color: var(--gynx-text);
`;

const FromVal = styled.span`
    color: var(--gynx-text-dim);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const ToVal = styled.span`
    color: #C4B5FD;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const Warning = styled.div`
    ${tw`flex items-start gap-3 rounded-md p-3 mb-4`};
    background: rgba(248, 113, 113, 0.06);
    border: 1px solid rgba(248, 113, 113, 0.3);
    color: #FCA5A5;
    font-size: 13px;
    line-height: 1.5;
    font-family: 'Inter', sans-serif;
`;

const WarningIcon = styled(FontAwesomeIcon)`
    ${tw`flex-shrink-0 mt-0.5`};
    color: #F87171;
`;

const Actions = styled.div`
    ${tw`flex items-center justify-end gap-2 mt-6`};
`;

const DangerButton = styled(Button)`
    && {
        background: #EC4899 !important;
        border-color: #EC4899 !important;
        color: #fff !important;
    }
    &&:hover {
        background: #DB2777 !important;
        border-color: #DB2777 !important;
    }
`;

type Props = {
    option: EggSwitchOption;
    preview: EggSwitchPreview | null;
    loadingPreview: boolean;
    loadingConfirm: boolean;
    serverName: string;
    visible: boolean;
    onDismiss: () => void;
    onConfirm: () => void;
};

export const ConfirmDialog: React.FC<Props> = ({
    option, preview, loadingPreview, loadingConfirm,
    serverName, visible, onDismiss, onConfirm,
}) => {
    const [confirmText, setConfirmText] = useState('');

    useEffect(() => {
        if (!visible) setConfirmText('');
    }, [visible]);

    const wipes = preview?.filesWipeRequired ?? !option.preservesFiles;
    const mustType = wipes; // only require typing for destructive switches
    const canConfirm = !loadingConfirm && (!mustType || confirmText.trim() === serverName);

    return (
        <Modal visible={visible} showSpinnerOverlay={loadingPreview || loadingConfirm} onDismissed={onDismiss}>
            <h2 css={tw`m-0 mb-4 text-xl`}>Switch to {option.name}</h2>

            {preview && preview.warnings.length > 0 && (
                <Warning>
                    <WarningIcon icon={faExclamationTriangle} />
                    <div>
                        {preview.warnings.map((w, i) => (
                            <div key={i} css={i > 0 ? tw`mt-1` : undefined}>{w}</div>
                        ))}
                    </div>
                </Warning>
            )}

            {preview && preview.variableChanges.length > 0 && (
                <Section>
                    <SectionTitle>variable changes</SectionTitle>
                    <DiffTable>
                        <DiffRow>
                            <EnvKey css={tw`text-xs uppercase`} style={{ color: 'var(--gynx-text-mute)' }}>env var</EnvKey>
                            <FromVal css={tw`text-xs uppercase`} style={{ color: 'var(--gynx-text-mute)' }}>from</FromVal>
                            <ToVal css={tw`text-xs uppercase`} style={{ color: 'var(--gynx-text-mute)' }}>to</ToVal>
                        </DiffRow>
                        {preview.variableChanges.slice(0, 12).map((v) => (
                            <DiffRow key={v.envKey}>
                                <EnvKey title={v.envKey}>{v.envKey}</EnvKey>
                                <FromVal title={v.from ?? ''}>{v.from ?? '—'}</FromVal>
                                <ToVal title={v.to ?? ''}>{v.to ?? '—'}</ToVal>
                            </DiffRow>
                        ))}
                        {preview.variableChanges.length > 12 && (
                            <DiffRow>
                                <span css={tw`col-span-3 text-center text-xs`} style={{ color: 'var(--gynx-text-mute)' }}>
                                    + {preview.variableChanges.length - 12} more
                                </span>
                            </DiffRow>
                        )}
                    </DiffTable>
                </Section>
            )}

            {mustType && (
                <Section>
                    <Label>Type the server name to confirm</Label>
                    <Input
                        type={'text'}
                        autoFocus
                        placeholder={serverName}
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.currentTarget.value)}
                    />
                </Section>
            )}

            <Actions>
                <Button type={'button'} isSecondary onClick={onDismiss} disabled={loadingConfirm}>
                    Cancel
                </Button>
                {wipes ? (
                    <DangerButton type={'button'} onClick={onConfirm} disabled={!canConfirm}>
                        Switch &amp; wipe
                    </DangerButton>
                ) : (
                    <Button type={'button'} onClick={onConfirm} disabled={!canConfirm}>
                        Switch
                    </Button>
                )}
            </Actions>
        </Modal>
    );
};

export default ConfirmDialog;
