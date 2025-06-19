
/**
 * @fileoverview Handles data-ms-rewrite attributes for authenticated members.
 * Replaces element content with rewrite values when member is logged in.
 *
 * @example
 * // Before: <span data-ms-rewrite="Welcome back!">Login</span>
 * // After:  <span data-ms-rewrite="Welcome back!">Welcome back!</span>
 *
 * @example
 * // Before: <button data-ms-rewrite="Go to Dashboard">Sign Up</button>
 * // After:  <button data-ms-rewrite="Go to Dashboard">Go to Dashboard</button>
 */

import {logger} from "@utils/logger";
import {isMemberAuthV2} from "@utils/sessions";

export function updateRewriteAttributes(): number {
    logger('debug', '[Adapter] Starting rewrite attributes update process');

    // Find all elements with data-ms-rewrite attribute
    const rewriteElements = document.querySelectorAll("[data-ms-rewrite]");

    if (rewriteElements.length === 0) {
        logger('debug', '[Adapter] No elements with data-ms-rewrite attribute found');
        return 0;
    }

    logger('warn', `[Adapter] Found ${rewriteElements.length} elements with data-ms-rewrite attribute`);

    // Check if member is authenticated
    if (!isMemberAuthV2()) {
        logger('debug', '[Adapter] Member not authenticated, skipping rewrite attributes update');
        return 0;
    }

    let updatedCount = 0;
    rewriteElements.forEach(el => {
        const rewriteValue = el.getAttribute("data-ms-rewrite");
        if (rewriteValue) {
            // Replace the element's content with the rewrite value
            el.textContent = rewriteValue;
            updatedCount++;
            logger('debug', `[Adapter] Updated element content to: "${rewriteValue}"`);
        } else {
            logger('debug', '[Adapter] Element has empty data-ms-rewrite attribute, skipping');
        }
    });

    logger('info', `[Adapter] Rewrite attributes update completed. Updated ${updatedCount} elements`);
    return updatedCount;
}