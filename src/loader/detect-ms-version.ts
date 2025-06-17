
/**
 * Detects whether the adapter should be activated (based on config, cookies, query params, etc.)
 */

import type {AdapterConfig} from "../config";
import {LOCAL_SESSION_NAME} from "../utils/enums";
import {logger} from "../utils/logger";

const ADAPTER_PARAM_NAME = 'adapter';


export function shouldUseAdapter(config: AdapterConfig): 'v1' | 'v2' {
    const queryParams = new URLSearchParams(window.location.search);
    const adapterInQuery = queryParams.get(ADAPTER_PARAM_NAME);
    const adapterInSession = sessionStorage.getItem(LOCAL_SESSION_NAME);

    let determinedVersion: 'v1' | 'v2';

    // Check if session storage already has a value
    if(adapterInSession === 'true') {
        determinedVersion = 'v2';
    }
    // Query parameter takes precedence over everything
    else if (adapterInQuery) {
        determinedVersion = adapterInQuery === 'true' || adapterInQuery === 'v2' ? 'v2' : 'v1';

        if (determinedVersion === 'v2') {
            sessionStorage.setItem(LOCAL_SESSION_NAME, 'true');
            logger('info', '[Adapter] Adapter found in query params. Setting session storage and cleaning up query params.');
        }

        // Clean up query param
        queryParams.delete(ADAPTER_PARAM_NAME);
        window.history.replaceState({}, '', `${window.location.pathname}${queryParams.toString() ? '?' + queryParams.toString() : ''}`);
    }
    // If no query param, check for forcedVersion in config
    else if (config.adapter.forcedVersion) {
        determinedVersion = config.adapter.forcedVersion;
        logger('info', `[Adapter] Using forced version: ${config.adapter.forcedVersion}`);
    }
    // Default to v1
    else {
        determinedVersion = 'v1';
    }

    // Set currentVersion in config (adapter object always exists)
    config.adapter.currentVersion = determinedVersion;

    return determinedVersion;
}