/**
 * @fileoverview Transforms membership redirect links to Memberstack v2 login actions.
 * Converts href="#/ms/membership/redirect" to href="#" data-ms-action="login-redirect"
 */

import { logger } from "@utils/logger";

export function transformMembershipRedirectLinks(): number {
    logger('trace', '[Adapter] Starting membership redirect links transformation');

    const redirectLinks = document.querySelectorAll('a[href="#/ms/membership/redirect"]');

    if (redirectLinks.length === 0) {
        logger('debug', '[Adapter] No membership redirect links found');
        return 0;
    }

    logger('warn', `[Adapter] Found ${redirectLinks.length} membership redirect links to transform`);

    let transformedCount = 0;

    redirectLinks.forEach(link => {
        const anchorElement = link as HTMLAnchorElement;

        // Transform the link
        anchorElement.href = '#';
        anchorElement.setAttribute('data-ms-action', 'login-redirect');

        transformedCount++;
    });

    logger('info', `[Adapter] Membership redirect links transformation completed. Transformed ${transformedCount} links`);
    return transformedCount;
}