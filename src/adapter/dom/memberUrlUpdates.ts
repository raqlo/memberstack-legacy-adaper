/**
 * @fileoverview Handles login URL to profile URL conversions for authenticated members.
 * Converts login links to profile page links when member is already logged in.
 *
 * @example
 * // Before: <a href="/login">My Account</a>
 * // After:  <a href="/profile-page">My Account</a> (when authenticated)
 *
 * @example
 * // Before: <a href="/auth/signin">Login</a>
 * // After:  <a href="/profile-page">Login</a> (when authenticated)
 */

import {logger} from "@utils/logger";
import {isMemberAuthV2} from "@utils/sessions";

export function updateLoginUrlsToProfile(loginUrl?: string): number {
    if (!loginUrl) {
        logger('debug', '[Adapter] No login URL provided, skipping login URL to profile update');
        return 0;
    }

    logger('info', '[Adapter] Starting login URL to profile update process');

    // Check if member is authenticated
    if (!isMemberAuthV2()) {
        logger('debug', '[Adapter] Member not authenticated, skipping login URL updates');
        return 0;
    }

    // Find all elements with href matching the login URL
    const loginElements = document.querySelectorAll(`a[href="${loginUrl}"]`);

    if (loginElements.length === 0) {
        logger('debug', `[Adapter] No elements with login URL "${loginUrl}" found`);
        return 0;
    }

    logger('warn', `[Adapter] Found ${loginElements.length} elements with login URL that need profile URL update`);

    loginElements.forEach(el => {
        const linkElement = el as HTMLAnchorElement;
        linkElement.href = '/profile-page';
        logger('debug', `[Adapter] Updated login URL to profile URL for ${linkElement.tagName} element`);
    });

    logger('info', `[Adapter] Login URL to profile update completed. Updated ${loginElements.length} elements`);
    return loginElements.length;
}