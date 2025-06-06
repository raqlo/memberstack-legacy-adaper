/**
 * This adapts the 2.0 API ($memberstackDom) to look and behave like 1.0.
 * It handles data shape changes, promises normalization, etc.
 */
import type {MemberstackDom} from "../types/globals";
import type {onReadyPayload} from "../types/v1-entities";


export default function buildV2Bridge($dom: MemberstackDom) {
    return {
        // Add more adapters as needed
    };
}

let cachedOnReady: onReadyPayload;

export async function onReadyPromise(): Promise<onReadyPayload> {
    if (!cachedOnReady) {
        const currentMember = await window.$memberstackDom?.getCurrentMember();
        cachedOnReady = {
            getMetaData() {},
            memberPage: undefined,
            membership: undefined,
            updateMetaData() {},
            updateProfile() {},
            email: currentMember?.data ? currentMember.data.auth.email : '',
            loggedIn: !!currentMember?.data
        };
    }
    return cachedOnReady;
}
