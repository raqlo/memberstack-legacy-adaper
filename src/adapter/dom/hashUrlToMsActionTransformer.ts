
/**
 * @fileoverview Transforms deprecated membership URLs to Memberstack v2 actions.
 * Converts legacy hash-based membership URLs to modern data-ms-action attributes.
 *
 * @example
 * // Before: <a href="#/ms/membership/redirect">Login</a>
 * // After:  <a href="#" data-ms-action="login-redirect">Login</a>
 *
 * @example
 * // Before: <a href="#/ms/member-page/default">Dashboard</a>
 * // After:  <a href="#" data-ms-action="login-redirect">Dashboard</a>
 *
 * @example
 * // Before: <a href="#/ms/logout">Logout</a>
 * // After:  <a href="#" data-ms-action="logout">Logout</a>
 */

import { logger } from "@utils/logger";

function transformLinks(selector: string, action: string, description: string): number {
    logger('trace', `[Adapter] Transforming ${description} links`);

    const links = document.querySelectorAll(selector);

    if (links.length === 0) {
        logger('debug', `[Adapter] No ${description} links found`);
        return 0;
    }

    logger('warn', `[Adapter] [Deprecated URL] Found ${links.length} ${description} links to transform`);

    let transformedCount = 0;

    links.forEach(link => {
        const anchorElement = link as HTMLAnchorElement;
        const originalHref = anchorElement.href;

        // Transform the link
        anchorElement.href = '#';
        anchorElement.setAttribute('data-ms-action', action);

        logger('debug', `[Adapter] Transformed ${description} link from "${originalHref}" to ${action} action`);
        transformedCount++;
    });

    return transformedCount;
}

function transformLoginRedirectLinks(): number {
    logger('trace', '[Adapter] Starting login redirect links transformation');

    let totalTransformed = 0;

    // Transform membership redirect links
    totalTransformed += transformLinks(
        'a[href="#/ms/membership/redirect"]',
        'login-redirect',
        'membership redirect'
    );

    // Transform member page redirect links
    totalTransformed += transformLinks(
        'a[href="#/ms/member-page/default"]',
        'login-redirect',
        'member page redirect'
    );

    if (totalTransformed > 0) {
        logger('info', `[Adapter] Login redirect links transformation completed. Transformed ${totalTransformed} links`);
    }

    return totalTransformed;
}

function transformLogoutLinks(): number {
    logger('trace', '[Adapter] Starting logout links transformation');

    const transformedCount = transformLinks(
        'a[href="#/ms/logout"]',
        'logout',
        'logout'
    );

    if (transformedCount > 0) {
        logger('info', `[Adapter] Logout links transformation completed. Transformed ${transformedCount} links`);
    }

    return transformedCount;
}

export function transformMembershipRedirectLinks(): number {
    logger('trace', '[Adapter] Starting membership links transformation');

    const loginRedirectCount = transformLoginRedirectLinks();
    const logoutCount = transformLogoutLinks();
    const totalTransformed = loginRedirectCount + logoutCount;

    if (totalTransformed === 0) {
        logger('debug', '[Adapter] No membership links found to transform');
    } else {
        logger('info', `[Adapter] All membership links transformation completed. Total transformed: ${totalTransformed} links`);
    }

    return totalTransformed;
}