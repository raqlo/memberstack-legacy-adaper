/**
 * @fileoverview Handles transformation of content-based URLs (#/ms/content/) into content attributes.
 * Converts old Memberstack v1 content URLs to v2 content system.
 *
 * @example
 * // Before: <a href="/pricing#/ms/content/members">You are logged in - hidden link</a>
 * // After: <a href="/pricing" data-ms-content="members">You are logged in - hidden link</a>
 *
 * @example
 * // Before: <a href="/dashboard#/ms/content/premium">Premium Content</a>
 * // After: <a href="/dashboard" data-ms-content="premium">Premium Content</a>
 */

import {logger} from "@utils/logger";

export function replaceContentHref(el: HTMLElement, baseUrl: string, contentType: string) {
    logger('debug', `[Adapter] Replacing content href for type: ${contentType}`);

    // Replace href with base URL and add content attribute
    el.setAttribute("href", baseUrl);
    el.setAttribute("data-ms-content", contentType);

    logger('debug', `[Adapter] Successfully replaced content href: ${baseUrl}#/ms/content/${contentType} -> ${baseUrl} with data-ms-content="${contentType}"`);
}

export function processContentUrls(): number {
    logger('debug', '[Adapter] Processing content URLs');

    const contentElements = document.querySelectorAll('a[href*="#/ms/content/"]');

    if (contentElements.length > 0) {
        logger('warn', `[Adapter] Found ${contentElements.length} elements with content href attributes that will be converted to data-ms-content`);

        contentElements.forEach(el => {
            const href = el.getAttribute("href");
            if (href) {
                const match = href.match(/^(.+)#\/ms\/content\/(.+)$/);
                if (match && match[1] && match[2]) {
                    const baseUrl = match[1];
                    const contentType = match[2];
                    replaceContentHref(el as HTMLElement, baseUrl, contentType);
                } else {
                    logger('error', `[Adapter] Failed to extract content info from href: ${href}`);
                }
            }
        });
    }

    return contentElements.length;
}