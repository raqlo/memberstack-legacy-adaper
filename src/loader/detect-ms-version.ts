/**
 * Detects whether the adapter should be activated (based on config, cookies, query params, etc.)
 */

import type {AdapterConfig} from "../config";
import {LOCAL_SESSION_NAME} from "../utils/enums";
import {logger} from "../utils/logger";

const ADAPTER_PARAM_NAME = 'adapter';

export function shouldUseAdapter(config: AdapterConfig): boolean {
    const queryParams = new URLSearchParams(window.location.search);
    const adapterInQuery = queryParams.get(ADAPTER_PARAM_NAME);
    const adapterInSession = sessionStorage.getItem(LOCAL_SESSION_NAME);
    if(adapterInSession === 'true') {
        return true;
    }

    // If `adapter=true` is in query params, set session storage and clean up query param
    if (adapterInQuery === 'true') {
        sessionStorage.setItem(LOCAL_SESSION_NAME, 'true');
        queryParams.delete(ADAPTER_PARAM_NAME);
        window.history.replaceState({}, '', `${window.location.pathname}`);
        logger('info', '[Adapter] Adapter found. Setting session storage and cleaning up query params.');
    }

    // Check if the adapter is enabled in config or in session storage
    return config.adapter.enabled && adapterInSession === 'true';
}