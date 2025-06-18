import type {DOMConfig} from "@memberstack/dom/lib/methods/index";

export interface AdapterConfig extends DOMConfig {
    adapter: {
        enabled: boolean;
        currentVersion?: "v1" | "v2"; // readonly
        importedMemberships: Record<string, string>;
        forcedVersion?: "v1" | "v2";
        loginUrl?: string;
    }
    appIdV1: string;
    debug: boolean;
}

const defaultConfig: AdapterConfig = {
    adapter: {
        enabled: true,
        importedMemberships: import.meta.env.VITE_MEMBERSHIPS_MAP_TARGET ? JSON.parse(import.meta.env.VITE_MEMBERSHIPS_MAP_TARGET) : {},
        loginUrl: import.meta.env.VITE_LOGIN_URL,
    },
    appIdV1: import.meta.env.VITE_APP_ID_V1,
    publicKey: import.meta.env.VITE_PUBLIC_KEY_V2,
    appId: import.meta.env.VITE_APP_ID_V2,
    debug: true
};

// Utility function to merge configurations
export function createConfig(defaultConfig: AdapterConfig, userConfig: Partial<AdapterConfig>): AdapterConfig {
    return {
        ...defaultConfig,
        ...userConfig,
        adapter: {
            ...defaultConfig.adapter,
            ...userConfig.adapter,
        }
    };
}

// Singleton config initialization
const userConfig: Partial<AdapterConfig> = window.memberstackConfig || {};
export const config: AdapterConfig = createConfig(defaultConfig, userConfig);