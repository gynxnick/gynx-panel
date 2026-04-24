export interface EggSwitchOption {
    eggId: number;
    name: string;
    description: string;
    iconUrl: string | null;
    preservesFiles: boolean;
    cooldownRemainingSeconds: number;
    warningCopy: string | null;
}

export interface EggSwitchVariableChange {
    envKey: string;
    from: string | null;
    to: string | null;
}

export interface EggSwitchPreview {
    targetEgg: {
        eggId: number;
        name: string;
        dockerImage: string;
    };
    variableChanges: EggSwitchVariableChange[];
    filesWipeRequired: boolean;
    cooldownRemainingSeconds: number;
    warnings: string[];
}

export interface EggSwitchLogStatus {
    logId: number;
    status: 'queued' | 'running' | 'success' | 'failed';
    error?: string | null;
    startedAt?: string | null;
    completedAt?: string | null;
}

export interface EggSwitchRequestResult {
    logId: number;
    status: EggSwitchLogStatus['status'];
    trackUrl: string;
}
