/**
 * Per-game console-command registry. Used by the Player Manager panel to
 * issue kick/ban/op commands without baking Minecraft-specific syntax into
 * the UI. Each entry declares:
 *
 *   - detect(server): regex match on invocation + docker image to decide
 *     "is this a Minecraft / Rust / etc. server?"
 *   - kick / ban / op / deop / pardon: command formatters (return null when
 *     a game doesn't support that action — Rust has no concept of OP).
 *   - join / leave patterns: regex matched against console output to keep a
 *     live roster of players. The first capture group is the player name.
 *   - listPlayers: command to dump the current roster (we send this on
 *     panel open to seed the list, falling back to roster building from
 *     join/leave events alone).
 *
 * Adding a new game = adding one entry. The UI is generic.
 */

interface ServerLike {
    invocation?: string;
    dockerImage?: string;
}

export interface GameCommandSet {
    /** Human label, lowercase to match brand voice. */
    label: string;
    /** True when this server is a member of this game family. */
    detect: (server: ServerLike) => boolean;
    /** Optional listing command — sent when the roster panel opens. */
    listPlayers?: string;
    kick: (player: string, reason?: string) => string;
    ban: (player: string, reason?: string) => string;
    /** Operator / admin grant, if the game has the concept. */
    op?: (player: string) => string;
    deop?: (player: string) => string;
    pardon?: (player: string) => string;
    /** Console-output regex; group 1 = player name. */
    joinPattern?: RegExp;
    leavePattern?: RegExp;
}

const haystack = (s: ServerLike) => `${s.invocation ?? ''} ${s.dockerImage ?? ''}`;

const GAMES: GameCommandSet[] = [
    {
        label: 'minecraft',
        detect: (s) => /java|yolks?|minecraft|server\.jar|paper|spigot|fabric|forge|purpur|folia|mohist/i.test(haystack(s)),
        listPlayers: 'list',
        kick: (p, r) => `kick ${p}${r ? ' ' + r : ''}`,
        ban: (p, r) => `ban ${p}${r ? ' ' + r : ''}`,
        op: (p) => `op ${p}`,
        deop: (p) => `deop ${p}`,
        pardon: (p) => `pardon ${p}`,
        joinPattern: /([A-Za-z0-9_]{3,16}) joined the game/,
        leavePattern: /([A-Za-z0-9_]{3,16}) left the game/,
    },
    {
        label: 'rust',
        detect: (s) => /rust|RustDedicated/i.test(haystack(s)),
        listPlayers: 'players',
        // Rust requires quoted args; passes a real reason or a sane default.
        kick: (p, r) => `kick "${p}" "${r || 'kicked from server'}"`,
        ban: (p, r) => `ban "${p}" "${r || 'banned'}"`,
        joinPattern: /([A-Za-z0-9._-]+)\/[\d.:]+ joined/i,
        leavePattern: /([A-Za-z0-9._-]+)\/[\d.:]+ disconnect/i,
    },
    {
        label: '7 days to die',
        detect: (s) => /7days|sdtd|7daystodie/i.test(haystack(s)),
        listPlayers: 'lp',
        kick: (p, r) => `kick "${p}" "${r || 'kicked'}"`,
        ban: (p, r) => `ban add "${p}" 1 year "${r || 'banned'}"`,
        op: (p) => `admin add "${p}" 0`,
        deop: (p) => `admin remove "${p}"`,
        joinPattern: /Player connected.*?PlayerName='([^']+)'/i,
        leavePattern: /Player disconnected.*?PlayerName='([^']+)'/i,
    },
    {
        label: 'ark',
        detect: (s) => /\bark\b|shootergame/i.test(haystack(s)),
        listPlayers: 'ListPlayers',
        kick: (p) => `KickPlayer ${p}`,
        ban: (p) => `BanPlayer ${p}`,
        op: (p) => `SetMessageOfTheDay ${p}`, // ARK admin is via password, not per-name
    },
];

/**
 * Pick the matching command set for this server, or null if none match.
 * The caller should hide the Player Manager when this is null.
 */
export function detectGameCommands(server: ServerLike | null | undefined): GameCommandSet | null {
    if (!server) return null;
    for (const g of GAMES) {
        if (g.detect(server)) return g;
    }
    return null;
}

export function isRustServer(server: ServerLike | null | undefined): boolean {
    if (!server) return false;
    return /rust|RustDedicated/i.test(haystack(server));
}
