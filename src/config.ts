import type {DOMConfig} from "@memberstack/dom/lib/methods/index";

export interface AdapterConfig extends DOMConfig {
   adapter: {
       enabled: boolean;
       forceEnabled: boolean;
   }
    debug: boolean;
}

const defaultConfig: AdapterConfig = {
    adapter: {
        enabled: true,
        forceEnabled: true // it won't require cookie or query param to work
    },
    publicKey: import.meta.env.VITE_PUBLIC_KEY_V2,
    appId: import.meta.env.VITE_APP_ID_V2,
    debug: false
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