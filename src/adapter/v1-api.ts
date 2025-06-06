/**
 * This is the public-facing legacy 1.0 API shim.
 * It defines the surface area expected by existing custom code (e.g., MemberStack.getMember(), MemberStack.onReady(), etc.).
 */

import buildV2Bridge, {onReadyPromise} from './v2-wrapper.js';
import type {MemberstackDom} from "../types/globals";

export function createV1API(memberstackInstance: MemberstackDom) {
    // @ts-ignore
    const v2 = buildV2Bridge(memberstackInstance);

    return {
        onReady: onReadyPromise(),
        // getMember: v2.getMember,
        // logout: v2.logout,
        // Any other MemberStack 1.0-style methods you need to support
    };
}
