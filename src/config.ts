import type {DOMConfig} from "@memberstack/dom/lib/methods/index";

export interface AdapterConfig extends DOMConfig {
   adapter: {
       enabled: boolean;
       forceEnabled: boolean;
       /**
        * ToDo review the format of this array
        * [v1MembershipId, v2PlanId]
        */
       importedMemberships: Array<[string, string]>;
   }
   appIdV1: string;
    debug: boolean;
}

const defaultConfig: AdapterConfig = {
    adapter: {
        enabled: true,
        forceEnabled: true, // it won't require cookie or query param to work
        importedMemberships: [["5e9ddf661c838d00172a2bd2", "pln_work-life-balance-7b1nt01ro"],]
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