import {shouldUseAdapter} from './loader/detect-env.js';
import {createLegacyProxy} from './adapter';
import {logger} from './utils/logger.js';
import {type AdapterConfig, config} from "./config";
import {deleteV1Session} from "./utils/sessions";

async function enableLegacyAdapter() {
    // Dynamically load Memberstack 2.0 if not already present
    logger('start', '[Adapter] starting legacy adapter...')
    try {
        if (!window.$memberstackDom) {
            await loadScript('https://static.memberstack.com/scripts/v1/memberstack.js', config);
        }

        const dom = window.$memberstackDom;
        if (!dom) {
            throw '[Adapter] Failed to load Memberstack 2.0'
        }

        window.MemberStack = createLegacyProxy(dom);


        logger('trace', '[Adapter] Legacy adapter enabled and injected.');
    } catch (e) {
        if (e instanceof Error && e.message) {
            logger('error', `${e.message}`, e);
        } else {
            logger('error', `[Adapter] Unknown error: ${e}`);
        }
    }
}

function loadScript(src: string, config: Partial<AdapterConfig>) {
    window.memberstackConfig = window.memberstackConfig || config;
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve(null);
        script.onerror = () => {
            document.head.removeChild(script);
            reject(new Error(`Failed to load ${src}`));
        };

        if (!config.adapter?.forceEnabled) {
            const scr = document.head.appendChild(script)
            scr.setAttribute('data-memberstack-id', config.appIdV1!)
        } else {
            document.head.appendChild(script)
        }
    });
}

/**
 * Grabs the existing MemberStack object if it exists — otherwise creates an empty one.
 * Replaces MemberStack.onReady with a custom Promise that doesn't resolve immediately.
 * This allows other scripts to call MemberStack.onReady() before v2 has loaded.
 * Once the data is ready, we resolve the promise manually via __resolveOnReady.
 */
function patchMemberStackOnReady() {
    const existing = window.MemberStack || {};
    let resolveOnReady: (val: any) => void;
    /** Create a Promise for MemberStack.onReady that doesn't resolve immediately.
     * Instead, we store its resolve function (resolveOnReady) so it can be manually
     * called later — once the Memberstack v2 data is ready. This allows us to mimic
     * the v1 behavior where scripts can rely on MemberStack.onReady even if v2 isn't ready yet.
     */
    const onReady = new Promise((resolve) => {
        resolveOnReady = resolve;
    });


    // Override the onReady function with a promise
    Object.defineProperty(existing, 'onReady', {
        configurable: true,
        enumerable: true,
        get() {
            return onReady;
        }
    });

    // Store the resolve function in the existing object so it can be called later
    (existing).__resolveOnReady = resolveOnReady!;

    window.MemberStack = existing;
}


(async function () {
    if (shouldUseAdapter(config)) {
        logger('info', '[Adapter] V2 Adapter enabled.');
        deleteV1Session();
        patchMemberStackOnReady();
        await enableLegacyAdapter();
    } else {
        logger('info', '[Adapter] Adapter not enabled — using native Memberstack 1.0.');
        await loadScript('https://api.memberstack.io/static/memberstack.js?webflow', config);
    }
})()
