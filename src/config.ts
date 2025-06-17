import type {DOMConfig} from "@memberstack/dom/lib/methods/index";

export interface AdapterConfig extends DOMConfig {
   adapter: {
       enabled: boolean;
       currentVersion: "v1" | "v2";
       importedMemberships: Record<string, string>;
   }
   appIdV1: string;
    debug: boolean;
}

const defaultConfig: AdapterConfig = {
    adapter: {
        enabled: true,
        currentVersion: "v1",
        importedMemberships: import.meta.env.VITE_MEMBERSHIPS_MAP_TARGET ? JSON.parse(import.meta.env.VITE_MEMBERSHIPS_MAP_TARGET) : {},
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