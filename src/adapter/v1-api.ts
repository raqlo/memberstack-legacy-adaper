/**
 * This is the public-facing legacy 1.0 API shim.
 * It defines the surface area expected by existing custom code (e.g., MemberStack.getMember(), MemberStack.onReady(), etc.).
 */

import buildV2Bridge, {onReadyPromise} from './build-v2-bridge';
import type {MemberstackDom} from "@/types/globals";

export function createV1API(memberstackInstance: MemberstackDom) {
    // @ts-ignore
    const v2 = buildV2Bridge(memberstackInstance);

    return {
        onReady: onReadyPromise(),
        getToken: v2.getToken,
        reload: v2.reload,
        logout: v2.logout,
        selectMembership: v2.selectMembership, // it creates a ms-plan cookie... what for?
    };
}
