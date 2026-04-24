import http from '@/api/http';
import {
    EggSwitchOption,
    EggSwitchOptionsResponse,
    EggSwitchPreview,
    EggSwitchRequestResult,
    EggSwitchLogStatus,
} from './types';

export const listEggSwitchOptions = async (uuid: string): Promise<EggSwitchOptionsResponse> => {
    const { data } = await http.get(`/api/client/servers/${uuid}/egg-switch/options`);
    return {
        options: (data?.data ?? []) as EggSwitchOption[],
        introCopy: (data?.meta?.intro_copy ?? null) as string | null,
    };
};

export const previewEggSwitch = async (uuid: string, targetEggId: number): Promise<EggSwitchPreview> => {
    const { data } = await http.post(`/api/client/servers/${uuid}/egg-switch/preview`, {
        target_egg_id: targetEggId,
    });
    return data.data as EggSwitchPreview;
};

export const requestEggSwitch = async (uuid: string, targetEggId: number): Promise<EggSwitchRequestResult> => {
    const { data } = await http.post(`/api/client/servers/${uuid}/egg-switch`, {
        target_egg_id: targetEggId,
    });
    return data.data as EggSwitchRequestResult;
};

export const eggSwitchStatus = async (uuid: string, logId: number): Promise<EggSwitchLogStatus> => {
    const { data } = await http.get(`/api/client/servers/${uuid}/egg-switch/status/${logId}`);
    return data.data as EggSwitchLogStatus;
};

export * from './types';
