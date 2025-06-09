import type {MemberstackDom} from "../types/globals";
import {createV1API} from "./v1-api";
import {logger} from "../utils/logger";

export function createLegacyProxy($memberstackDomInstance: MemberstackDom) {
    const v1Api = createV1API($memberstackDomInstance); // your custom bridge
    Object.assign(window.MemberStack, v1Api);


    return new Proxy(window.MemberStack, {
        get(_, key) {
            logger('trace', `[Adapter] Proxying "${String(key)}" method...`)
            if (key in v1Api) {
                // @ts-ignore @ts-expect-error ToDo create v1 lib type and type this declaration type Key = keyof typeof wrapped;
                return v1Api[key];
            }

            logger('warn',`[Adapter] Method "${String(key)}" not found in adapter.`);
            return undefined;
        }
    });
}
