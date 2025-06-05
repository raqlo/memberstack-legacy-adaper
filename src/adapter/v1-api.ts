/**
 * This is the public-facing legacy 1.0 API shim.
 * It defines the surface area expected by existing custom code (e.g., MemberStack.getMember(), MemberStack.onReady(), etc.).
 */

import wrapV2 from './v2-wrapper.js';
import type {MemberstackDom} from "../types/globals";

export function createV1API(memberstackInstance: MemberstackDom) {
    const v2 = wrapV2(memberstackInstance);

    return {
        onReady: v2.onReady,
        // getMember: v2.getMember,
        // logout: v2.logout,
        // Any other MemberStack 1.0-style methods you need to support
    };
}
