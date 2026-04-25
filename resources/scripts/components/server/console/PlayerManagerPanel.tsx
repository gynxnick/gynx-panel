import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components/macro';
import tw from 'twin.macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUserSlash,
    faGavel,
    faCrown,
    faCircleNotch,
    faUserShield,
    faUsers,
    faSyncAlt,
} from '@fortawesome/free-solid-svg-icons';
import { ServerContext } from '@/state/server';
import { SocketEvent } from '@/components/server/events';
import { detectGameCommands, GameCommandSet } from '@/helpers/gameCommands';

const Card = styled.section`
    ${tw`rounded-xl`};
    background: var(--gynx-surface);
    border: 1px solid var(--gynx-edge);
    overflow: hidden;
`;

const Header = styled.header`
    ${tw`flex items-center gap-3 px-4 py-3`};
    border-bottom: 1px solid var(--gynx-edge);
`;

const Title = styled.h3`
    ${tw`m-0 flex-1 text-sm font-medium`};
    color: var(--gynx-text);
    font-family: 'Space Grotesk', sans-serif;
    letter-spacing: 0.02em;
`;

const Eyebrow = styled.span`
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: lowercase;
    color: var(--gynx-text-mute);
    font-family: 'Space Grotesk', sans-serif;
`;

const RefreshButton = styled.button`
    ${tw`inline-flex items-center justify-center flex-shrink-0`};
    width: 32px;
    height: 32px;
    background: transparent;
    border: 1px solid var(--gynx-edge-2);
    border-radius: 8px;
    color: var(--gynx-text-dim);
    cursor: pointer;
    transition: color .15s ease, border-color .15s ease, background .15s ease;

    &:hover {
        color: var(--gynx-text);
        border-color: rgba(124, 58, 237, 0.4);
        background: rgba(124, 58, 237, 0.08);
    }
`;

const Row = styled.div`
    ${tw`flex items-center gap-3 px-4 py-2.5`};
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);

    &:last-child { border-bottom: 0; }
`;

const Avatar = styled.div`
    ${tw`flex items-center justify-center flex-shrink-0`};
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(124, 58, 237, 0.18), rgba(34, 211, 238, 0.12));
    color: #C4B5FD;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    font-family: 'Space Grotesk', sans-serif;
`;

const Name = styled.div`
    ${tw`flex-1 min-w-0 truncate`};
    color: var(--gynx-text);
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-size: 13px;
`;

const Actions = styled.div`
    ${tw`flex items-center gap-1.5 flex-shrink-0`};
`;

const ActionButton = styled.button<{ $variant?: 'default' | 'danger' | 'admin' }>`
    ${tw`inline-flex items-center justify-center cursor-pointer`};
    width: 32px;
    height: 32px;
    border-radius: 6px;
    background: transparent;
    color: ${({ $variant }) =>
        $variant === 'danger'
            ? '#F87171'
            : $variant === 'admin'
            ? '#FCD34D'
            : 'var(--gynx-text-dim)'};
    border: 1px solid var(--gynx-edge-2);
    transition: background .15s ease, border-color .15s ease, color .15s ease;

    &:hover:not(:disabled) {
        color: ${({ $variant }) =>
            $variant === 'danger'
                ? '#FCA5A5'
                : $variant === 'admin'
                ? '#FDE68A'
                : 'var(--gynx-text)'};
        background: ${({ $variant }) =>
            $variant === 'danger'
                ? 'rgba(248, 113, 113, 0.1)'
                : $variant === 'admin'
                ? 'rgba(252, 211, 77, 0.1)'
                : 'rgba(124, 58, 237, 0.08)'};
        border-color: ${({ $variant }) =>
            $variant === 'danger'
                ? 'rgba(248, 113, 113, 0.4)'
                : $variant === 'admin'
                ? 'rgba(252, 211, 77, 0.4)'
                : 'rgba(124, 58, 237, 0.35)'};
    }

    &:disabled { opacity: .5; cursor: not-allowed; }
`;

const Empty = styled.div`
    ${tw`px-4 py-8 text-center`};
    color: var(--gynx-text-mute);
    font-size: 13px;
`;

const GameTag = styled.span`
    ${tw`inline-flex items-center px-2 py-0.5 rounded-md`};
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.04em;
    color: #C4B5FD;
    background: rgba(124, 58, 237, 0.12);
    border: 1px solid rgba(124, 58, 237, 0.35);
    text-transform: lowercase;
`;

const stripAnsi = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, '');

/**
 * Parse the Minecraft `list` command's response and seed the roster.
 * Format: "There are X of a max of Y players online: Name1, Name2, Name3"
 */
const parseMinecraftList = (line: string): string[] => {
    const m = stripAnsi(line).match(/players online:\s*(.+)$/i);
    if (!m) return [];
    return m[1]
        .split(/[,\s]+/)
        .map((n) => n.trim())
        .filter((n) => /^[A-Za-z0-9_]{2,16}$/.test(n));
};

