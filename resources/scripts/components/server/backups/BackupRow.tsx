import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArchive, faLock } from '@fortawesome/free-solid-svg-icons';
import { format, formatDistanceToNow } from 'date-fns';
import Spinner from '@/components/elements/Spinner';
import { bytesToString } from '@/lib/formatters';
import Can from '@/components/elements/Can';
import useWebsocketEvent from '@/plugins/useWebsocketEvent';
import BackupContextMenu from '@/components/server/backups/BackupContextMenu';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import getServerBackups from '@/api/swr/getServerBackups';
import { ServerBackup } from '@/api/server/types';
import { SocketEvent } from '@/components/server/events';
import { Card, KeyValue, Pill } from '@/components/gynx';

interface Props {
    backup: ServerBackup;
    className?: string;
}

const Icon = styled.div<{ $locked?: boolean; $pending?: boolean }>`
    ${tw`flex items-center justify-center rounded-md`};
    width: 32px;
    height: 32px;
    background: ${({ $locked, $pending }) =>
        $locked
            ? 'rgba(252, 211, 77, 0.08)'
            : $pending
            ? 'rgba(156, 163, 175, 0.08)'
            : 'rgba(124, 58, 237, 0.08)'};
    border: 1px solid ${({ $locked, $pending }) =>
        $locked
            ? 'rgba(252, 211, 77, 0.35)'
            : $pending
            ? 'var(--gynx-edge-2)'
            : 'rgba(124, 58, 237, 0.25)'};
    color: ${({ $locked, $pending }) =>
        $locked ? '#FCD34D' : $pending ? '#9CA3AF' : '#C4B5FD'};
    flex: 0 0 32px;
`;

const HeaderTitle = styled.span`
    ${tw`inline-flex items-center gap-3 min-w-0`};
`;

const Name = styled.span`
    ${tw`truncate`};
    max-width: 60ch;
`;

const Checksum = styled.p`
    ${tw`text-xs mt-2 truncate`};
    color: var(--gynx-text-mute);
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    margin: 0;
`;

export default ({ backup, className }: Props) => {
    const { mutate } = getServerBackups();

    useWebsocketEvent(`${SocketEvent.BACKUP_COMPLETED}:${backup.uuid}` as SocketEvent, (data) => {
        try {
            const parsed = JSON.parse(data);
            mutate(
                (d) => ({
                    ...d,
                    items: d.items.map((b) =>
                        b.uuid !== backup.uuid
                            ? b
                            : {
                                  ...b,
                                  isSuccessful: parsed.is_successful || true,
                                  checksum: (parsed.checksum_type || '') + ':' + (parsed.checksum || ''),
                                  bytes: parsed.file_size || 0,
                                  completedAt: new Date(),
                              },
                    ),
                }),
                false,
            );
        } catch (e) {
            console.warn(e);
        }
    });

    const pending = backup.completedAt === null;
    const failed = backup.completedAt !== null && !backup.isSuccessful;
    const icon = backup.isLocked ? faLock : faArchive;

    const pill = pending ? (
        <Pill variant={'warn'}>creating</Pill>
    ) : failed ? (
        <Pill variant={'err'}>failed</Pill>
    ) : backup.isLocked ? (
        <Pill variant={'warn'}>locked</Pill>
    ) : (
        <Pill variant={'live'}>ready</Pill>
    );

    return (
        <Card
            className={className}
            title={
                <HeaderTitle>
                    <Icon $locked={backup.isLocked && !pending} $pending={pending}>
                        {pending ? <Spinner size={'small'} /> : <FontAwesomeIcon icon={icon} />}
                    </Icon>
                    <Name title={backup.name}>{backup.name}</Name>
                </HeaderTitle>
            }
            actions={
                <div css={tw`flex items-center gap-2`}>
                    {pill}
                    <Can action={['backup.download', 'backup.restore', 'backup.delete']} matchAny>
                        {!pending && <BackupContextMenu backup={backup} />}
                    </Can>
                </div>
            }
        >
            <KeyValue
                label={'Created'}
                value={
                    <span title={format(backup.createdAt, 'EEEE, MMMM do yyyy HH:mm:ss')}>
                        {formatDistanceToNow(backup.createdAt, { includeSeconds: true, addSuffix: true })}
                    </span>
                }
            />
            <KeyValue
                label={'Size'}
                value={backup.completedAt && backup.isSuccessful ? bytesToString(backup.bytes) : '—'}
            />
            {backup.checksum && <Checksum>{backup.checksum}</Checksum>}
        </Card>
    );
};
