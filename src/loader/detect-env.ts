/**
 * Detects whether the adapter should be activated (based on config, cookies, query params, etc.)
 */

import type {AdapterConfig} from "../config";
import {LOCAL_SESSION_NAME} from "../utils/enums";

export function shouldUseAdapter(config: AdapterConfig): boolean {
    const queryParams = new URLSearchParams(window.location.search);
    const adapterInQuery = queryParams.get('adapter');

    // If `adapter=true` is in query params, set session storage and clean up query param
    if (adapterInQuery === 'true') {
        sessionStorage.setItem(LOCAL_SESSION_NAME, 'true');
        queryParams.delete('adapter');
        window.history.replaceState({}, '', `${window.location.pathname}?${queryParams.toString()}`);
    }

    // Check if the adapter is enabled in config or in session storage
    return config.adapter.forceEnabled || sessionStorage.getItem('useAdapter') === 'true';
}