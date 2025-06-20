/**
 * @fileoverview Handles transformation of password reset URLs to modal attributes.
 * Converts old Memberstack v1 password reset URLs to v2 modal system.
 *
 * @example
 * // Before: <a href="#/ms/password-reset" class="password-link">I forgot my password</a>
 * // After: <a href="#" data-ms-modal="forgot-password" class="password-link">I forgot my password</a>
 */

import {logger} from "@utils/logger";

export function replacePasswordResetHref(el: HTMLElement) {
    logger('debug', '[Adapter] Replacing password reset href with modal');

    // Replace href with modal attribute
    el.setAttribute("href", "#");
    el.setAttribute("data-ms-modal", "forgot-password");

    logger('debug', '[Adapter] Successfully replaced password reset href with modal');
}

export function processPasswordResetUrls(): number {
    logger('debug', '[Adapter] Processing password reset URLs');

    const passwordResetElements = document.querySelectorAll('a[href="#/ms/password-reset"]');

    if (passwordResetElements.length > 0) {
        logger('warn', `[Adapter] Found ${passwordResetElements.length} elements with password reset href attributes that will be converted to modal`);

        passwordResetElements.forEach(el => {
            replacePasswordResetHref(el as HTMLElement);
        });
    }

    return passwordResetElements.length;
}