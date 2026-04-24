import React, { useEffect, useMemo, useState } from 'react';
import {
    faClock,
    faCloudDownloadAlt,
    faCloudUploadAlt,
    faHdd,
    faMemory,
    faMicrochip,
    faWifi,
} from '@fortawesome/free-solid-svg-icons';
import { bytesToString, ip, mbToBytes } from '@/lib/formatters';
import { ServerContext } from '@/state/server';
import { SocketEvent, SocketRequest } from '@/components/server/events';
import UptimeDuration from '@/components/server/UptimeDuration';
import StatBlock from '@/components/server/console/StatBlock';
import useWebsocketEvent from '@/plugins/useWebsocketEvent';
import classNames from 'classnames';
import { capitalize } from '@/lib/strings';

/**
 * Server-side stats panel (right column of the Console page).
 *
 * Order, per the design spec:
 *   1. Server Status  → prominent uptime tile in status-green
 *   2. Connection     → IP:port copy pill in blue
 *   3. Metrics        → CPU (blue), RAM (purple), Disk (yellow), Net (cyan)
 *
 * Each metric tile exposes a progress bar when it has a defined limit.
 * Severity (ok/warn/crit) flips the accent to yellow/red when thresholds are
 * crossed — no need for custom logic per tile, the helper below normalises
 * the legacy `color` prop so upstream call patterns still work.
 */

type Stats = Record<'memory' | 'cpu' | 'disk' | 'uptime' | 'rx' | 'tx', number>;

const severityFor = (value: number, limit: number | null): string | undefined => {
    if (!limit || limit <= 0) return undefined;
    const ratio = value / limit;
    if (ratio > 0.9) return 'bg-red-500';
    if (ratio > 0.75) return 'bg-yellow-500';
    return undefined;
};

const Limit = ({ limit, children }: { limit: string | null; children: React.ReactNode }) => (
    <>
        {children}
        <span className={'ml-1 text-gynx-text-mute text-[70%] select-none'}>/ {limit || <>&infin;</>}</span>
    </>
);

const ServerDetailsBlock = ({ className }: { className?: string }) => {
    const [stats, setStats] = useState<Stats>({ memory: 0, cpu: 0, disk: 0, uptime: 0, tx: 0, rx: 0 });

    const status = ServerContext.useStoreState((state) => state.status.value);
    const connected = ServerContext.useStoreState((state) => state.socket.connected);
    const instance = ServerContext.useStoreState((state) => state.socket.instance);
    const limits = ServerContext.useStoreState((state) => state.server.data!.limits);

    const textLimits = useMemo(
        () => ({
            cpu: limits?.cpu ? `${limits.cpu}%` : null,
            memory: limits?.memory ? bytesToString(mbToBytes(limits.memory)) : null,
            disk: limits?.disk ? bytesToString(mbToBytes(limits.disk)) : null,
        }),
        [limits]
    );

    const allocation = ServerContext.useStoreState((state) => {
        const match = state.server.data!.allocations.find((allocation) => allocation.isDefault);
        return !match ? 'n/a' : `${match.alias || ip(match.ip)}:${match.port}`;
    });

    useEffect(() => {
        if (!connected || !instance) return;
        instance.send(SocketRequest.SEND_STATS);
    }, [instance, connected]);

    useWebsocketEvent(SocketEvent.STATS, (data) => {
        let parsed: any = {};
        try {
            parsed = JSON.parse(data);
        } catch (e) {
            return;
        }

        setStats({
            memory: parsed.memory_bytes,
            cpu: parsed.cpu_absolute,
            disk: parsed.disk_bytes,
            tx: parsed.network.tx_bytes,
            rx: parsed.network.rx_bytes,
            uptime: parsed.uptime || 0,
        });
    });

    // Progress fractions — only set when a hard limit is defined, so ∞ tiles
    // stay clean (no progress bar).
    const cpuPct = limits?.cpu ? stats.cpu / limits.cpu : undefined;
    const memPct = limits?.memory ? stats.memory / mbToBytes(limits.memory) : undefined;
    const diskPct = limits?.disk ? stats.disk / mbToBytes(limits.disk) : undefined;

    return (
        <div className={classNames('flex flex-col gap-2', className)}>
            {/* 1. Server Status */}
            <StatBlock
                icon={faClock}
                title={'status'}
                metric={'status'}
                color={status === 'offline' ? undefined : undefined}
            >
                {status === null ? (
                    'Offline'
                ) : stats.uptime > 0 ? (
                    <UptimeDuration uptime={stats.uptime / 1000} />
                ) : (
                    capitalize(status)
                )}
            </StatBlock>

            {/* 2. Connection */}
            <StatBlock icon={faWifi} title={'connection'} metric={'net'} copyOnClick={allocation}>
                <span className={'font-mono'}>{allocation}</span>
            </StatBlock>

            {/* 3. Metrics — CPU / RAM / Disk / Network */}
            <StatBlock
                icon={faMicrochip}
                title={'cpu load'}
                metric={'cpu'}
                color={severityFor(stats.cpu, limits?.cpu)}
                progress={cpuPct}
            >
                {status === 'offline' ? (
                    <span className={'text-gynx-text-mute'}>Offline</span>
                ) : (
                    <Limit limit={textLimits.cpu}>{stats.cpu.toFixed(2)}%</Limit>
                )}
            </StatBlock>

            <StatBlock
                icon={faMemory}
                title={'memory'}
                metric={'ram'}
                color={severityFor(stats.memory, limits?.memory ? mbToBytes(limits.memory) : null)}
                progress={memPct}
            >
                {status === 'offline' ? (
                    <span className={'text-gynx-text-mute'}>Offline</span>
                ) : (
                    <Limit limit={textLimits.memory}>{bytesToString(stats.memory)}</Limit>
                )}
            </StatBlock>

            <StatBlock
                icon={faHdd}
                title={'disk'}
                metric={'disk'}
                color={severityFor(stats.disk, limits?.disk ? mbToBytes(limits.disk) : null)}
                progress={diskPct}
            >
                <Limit limit={textLimits.disk}>{bytesToString(stats.disk)}</Limit>
            </StatBlock>

            <div className={'grid grid-cols-2 gap-2'}>
                <StatBlock icon={faCloudDownloadAlt} title={'net in'} metric={'net'}>
                    {status === 'offline' ? (
                        <span className={'text-gynx-text-mute'}>—</span>
                    ) : (
                        bytesToString(stats.rx)
                    )}
                </StatBlock>
                <StatBlock icon={faCloudUploadAlt} title={'net out'} metric={'net'}>
                    {status === 'offline' ? (
                        <span className={'text-gynx-text-mute'}>—</span>
                    ) : (
                        bytesToString(stats.tx)
                    )}
                </StatBlock>
            </div>
        </div>
    );
};

export default ServerDetailsBlock;
