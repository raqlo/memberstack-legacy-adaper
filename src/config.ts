import type {DOMConfig} from "@memberstack/dom/lib/methods/index";

export interface AdapterConfig extends DOMConfig {
   adapter: {}
    debug: boolean;
}


const defaultConfig: AdapterConfig = {
    adapter: {},
    publicKey: import.meta.env.VITE_PUBLIC_KEY_V2,
    appId: import.meta.env.VITE_APP_ID_V2,
    debug: false
};

// Merge with global config if present
const userConfig = window.memberstackConfig || {};
const config = {
    ...defaultConfig,
    ...userConfig,
    adapter: {
        ...defaultConfig.adapter,
        ...userConfig.adapter,
    }
};

export default config;
