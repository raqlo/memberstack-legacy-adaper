/**
 * Detects whether the adapter should be activated (based on config, cookies, query params, etc.)
 */

export function shouldUseAdapter() {
    // if config object has adapter: true, use adapter
    // if query params has adapter=true, create a session storage cookie, remove the query param
    // if cookie exists, use adapter
    return true;
}
