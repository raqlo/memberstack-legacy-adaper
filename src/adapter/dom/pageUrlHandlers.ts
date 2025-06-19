/**
 * @fileoverview Handles full page URLs that contain signup hash fragments.
 * Logs these URLs for processing on destination pages rather than transforming them.
 *
 * @example
 * // Detected: <a href="/pricing#/ms/signup/mem_123">View Pricing</a>
 * // Action: Logged for processing when /pricing page loads
 *
 * @example
 * // Detected: <a href="/signup/#/ms/signup/mem_456">Complete Signup</a>
 * // Action: Logged, will be handled by destination page's adapter
 */


import {logger} from "@utils/logger";

export function handleSignupPageUrls(): number {
    logger('debug', '[Adapter] Handling signup page URLs');

    // Handle links that go to signup pages with hash - just log them, don't modify
    // This catches any URL containing #/ms/signup/ (with any prefix)
    const signupPageElements = document.querySelectorAll('a[href*="#/ms/signup/"]');

    // Filter out the ones that start with # (those are handled elsewhere)
    const pageUrlElements = Array.from(signupPageElements).filter(el => {
        const href = el.getAttribute('href');
        return href && !href.startsWith('#/ms/signup/');
    });

    if (pageUrlElements.length > 0) {
        logger('warn', `[Adapter] Found ${pageUrlElements.length} elements with signup page URLs that will be handled on the destination page`);

        pageUrlElements.forEach((el, index) => {
            const href = el.getAttribute("href");
            if (href) {
                const match = href.match(/#\/ms\/signup\/(.+)$/);
                if (match && match[1]) {
                    const extractedId = match[1];
                    logger('debug', `[Adapter] Signup page URL ${index + 1}: ${href} (ID: ${extractedId})`);
                } else {
                    logger('debug', `[Adapter] Signup page URL ${index + 1}: ${href} (no ID extracted)`);
                }
            }
        });

        logger('info', `[Adapter] Logged ${pageUrlElements.length} signup page URLs for processing on destination page`);
    }

    return pageUrlElements.length;
}