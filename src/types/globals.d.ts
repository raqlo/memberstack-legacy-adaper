import type {
    default as MsTypes,
    DOMConfig
} from "@memberstack/dom";

import type {AdapterConfig} from "../config";

export type MemberstackDom = ReturnType<typeof MsTypes.init>;

declare global {
    interface Window {
        Webflow: any;
        MemberStack: any;
        __MemberStackOriginal: typeof window.MemberStack;
        memberstackConfig: AdapterConfig
        $memberstackReady?: boolean;
        $memberstackDom?: MemberstackDom;
    }
}