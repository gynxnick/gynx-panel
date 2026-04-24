import { action, Action } from 'easy-peasy';

export interface SiteSettings {
    name: string;
    locale: string;
    recaptcha: {
        enabled: boolean;
        siteKey: string;
    };
    /**
     * Optional URL to a hosted logo image. When set, the Sidebar brand
     * renders this image in place of the inline gx monogram. Meant to be
     * pushed from the backend via window.SiteConfiguration (wrapper.blade.php)
     * so it survives page reloads and doesn't require a React rebuild.
     */
    logoUrl?: string;
}

export interface SettingsStore {
    data?: SiteSettings;
    setSettings: Action<SettingsStore, SiteSettings>;
}

const settings: SettingsStore = {
    data: undefined,

    setSettings: action((state, payload) => {
        state.data = payload;
    }),
};

export default settings;
