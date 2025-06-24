/**
 * @fileoverview Handles transformation of URLs with hash fragments containing /signup/ paths.
 * Converts URLs like "/pricing#/ms/signup/prc_123" to clean URLs with appropriate plan attributes.
 * Only processes URLs that have a base path before the hash (not hash-only URLs).
 *
 * @example
 * // Before: <a href="/pricing#/ms/signup/prc_123">View Pricing</a>
 * // After: <a href="/pricing" data-ms-plan:price="prc_456">View Pricing</a>
 *
 * @example
 * // Before: <a href="/plans#/ms/signup/pln_789">Subscribe</a>
 * // After: <a href="/plans" data-ms-plan:add="pln_456">Subscribe</a>
 */

import {logger} from "@utils/logger";
import {getPlanAttribute} from "./planAttributeHelpers";

export function replaceRelativeUrlWithHashSignup(
    el: HTMLElement,
    baseUrl: string,
    extractedId: string,
    importedMemberships: Record<string, string>
) {
    logger('debug', `[Adapter] Replacing URL hash signup for base URL: ${baseUrl}, extracted ID: ${extractedId}`);

    const newId = importedMemberships[extractedId];
    if (!newId) {
        logger('error', `[Adapter] URL hash signup ID "${extractedId}" not found in importedMemberships mapping`);
        return;
    }

    const attr = getPlanAttribute(newId);
    if (!attr) {
        logger('error', `[Adapter] Invalid new signup ID format "${newId}" for old ID "${extractedId}"`);
        return;
    }

    // Replace href with clean URL and add appropriate plan attribute
    el.setAttribute("href", baseUrl);
    el.setAttribute(attr, newId);

    logger('debug', `[Adapter] Successfully replaced URL hash signup: ${baseUrl}#/ms/signup/${extractedId} -> ${baseUrl} with ${attr}="${newId}"`);
}

export function processRelativeUrlWithHashUrls(importedMemberships: Record<string, string>): number {
    logger('debug', '[Adapter] Processing URL hash signup URLs');

    const signupElements = document.querySelectorAll('a[href*="#/ms/signup/"]');

    // Filter out hash-only URLs to avoid conflict with hashUrlToModalTransformer.ts
    const relativeUrlsWithHash = Array.from(signupElements).filter(el => {
        const href = el.getAttribute("href");
        return href && !href.startsWith("#");
    });

    if (relativeUrlsWithHash.length > 0) {
        logger('warn', `[Adapter] Found ${relativeUrlsWithHash.length} elements with URL hash signup href attributes that will be converted`);

        relativeUrlsWithHash.forEach(el => {
            const href = el.getAttribute("href");
            if (href) {
                // Match pattern: /some/path#/ms/signup/id
                const match = href.match(/^(.+)#\/ms\/signup\/(.+)$/);
                if (match && match[1] && match[2]) {
                    const baseUrl = match[1];
                    const extractedId = match[2];
                    replaceRelativeUrlWithHashSignup(el as HTMLElement, baseUrl, extractedId, importedMemberships);
                } else {
                    logger('error', `[Adapter] Failed to extract base URL and ID from href: ${href}`);
                }
            }
        });
    }

    return relativeUrlsWithHash.length;
}