const PlayerManagerPanel: React.FC = () => {
    const server = ServerContext.useStoreState((s) => s.server.data);
    const { connected, instance } = ServerContext.useStoreState((s) => s.socket);

    const game = useMemo<GameCommandSet | null>(() => detectGameCommands(server || undefined), [server]);

    const [players, setPlayers] = useState<Set<string>>(new Set());
    const [busy, setBusy] = useState<string | null>(null);

    // Subscribe to console output and maintain the roster.
    useEffect(() => {
        if (!instance || !connected || !game) return;

        const onLine = (raw: string) => {
            const line = stripAnsi(raw);

            // Minecraft `list` response — seeds the whole roster at once.
            if (game.label === 'minecraft') {
                const names = parseMinecraftList(line);
                if (names.length > 0) {
                    setPlayers(new Set(names));
                    return;
                }
                // Empty list response wipes the roster.
                if (/players online:\s*$/i.test(line)) {
                    setPlayers(new Set());
                    return;
                }
            }

            const join = game.joinPattern && line.match(game.joinPattern);
            if (join && join[1]) {
                const name = join[1];
                setPlayers((prev) => {
                    if (prev.has(name)) return prev;
                    const next = new Set(prev);
                    next.add(name);
                    return next;
                });
                return;
            }
            const leave = game.leavePattern && line.match(game.leavePattern);
            if (leave && leave[1]) {
                const name = leave[1];
                setPlayers((prev) => {
                    if (!prev.has(name)) return prev;
                    const next = new Set(prev);
                    next.delete(name);
                    return next;
                });
            }
        };

        instance.addListener(SocketEvent.CONSOLE_OUTPUT, onLine);
        instance.addListener(SocketEvent.DAEMON_MESSAGE, onLine);

        // Seed the roster on mount.
        if (game.listPlayers) {
            instance.send('send command', game.listPlayers);
        }

        return () => {
            instance.removeListener(SocketEvent.CONSOLE_OUTPUT, onLine);
            instance.removeListener(SocketEvent.DAEMON_MESSAGE, onLine);
        };
    }, [instance, connected, game?.label]);

    const refresh = useCallback(() => {
        if (!instance || !connected || !game?.listPlayers) return;
        instance.send('send command', game.listPlayers);
    }, [instance, connected, game?.label]);

    const sendCommand = useCallback(
        (cmd: string, key: string) => {
            if (!instance || !connected) return;
            setBusy(key);
            instance.send('send command', cmd);
            // Visual hint only — the server's response will reach us via
            // the console listener regardless.
            setTimeout(() => setBusy((b) => (b === key ? null : b)), 800);
        },
        [instance, connected],
    );

    if (!game) return null;

    const sortedPlayers = Array.from(players).sort((a, b) => a.localeCompare(b));

    return (
        <Card>
            <Header>
                <FontAwesomeIcon icon={faUsers} style={{ color: '#C4B5FD' }} />
                <div style={{ flex: 1 }}>
                    <Eyebrow>player manager</Eyebrow>
                    <Title>
                        {sortedPlayers.length} online <GameTag style={{ marginLeft: 6 }}>{game.label}</GameTag>
                    </Title>
                </div>
                <RefreshButton type={'button'} onClick={refresh} title={'Refresh roster'} disabled={!connected || !game.listPlayers}>
                    <FontAwesomeIcon icon={faSyncAlt} />
                </RefreshButton>
            </Header>

            {sortedPlayers.length === 0 ? (
                <Empty>
                    No players online. Joins / leaves will appear here in real time.
                </Empty>
            ) : (
                sortedPlayers.map((name) => {
                    const kickKey = `${name}:kick`;
                    const banKey = `${name}:ban`;
                    const opKey = `${name}:op`;
                    const deopKey = `${name}:deop`;
                    return (
                        <Row key={name}>
                            <Avatar aria-hidden>{name.slice(0, 2)}</Avatar>
                            <Name title={name}>{name}</Name>
                            <Actions>
                                {game.op && (
                                    <ActionButton
                                        type={'button'}
                                        $variant={'admin'}
                                        title={'Grant OP / admin'}
                                        disabled={busy === opKey || !connected}
                                        onClick={() => {
                                            if (!confirm(`Grant operator to ${name}?`)) return;
                                            sendCommand(game.op!(name), opKey);
                                        }}
                                    >
                                        <FontAwesomeIcon icon={busy === opKey ? faCircleNotch : faCrown} spin={busy === opKey} />
                                    </ActionButton>
                                )}
                                {game.deop && (
                                    <ActionButton
                                        type={'button'}
                                        title={'Revoke OP / admin'}
                                        disabled={busy === deopKey || !connected}
                                        onClick={() => sendCommand(game.deop!(name), deopKey)}
                                    >
                                        <FontAwesomeIcon icon={busy === deopKey ? faCircleNotch : faUserShield} spin={busy === deopKey} />
                                    </ActionButton>
                                )}
                                <ActionButton
                                    type={'button'}
                                    title={'Kick'}
                                    disabled={busy === kickKey || !connected}
                                    onClick={() => {
                                        const reason = prompt(`Kick ${name}? Optional reason:`, '');
                                        if (reason === null) return;
                                        sendCommand(game.kick(name, reason || undefined), kickKey);
                                    }}
                                >
                                    <FontAwesomeIcon icon={busy === kickKey ? faCircleNotch : faUserSlash} spin={busy === kickKey} />
                                </ActionButton>
                                <ActionButton
                                    type={'button'}
                                    $variant={'danger'}
                                    title={'Ban'}
                                    disabled={busy === banKey || !connected}
                                    onClick={() => {
                                        const reason = prompt(`Ban ${name}? Optional reason (this is permanent on most games):`, '');
                                        if (reason === null) return;
                                        if (!confirm(`Confirm ban for ${name}?`)) return;
                                        sendCommand(game.ban(name, reason || undefined), banKey);
                                    }}
                                >
                                    <FontAwesomeIcon icon={busy === banKey ? faCircleNotch : faGavel} spin={busy === banKey} />
                                </ActionButton>
                            </Actions>
                        </Row>
                    );
                })
            )}
        </Card>
    );
};

export default PlayerManagerPanel;
