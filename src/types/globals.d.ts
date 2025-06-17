import type {
    default as MsTypes,
    DOMConfig
} from "@memberstack/dom";

import type {AdapterConfig} from "@/config";

export type MemberstackDom = ReturnType<typeof MsTypes.init>;
export type MemberstackV1 = {
    getMember: () => any;
    onReady: Promise<unknown>;
    getToken: () => any;
    reload: () => any;
    logout: () => any;
    selectMembership: () => any;
    __resolveOnReady?: (val: any) => void;
}

declare global {
    interface Window {
        Webflow: any;
        MemberStack: Partial<MemberstackV1>
        memberstackConfig: AdapterConfig
        $memberstackReady?: boolean;
        $memberstackDom?: MemberstackDom;
    }
}