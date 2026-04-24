import React, { memo, useCallback, useState } from 'react';
import isEqual from 'react-fast-compare';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faNetworkWired } from '@fortawesome/free-solid-svg-icons';
import InputSpinner from '@/components/elements/InputSpinner';
import { Textarea } from '@/components/elements/Input';
import Can from '@/components/elements/Can';
import { Button } from '@/components/elements/button/index';
import { Allocation } from '@/api/server/getServer';
import { debounce } from 'debounce';
import setServerAllocationNotes from '@/api/server/network/setServerAllocationNotes';
import { useFlashKey } from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';
import DeleteAllocationButton from '@/components/server/network/DeleteAllocationButton';
import setPrimaryServerAllocation from '@/api/server/network/setPrimaryServerAllocation';
import getServerAllocations from '@/api/swr/getServerAllocations';
import { ip } from '@/lib/formatters';
import { Card, KeyValue, Pill } from '@/components/gynx';

interface Props {
    allocation: Allocation;
}

const NetIcon = styled.div`
    ${tw`flex items-center justify-center rounded-md`};
    width: 32px;
    height: 32px;
    background: rgba(124, 58, 237, 0.08);
    border: 1px solid rgba(124, 58, 237, 0.22);
    color: #C4B5FD;
    flex: 0 0 32px;
`;

const HeaderTitle = styled.span`
    ${tw`inline-flex items-center gap-3`};
`;

const Addr = styled.code`
    ${tw`text-sm`};
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    color: var(--gynx-text);
`;

const NotesRow = styled.div`
    ${tw`mt-3`};

    & textarea {
        background: rgba(15, 16, 25, 0.7) !important;
        border-color: var(--gynx-edge) !important;
        color: var(--gynx-text);
        font-family: 'Inter', sans-serif;
        font-size: 13px;
        border-radius: 8px;
        padding: 8px 10px;
        transition: border-color .15s ease;

        &:hover {
            border-color: var(--gynx-edge-2) !important;
        }
        &:focus {
            border-color: rgba(124, 58, 237, 0.5) !important;
            outline: none;
            box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.18);
        }
    }
`;

const Footer = styled.div`
    ${tw`flex items-center justify-end gap-2 mt-4 pt-3`};
    border-top: 1px solid var(--gynx-edge);
`;

const AllocationRow = ({ allocation }: Props) => {
    const [loading, setLoading] = useState(false);
    const { clearFlashes, clearAndAddHttpError } = useFlashKey('server:network');
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { mutate } = getServerAllocations();

    const onNotesChanged = useCallback((id: number, notes: string) => {
        mutate((data) => data?.map((a) => (a.id === id ? { ...a, notes } : a)), false);
    }, []);

    const setAllocationNotes = debounce((notes: string) => {
        setLoading(true);
        clearFlashes();

        setServerAllocationNotes(uuid, allocation.id, notes)
            .then(() => onNotesChanged(allocation.id, notes))
            .catch((error) => clearAndAddHttpError(error))
            .then(() => setLoading(false));
    }, 750);

    const setPrimaryAllocation = () => {
        clearFlashes();
        mutate((data) => data?.map((a) => ({ ...a, isDefault: a.id === allocation.id })), false);

        setPrimaryServerAllocation(uuid, allocation.id).catch((error) => {
            clearAndAddHttpError(error);
            mutate();
        });
    };

    const addr = allocation.alias || ip(allocation.ip);

    return (
        <Card
            variant={allocation.isDefault ? 'accent' : 'flat'}
            accentColor={'#7C3AED'}
            title={
                <HeaderTitle>
                    <NetIcon><FontAwesomeIcon icon={faNetworkWired} /></NetIcon>
                    <Addr>
                        {addr}:{allocation.port}
                    </Addr>
                </HeaderTitle>
            }
            actions={allocation.isDefault ? <Pill variant={'live'}>primary</Pill> : null}
        >
            <KeyValue
                label={allocation.alias ? 'Hostname' : 'IP address'}
                value={addr}
                copyable={`${addr}:${allocation.port}`}
            />
            <KeyValue label={'Port'} value={allocation.port} copyable={`${allocation.port}`} />

            <NotesRow>
                <InputSpinner visible={loading}>
                    <Textarea
                        placeholder={'Notes (optional)'}
                        defaultValue={allocation.notes || undefined}
                        onChange={(e) => setAllocationNotes(e.currentTarget.value)}
                    />
                </InputSpinner>
            </NotesRow>

            {!allocation.isDefault && (
                <Footer>
                    <Can action={'allocation.update'}>
                        <Button.Text size={Button.Sizes.Small} onClick={setPrimaryAllocation}>
                            Make primary
                        </Button.Text>
                    </Can>
                    <Can action={'allocation.delete'}>
                        <DeleteAllocationButton allocation={allocation.id} />
                    </Can>
                </Footer>
            )}
        </Card>
    );
};

export default memo(AllocationRow, isEqual);
