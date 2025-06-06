/**
 * This adapts the 2.0 API ($memberstackDom) to look and behave like 1.0.
 * It handles data shape changes, promises normalization, etc.
 */
import type {MemberstackDom} from "../types/globals";
import type {onReadyPayload} from "../types/v1-entities";

// import {adaptPlanObject} from "./v2-object-map";
// import {logger} from "../utils/logger";


// @ts-ignore
export default function buildV2Bridge($dom: MemberstackDom) {
    return {
        // Add more adapters as needed
    };
}

let cachedOnReady: onReadyPayload | undefined;

function pollForDom(resolve: (payload: onReadyPayload) => void) {
    const currentMemberRaw = localStorage.getItem('_ms-mem');
    let currentMember: any;

    try {
        currentMember = currentMemberRaw ? JSON.parse(currentMemberRaw) : null;
    } catch {
        currentMember = null;
    }

    resolve({
        email: currentMember?.auth?.email || '',
        loggedIn: !!currentMember?.data,
        getMetaData() {},
        updateMetaData() {},
        updateProfile() {},
        memberPage: undefined,
        membership: null,
    });
}

export async function onReadyPromise(): Promise<onReadyPayload> {
    if (cachedOnReady) return cachedOnReady;

    await new Promise<onReadyPayload>((resolve) => {
        pollForDom((payload) => {
            cachedOnReady = payload;

            if ((window.MemberStack as any).__resolveOnReady) {
                (window.MemberStack as any).__resolveOnReady(cachedOnReady);
                delete (window.MemberStack as any).__resolveOnReady;
            }

            resolve(payload);
        });
    });

    return cachedOnReady!;
}