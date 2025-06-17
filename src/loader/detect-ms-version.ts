
/**
 * Detects whether the adapter should be activated (based on config, cookies, query params, etc.)
 */

import type {AdapterConfig} from "@/config";
import {LOCAL_SESSION_NAME} from "@utils/enums";
import {logger} from "@utils/logger";

const ADAPTER_PARAM_NAME = 'adapter';

export function shouldUseAdapter(config: AdapterConfig): 'v1' | 'v2' {
    const queryParams = new URLSearchParams(window.location.search);
    const adapterInQuery = queryParams.get(ADAPTER_PARAM_NAME);
    const adapterInSession = sessionStorage.getItem(LOCAL_SESSION_NAME);

    let determinedVersion: 'v1' | 'v2';

    // Query parameter takes precedence over everything (allows switching)
    if (adapterInQuery) {
        // Handle different query parameter values
        if (adapterInQuery === 'true' || adapterInQuery === 'v2') {
            determinedVersion = 'v2';
        } else if (adapterInQuery === 'false' || adapterInQuery === 'v1') {
            determinedVersion = 'v1';
        } else {
            // For any other value, default to v1
            determinedVersion = 'v1';
        }

        // Store the determined version in session storage
        sessionStorage.setItem(LOCAL_SESSION_NAME, determinedVersion);
        logger('trace', `[Adapter] Adapter version ${determinedVersion} set via query params. Updating session storage and cleaning up query params.`);

        // Clean up query param
        queryParams.delete(ADAPTER_PARAM_NAME);
        window.history.replaceState({}, '', `${window.location.pathname}${queryParams.toString() ? '?' + queryParams.toString() : ''}`);
    }
    // Check if session storage already has a value
    else if (adapterInSession && (adapterInSession === 'v1' || adapterInSession === 'v2')) {
        determinedVersion = adapterInSession;
    }
    // If no query param or session, check for forcedVersion in config
    else if (config.adapter?.forcedVersion) {
        determinedVersion = config.adapter.forcedVersion;
        logger('trace', `[Adapter] Using forced version: ${config.adapter.forcedVersion}`);
    }
    // Default to v1
    else {
        determinedVersion = 'v1';
    }

    config.adapter.currentVersion = determinedVersion;

    return determinedVersion;
}