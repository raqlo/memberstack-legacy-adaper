import { shouldUseAdapter } from './loader/detect-env.js';
import { createLegacyProxy } from './adapter';
import { log } from './utils/logger.js';
import type {DOMConfig} from "@memberstack/dom/lib/methods/index";
import config from "./config";

async function enableLegacyAdapter() {
    // Dynamically load Memberstack 2.0 if not already present
    try {
        if (!window.$memberstackDom) {
            await loadScript('https://static.memberstack.com/scripts/v1/memberstack.js', config);
        }

        const dom = window.$memberstackDom;
        if (!dom) {
           throw '[Adapter] Failed to load Memberstack 2.0'
        }

        window.MemberStack = createLegacyProxy(dom);
        log('[Adapter] Legacy adapter enabled and injected.');
    } catch (e) {
        console.error('[Adapter] Failed to enable legacy adapter:', e);
    }
}

function loadScript(src: string, config: DOMConfig) {
    window.memberstackConfig = window.memberstackConfig || config;
debugger;
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve(null);
        script.onerror = () => {
            document.head.removeChild(script);
            reject(new Error(`Failed to load ${src}`));
        };
        document.head.appendChild(script);
    });
}


if (shouldUseAdapter()) {
    enableLegacyAdapter();
} else {
    log('[Adapter] Adapter not enabled — using native Memberstack 1.0.');
}
