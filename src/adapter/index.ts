// import compatibilityMap from './compatibility-map.js';
import type {MemberstackDom} from "../types/globals";
import {createV1API} from "./v1-api";

export function createLegacyProxy($memberstackDomInstance: MemberstackDom) {
    const wrapped = createV1API($memberstackDomInstance); // your custom bridge

    return new Proxy(window.MemberStack, {
        get(_, key) {
            if (key in wrapped) {
                return wrapped[key];
            }

            // Optional: warn if method is missing
            console.warn(`[Adapter] Method "${String(key)}" not found in adapter.`);
            return undefined;
        }
    });
}
