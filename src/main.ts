import {shouldUseAdapter} from './loader/detect-env.js';
import {createLegacyProxy} from './adapter';
import {logger} from './utils/logger.js';
import {type AdapterConfig, config} from "./config";
import {deleteV1Session} from "./utils/v1-sessions";

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

        if(!config.adapter?.forceEnabled) {
            const scr = document.head.appendChild(script)
            scr.setAttribute('data-memberstack-id', config.appIdV1!)
        } else {
            document.head.appendChild(script)
        }
    });
}

// 🧩 Patch legacy MemberStack.onReady as early as possible
function patchMemberStackOnReady() {
    
    const existing = window.MemberStack || {};
    let resolveOnReady: (val: any) => void;
    const onReady = new Promise((resolve) => {
        resolveOnReady = resolve;
    });

    // Replace only onReady with a deferred promise
    Object.defineProperty(existing, 'onReady', {
        configurable: true,
        enumerable: true,
        get() {
            return onReady;
        }
    });


    // Internal field we’ll call from v1-api once ready
    (existing as any).__resolveOnReady = resolveOnReady!;

    window.MemberStack = existing;
}


(async function () {
    if (shouldUseAdapter(config)) {
        deleteV1Session();
        // unhideMsElements();
        patchMemberStackOnReady();
        await enableLegacyAdapter();
    } else {
        await loadScript('https://api.memberstack.io/static/memberstack.js?webflow', config);
        debugger;
        logger('warn', '[Adapter] Adapter not enabled — using native Memberstack 1.0.');
    }
})()
