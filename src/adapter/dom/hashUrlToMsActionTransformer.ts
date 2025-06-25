
/**
 * @fileoverview Transforms deprecated membership URLs to Memberstack v2 login actions.
 * Converts legacy hash-based membership URLs to modern data-ms-action attributes.
 *
 * @example
 * // Before: <a href="#/ms/membership/redirect">Login</a>
 * // After:  <a href="#" data-ms-action="login-redirect">Login</a>
 *
 * @example
 * // Before: <a href="#/ms/member-page/default">Dashboard</a>
 * // After:  <a href="#" data-ms-action="login-redirect">Dashboard</a>
 */

import { logger } from "@utils/logger";

export function transformMembershipRedirectLinks(): number {
    logger('trace', '[Adapter] Starting membership redirect links transformation');

    // Query for both types of redirect links
    const redirectLinks = document.querySelectorAll('a[href="#/ms/membership/redirect"], a[href="#/ms/member-page/default"]');

    if (redirectLinks.length === 0) {
        logger('debug', '[Adapter] No membership redirect links found');
        return 0;
    }

    logger('warn', `[Adapter] [Deprecated URL] Found ${redirectLinks.length} membership redirect links to transform`);

    let transformedCount = 0;

    redirectLinks.forEach(link => {
        const anchorElement = link as HTMLAnchorElement;
        const originalHref = anchorElement.href;

        // Transform the link
        anchorElement.href = '#';
        anchorElement.setAttribute('data-ms-action', 'login-redirect');

        logger('debug', `[Adapter] Transformed link from "${originalHref}" to login-redirect action`);
        transformedCount++;
    });

    logger('info', `[Adapter] Membership redirect links transformation completed. Transformed ${transformedCount} links`);
    return transformedCount;
}