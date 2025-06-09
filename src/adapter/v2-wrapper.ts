/**
 * This adapts the 2.0 API ($memberstackDom) to look and behave like 1.0.
 * It handles data shape changes, promises normalization, etc.
 */
import type {MemberstackDom} from "../types/globals";
import type {onReadyPayload} from "../types/v1-entities";
import {getCurrentMemberV2, isMemberAuthV2} from "../utils/sessions";

// import {adaptPlanObject} from "./v2-object-map";
// import {logger} from "../utils/logger";


// @ts-ignore
export default function buildV2Bridge($dom: MemberstackDom) {
    return {
        // Add more adapters as needed
    };
}

/**
 * In-memory cache to ensure we don’t resolve the Promise more than once or recompute unnecessarily
 */
let cachedOnReady: onReadyPayload | undefined;

/**
 * Polls for the MemberStack 2.0 API to be ready. This is used to implement the onReadyPromise() function.
 */

function pollForMsV2(resolve: (payload: onReadyPayload) => void) {
    const currentMember = getCurrentMemberV2()
    resolve({
        email: currentMember?.auth?.email || '',
        loggedIn: isMemberAuthV2(),
        getMetaData() {
        },
        updateMetaData() {
        },
        updateProfile() {
        },
        memberPage: undefined,
        membership: null,
    });
}

/**
 * Returns a Promise that resolves once the MemberStack 2.0 API is ready. The Promise will resolve with the same
 * payload as the legacy 1.0 API. The Promise will be resolved only once. If the legacy 1.0 API is already ready,
 * the Promise will resolve immediately. The Promise will never reject.
 */

export async function onReadyPromise(): Promise<onReadyPayload> {
    if (cachedOnReady) return cachedOnReady;

    await new Promise<onReadyPayload>((resolve) => {
        pollForMsV2((payload) => {
            cachedOnReady = payload;

            if ((window.MemberStack).__resolveOnReady) {
                (window.MemberStack).__resolveOnReady(cachedOnReady);
                delete (window.MemberStack).__resolveOnReady; //why we have to delete this
            }

            resolve(payload);
        });
    });

    return cachedOnReady!;
}